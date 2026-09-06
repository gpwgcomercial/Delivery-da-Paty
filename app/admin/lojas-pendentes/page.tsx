import { createClient } from '@/lib/supabase/server';
import { approveStore, rejectStore } from '@/lib/actions/admin';

export default async function PendingStoresPage({
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
  const isMaster = adminProfile?.role === 'master';

  const { data: stores } = await supabase
    .from('stores')
    .select('id, store_name, responsible_name, responsible_email, created_at')
    .eq('approval_status', 'pending')
    .order('created_at');

  return (
    <div>
      <h1 className="font-display text-2xl text-primaryDeep">Lojas pendentes</h1>
      <p className="mb-6 mt-1 text-sm text-inkSoft">
        Cadastros aguardando aprovação antes de ficarem visíveis para os clientes.
      </p>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      {(!stores || stores.length === 0) && (
        <p className="rounded-m border border-line bg-surface p-4 text-sm text-inkSoft">
          Nenhuma loja pendente no momento.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {stores?.map((store) => (
          <div key={store.id} className="flex flex-wrap items-center justify-between gap-4 rounded-m border border-line bg-surface p-4">
            <div>
              <b className="font-display text-primaryDeep">{store.store_name}</b>
              <div className="text-sm text-inkSoft">
                Responsável: {store.responsible_name} · {store.responsible_email}
                <br />
                Enviado em {new Date(store.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {isMaster ? (
              <div className="flex flex-col gap-2">
                <form action={approveStore}>
                  <input type="hidden" name="store_id" value={store.id} />
                  <button className="w-full rounded-s bg-ok px-4 py-2 text-sm font-bold text-white">
                    Aprovar loja
                  </button>
                </form>
                <form action={rejectStore}>
                  <input type="hidden" name="store_id" value={store.id} />
                  <button className="w-full rounded-s border border-danger px-4 py-2 text-sm font-bold text-danger">
                    Reprovar
                  </button>
                </form>
              </div>
            ) : (
              <span className="text-xs italic text-inkSoft">Somente o Admin Mestre pode decidir</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
