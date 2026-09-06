import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CheckoutForm from '@/components/CheckoutForm';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ cartId: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { cartId } = await params;
  const { erro } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: client } = await supabase
    .from('clients')
    .select('id, address_id, addresses(street, number, neighborhood, city, state)')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!client) redirect('/login');

  const { data: cart } = await supabase
    .from('carts')
    .select('id, client_id, stores(store_name, min_order_value, delivery_fee), cart_items(*, menu_items(name))')
    .eq('id', cartId)
    .maybeSingle();

  if (!cart || cart.client_id !== client.id) notFound();

  const items = (cart as any).cart_items as any[];
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const deliveryFee = (cart as any).stores.delivery_fee ?? 0;
  const address = (client as any).addresses;

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <h1 className="mb-5 font-display text-2xl text-primaryDeep">Checkout</h1>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      <p className="mb-1 text-xs font-bold text-inkSoft">Endereço de entrega</p>
      <div className="mb-4 rounded-m border border-accent bg-surface p-3.5 shadow-[0_0_0_1px_theme(colors.accent)]">
        <b className="block text-sm">
          {address?.street}, {address?.number}
        </b>
        <span className="text-xs text-inkSoft">
          {address?.neighborhood}, {address?.city}/{address?.state}
        </span>
      </div>

      <CheckoutForm cartId={cartId} />

      <div className="mt-5 rounded-m border border-line bg-surface p-4">
        <Row label="Subtotal" value={`R$ ${subtotal.toFixed(2).replace('.', ',')}`} />
        <Row label="Taxa de entrega" value={deliveryFee ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'} />
        <Row label="Total" value={`R$ ${(subtotal + deliveryFee).toFixed(2).replace('.', ',')}`} bold />
      </div>
    </main>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${bold ? 'mt-1.5 border-t border-line pt-3 font-bold text-ink' : 'text-inkSoft'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
