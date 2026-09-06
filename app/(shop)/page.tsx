import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Store } from '@/lib/types';

export default async function HomePage() {
  const supabase = await createClient();

  // A policy de RLS "lojas aprovadas são públicas" já garante que só
  // aparecem aqui lojas com approval_status = 'approved'.
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('status', 'open')
    .order('store_name');

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-6">
      <h1 className="font-display text-2xl text-primaryDeep">Lojas abertas agora</h1>
      <p className="mb-6 mt-1 text-sm text-inkSoft">Escolha uma loja parceira para ver o cardápio.</p>

      {(!stores || stores.length === 0) && (
        <p className="rounded-m border border-line bg-surface p-4 text-sm text-inkSoft">
          Nenhuma loja aprovada por aqui ainda.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {stores?.map((store: Store) => (
          <Link
            key={store.id}
            href={`/loja/${store.id}`}
            className="flex items-center gap-3 rounded-m border border-line bg-surface p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-xl">
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt={store.store_name} className="h-full w-full rounded-full object-cover" />
              ) : (
                '🍽️'
              )}
            </div>
            <div>
              <b className="font-display text-primaryDeep">{store.store_name}</b>
              <div className="text-xs text-inkSoft">
                Pedido mínimo R$ {store.min_order_value.toFixed(2).replace('.', ',')} ·{' '}
                {store.delivery_fee ? `Frete R$ ${store.delivery_fee.toFixed(2).replace('.', ',')}` : 'Frete grátis'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
