'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cartId = String(formData.get('cart_id'));
  const paymentMethod = String(formData.get('payment_method')) as 'pix' | 'card' | 'cash';
  const cashChangeForRaw = String(formData.get('cash_change_for') || '').trim();
  const cashChangeFor = paymentMethod === 'cash' && cashChangeForRaw ? Number(cashChangeForRaw) : null;

  const { data: client } = await supabase.from('clients').select('id, address_id').eq('user_id', user.id).maybeSingle();
  if (!client) redirect('/login');

  const { data: cart } = await supabase
    .from('carts')
    .select('id, store_id, client_id, stores(min_order_value, delivery_fee), cart_items(*, menu_items(name))')
    .eq('id', cartId)
    .single();

  if (!cart || cart.client_id !== client.id) {
    redirect('/carrinho?erro=' + encodeURIComponent('Carrinho não encontrado'));
  }

  const items = (cart as any).cart_items as any[];
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const minOrder = (cart as any).stores.min_order_value ?? 0;

  if (subtotal < minOrder) {
    redirect(`/carrinho?erro=${encodeURIComponent('Pedido abaixo do valor mínimo desta loja')}`);
  }

  const deliveryFee = (cart as any).stores.delivery_fee ?? 0;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id: client.id,
      store_id: cart.store_id,
      delivery_address_id: client.address_id,
      status: 'pending',
      subtotal,
      delivery_fee: deliveryFee,
      total: subtotal + deliveryFee,
      payment_method: paymentMethod,
      cash_change_for: cashChangeFor,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    redirect(`/checkout/${cartId}?erro=${encodeURIComponent('Não foi possível criar o pedido — a loja ainda está aprovada?')}`);
  }

  const orderItemsPayload = items.map((i) => ({
    order_id: order!.id,
    menu_item_id: i.menu_item_id,
    item_name: i.menu_items?.name ?? 'Item',
    variation_label: i.variation_label,
    unit_price: i.unit_price,
    quantity: i.quantity,
    subtotal: i.unit_price * i.quantity,
  }));
  await supabase.from('order_items').insert(orderItemsPayload);

  // apagar o carrinho já resolve os cart_items em cascata
  await supabase.from('carts').delete().eq('id', cartId);

  redirect(`/pedido/${order!.id}`);
}
