'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function getOrCreateClientId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?erro=' + encodeURIComponent('Entre para continuar'));

  const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle();
  if (!client) redirect('/login');
  return client.id;
}

export async function addToCart(params: {
  storeId: string;
  menuItemId: string;
  unitPrice: number;
  variationId?: string | null;
  variationLabel?: string | null;
}) {
  const supabase = await createClient();
  const clientId = await getOrCreateClientId();

  let { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('client_id', clientId)
    .eq('store_id', params.storeId)
    .maybeSingle();

  if (!cart) {
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ client_id: clientId, store_id: params.storeId })
      .select('id')
      .single();
    if (error || !newCart) throw new Error('Não foi possível criar o carrinho');
    cart = newCart;
  }

  // se o mesmo item (com a mesma variação) já está no carrinho, só soma 1
  let existingQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('menu_item_id', params.menuItemId);
  existingQuery = params.variationId
    ? existingQuery.eq('variation_id', params.variationId)
    : existingQuery.is('variation_id', null);
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
  } else {
    await supabase.from('cart_items').insert({
      cart_id: cart.id,
      menu_item_id: params.menuItemId,
      variation_id: params.variationId ?? null,
      variation_label: params.variationLabel ?? null,
      quantity: 1,
      unit_price: params.unitPrice,
    });
  }

  revalidatePath('/carrinho');
  revalidatePath('/', 'layout');
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const supabase = await createClient();
  await getOrCreateClientId(); // garante que há uma sessão de cliente válida

  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', cartItemId);
  } else {
    await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
  }

  revalidatePath('/carrinho');
  revalidatePath('/', 'layout');
}
