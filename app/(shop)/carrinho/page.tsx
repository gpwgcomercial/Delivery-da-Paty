import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CartItemRow from '@/components/CartItemRow';

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="mb-4 text-sm text-inkSoft">Entre na sua conta para ver o carrinho.</p>
        <Link href="/login" className="rounded-s bg-accent px-6 py-3 text-sm font-bold text-white">
          Fazer login
        </Link>
      </main>
    );
  }

  const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle();
  if (!client) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center text-sm text-inkSoft">
        Só clientes têm carrinho de compras.
      </main>
    );
  }

  const { data: carts } = await supabase
    .from('carts')
    .select('id, store_id, stores(store_name, min_order_value, delivery_fee), cart_items(*, menu_items(name))')
    .eq('client_id', client.id);

  const nonEmptyCarts = (carts ?? []).filter((c: any) => c.cart_items && c.cart_items.length > 0);

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <h1 className="mb-5 font-display text-2xl text-primaryDeep">Seu carrinho</h1>

      {nonEmptyCarts.length === 0 && (
        <p className="rounded-m border border-line bg-surface p-4 text-sm text-inkSoft">
          Seu carrinho está vazio. <Link href="/" className="font-bold text-primary">Ver lojas</Link>
        </p>
      )}

      <div className="flex flex-col gap-6">
        {nonEmptyCarts.map((cart: any) => {
          const subtotal = cart.cart_items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0);
          const minOrder = cart.stores.min_order_value ?? 0;
          const belowMin = subtotal < minOrder;

          return (
            <div key={cart.id}>
              <div className="mb-1 text-sm font-bold text-inkSoft">{cart.stores.store_name}</div>

              {cart.cart_items.map((item: any) => (
                <CartItemRow
                  key={item.id}
                  id={item.id}
                  name={item.menu_items?.name ?? 'Item'}
                  variationLabel={item.variation_label}
                  quantity={item.quantity}
                  unitPrice={item.unit_price}
                />
              ))}

              {belowMin && (
                <p className="my-3 rounded-s bg-warnSoft px-3 py-2 text-sm font-bold text-warn">
                  Falta R$ {(minOrder - subtotal).toFixed(2).replace('.', ',')} para atingir o pedido
                  mínimo de R$ {minOrder.toFixed(2).replace('.', ',')} desta loja.
                </p>
              )}

              <div className="mt-3 rounded-m border border-line bg-surface p-4">
                <Row label="Subtotal" value={`R$ ${subtotal.toFixed(2).replace('.', ',')}`} />
                <Row
                  label="Taxa de entrega"
                  value={cart.stores.delivery_fee ? `R$ ${cart.stores.delivery_fee.toFixed(2).replace('.', ',')}` : 'Grátis'}
                />
                <Row
                  label="Total"
                  value={`R$ ${(subtotal + (cart.stores.delivery_fee ?? 0)).toFixed(2).replace('.', ',')}`}
                  bold
                />
              </div>

              {belowMin ? (
                <button disabled className="mt-3 w-full rounded-s bg-accent py-3 text-sm font-bold text-white opacity-40">
                  Ir para o checkout
                </button>
              ) : (
                <Link
                  href={`/checkout/${cart.id}`}
                  className="mt-3 block w-full rounded-s bg-accent py-3 text-center text-sm font-bold text-white"
                >
                  Ir para o checkout
                </Link>
              )}
            </div>
          );
        })}
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
