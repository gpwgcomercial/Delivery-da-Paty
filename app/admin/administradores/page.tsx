import { createClient } from '@/lib/supabase/server';
import { addAdmin, removeAdmin } from '@/lib/actions/admin';

const ROLE_LABELS: Record<string, string> = { master: 'ADM Mestre', admin: 'Administrador', editor: 'Editor' };

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentAdmin } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user!.id)
    .maybeSingle();
  const isMaster = currentAdmin?.role === 'master';

  const { data: admins } = await supabase
    .from('admin_profiles')
    .select('id, full_name, role')
    .order('full_name');

  return (
    <div>
      <h1 className="font-display text-2xl text-primaryDeep">Administradores</h1>
      <p className="mb-6 mt-1 text-sm text-inkSoft">Contas com acesso ao painel administrativo.</p>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      {!isMaster && (
        <p className="mb-4 rounded-s bg-accentSoft px-3 py-2 text-sm text-primaryDeep">
          Você pode visualizar a equipe, mas só o Admin Mestre cria ou remove administradores.
        </p>
      )}

      {isMaster && (
        <form action={addAdmin} className="mb-6 flex flex-wrap items-end gap-2 rounded-m border border-line bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-inkSoft">Nome</label>
            <input name="full_name" required className="rounded-s border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-inkSoft">E-mail</label>
            <input name="email" type="email" required className="rounded-s border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-inkSoft">Papel</label>
            <select name="role" className="rounded-s border border-line px-3 py-2 text-sm">
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
              <option value="master">ADM Mestre</option>
            </select>
          </div>
          <button className="rounded-s bg-accent px-4 py-2 text-sm font-bold text-white">
            + Convidar administrador
          </button>
        </form>
      )}

      <table className="w-full overflow-hidden rounded-m border border-line bg-surface text-sm">
        <thead>
          <tr className="border-b border-line bg-bg text-xs text-inkSoft">
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-4 py-3 text-left">Papel</th>
            {isMaster && <th className="px-4 py-3 text-left">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {admins?.map((admin) => (
            <tr key={admin.id} className="border-b border-line last:border-none">
              <td className="px-4 py-3">{admin.full_name}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accentSoft px-2.5 py-1 text-xs font-bold text-primaryDeep">
                  {ROLE_LABELS[admin.role]}
                </span>
              </td>
              {isMaster && (
                <td className="px-4 py-3">
                  <form action={removeAdmin}>
                    <input type="hidden" name="admin_profile_id" value={admin.id} />
                    <button className="rounded-s border border-dangerSoft px-3 py-1.5 text-xs font-semibold text-danger">
                      Remover
                    </button>
                  </form>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
