import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/lib/actions/auth';

const ROLE_LABELS = { master: 'ADM Mestre', admin: 'Administrador', editor: 'Editor' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminProfile) redirect('/login');

  const role = adminProfile.role as 'master' | 'admin' | 'editor';

  const { count: pendingCount } = await supabase
    .from('stores')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'pending');

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-line bg-surface p-4">
        <div className="mb-6 font-display text-sm font-bold text-primaryDeep">Painel · Paty</div>

        <NavItem href="/admin/lojas-pendentes" label="Lojas pendentes" badge={pendingCount ?? 0} />
        <NavItem href="/admin/lojas" label="Lojas ativas" />
        <NavItem href="/admin/clientes" label="Clientes" />
        {role !== 'editor' && <NavItem href="/admin/administradores" label="Administradores" />}

        <div className="mt-auto border-t border-line pt-3 text-xs text-inkSoft">
          <b className="block text-sm text-ink">{adminProfile.full_name}</b>
          {ROLE_LABELS[role]}
          <form action={logout} className="mt-2">
            <button className="text-xs font-bold text-primary">Sair</button>
          </form>
        </div>
      </aside>

      <main className="max-w-3xl flex-1 p-8">{children}</main>
    </div>
  );
}

function NavItem({ href, label, badge }: { href: string; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      className="mb-0.5 flex items-center justify-between rounded-s px-3 py-2.5 text-sm font-semibold text-inkSoft hover:bg-bg"
    >
      {label}
      {!!badge && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>
      )}
    </Link>
  );
}
