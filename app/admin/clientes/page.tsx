import { createClient } from '@/lib/supabase/server';
import { deleteClient } from '@/lib/actions/admin';

export default async function ClientsPage({
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

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, phone')
    .order('full_name');

  return (
    <div>
      <h1 className="font-display text-2xl text-primaryDeep">Clientes</h1>
      <p className="mb-6 mt-1 text-sm text-inkSoft">Todos os clientes cadastrados na plataforma.</p>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      <table className="w-full overflow-hidden rounded-m border border-line bg-surface text-sm">
        <thead>
          <tr className="border-b border-line bg-bg text-xs text-inkSoft">
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-4 py-3 text-left">Telefone</th>
            <th className="px-4 py-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clients?.map((client) => (
            <tr key={client.id} className="border-b border-line last:border-none">
              <td className="px-4 py-3">{client.full_name ?? '—'}</td>
              <td className="px-4 py-3">{client.phone}</td>
              <td className="px-4 py-3">
                <form action={deleteClient}>
                  <input type="hidden" name="client_id" value={client.id} />
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
