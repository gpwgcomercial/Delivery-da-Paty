import { createClient } from '@/lib/supabase/server';
import { deleteStore } from '@/lib/actions/admin';

export default async function ActiveStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user!.id)
    .maybeSingle();
  const canDelete = adminProfile?.role !== 'editor';

  const { data: stores } = await supabase
    .from('stores')
    .select('id, store_name, responsible_name, status, min_order_value')
    .eq('approval_status', 'approved')
    .order('store_name');

  return (
    <div>
      <h1 className="font-display text-2xl text-primaryDeep">Lojas ativas</h1>
      <p className="mb-6 mt-1 text-sm text-inkSoft">Lojas já aprovadas e visíveis na plataforma.</p>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      <table className="w-full overflow-hidden rounded-m border border-line bg-surface text-sm">
        <thead>
          <tr className="border-b border-line bg-bg text-xs text-inkSoft">
            <th className="px-4 py-3 text-left">Loja</th>
            <th className="px-4 py-3 text-left">Responsável</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Pedido mínimo</th>
            <th className="px-4 py-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {stores?.map((store) => (
            <tr key={store.id} className="border-b border-line last:border-none">
              <td className="px-4 py-3">{store.store_name}</td>
              <td className="px-4 py-3">{store.responsible_name}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-okSoft px-2.5 py-1 text-xs font-bold text-ok">
                  {store.status === 'open' ? 'Aberta' : 'Pausada'}
                </span>
              </td>
              <td className="px-4 py-3">R$ {store.min_order_value.toFixed(2).replace('.', ',')}</td>
              <td className="px-4 py-3">
                <form action={deleteStore}>
                  <input type="hidden" name="store_id" value={store.id} />
                  <button
                    disabled={!canDelete}
                    className="rounded-s border border-dangerSoft px-3 py-1.5 text-xs font-semibold text-danger disabled:opacity-30"
                  >
                    Apagar
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
