'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminProfile) redirect('/login');

  return adminProfile.role as 'master' | 'admin' | 'editor';
}

// A RLS + o trigger do banco já recusam se quem chamar não for o
// ADM MESTRE — esta é só a camada de UI, a garantia real está no schema.
export async function approveStore(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const storeId = String(formData.get('store_id'));

  const { error } = await supabase.from('stores').update({ approval_status: 'approved' }).eq('id', storeId);
  if (error) {
    redirect(`/admin/lojas-pendentes?erro=${encodeURIComponent('Só o Admin Mestre pode aprovar lojas')}`);
  }

  revalidatePath('/admin/lojas-pendentes');
  revalidatePath('/admin/lojas');
  revalidatePath('/');
}

export async function rejectStore(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const storeId = String(formData.get('store_id'));

  const { error } = await supabase
    .from('stores')
    .update({ approval_status: 'rejected', rejection_reason: 'Reprovado pelo Admin Mestre' })
    .eq('id', storeId);
  if (error) {
    redirect(`/admin/lojas-pendentes?erro=${encodeURIComponent('Só o Admin Mestre pode reprovar lojas')}`);
  }

  revalidatePath('/admin/lojas-pendentes');
}

export async function deleteStore(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const storeId = String(formData.get('store_id'));

  const { error } = await supabase.from('stores').delete().eq('id', storeId);
  if (error) {
    redirect(`/admin/lojas?erro=${encodeURIComponent('Editor não pode apagar lojas')}`);
  }
  revalidatePath('/admin/lojas');
}

export async function deleteClient(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const clientId = String(formData.get('client_id'));

  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) {
    redirect(`/admin/clientes?erro=${encodeURIComponent('Editor não pode apagar clientes')}`);
  }
  revalidatePath('/admin/clientes');
}

export async function addAdmin(formData: FormData) {
  await requireAdmin(); // dupla checagem — a RLS também exige role = master pra escrever

  const email = String(formData.get('email'));
  const fullName = String(formData.get('full_name'));
  const role = String(formData.get('role')) as 'master' | 'admin' | 'editor';

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { user_type: 'admin' },
  });
  if (error || !data.user) {
    redirect(`/admin/administradores?erro=${encodeURIComponent(error?.message ?? 'Erro ao convidar administrador')}`);
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from('admin_profiles')
    .insert({ user_id: data.user!.id, role, full_name: fullName });
  if (insertError) {
    redirect(`/admin/administradores?erro=${encodeURIComponent('Só o Admin Mestre pode adicionar administradores')}`);
  }

  revalidatePath('/admin/administradores');
}

export async function removeAdmin(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const adminProfileId = String(formData.get('admin_profile_id'));

  const { error } = await supabase.from('admin_profiles').delete().eq('id', adminProfileId);
  if (error) {
    redirect(`/admin/administradores?erro=${encodeURIComponent('Só o Admin Mestre pode remover administradores')}`);
  }
  revalidatePath('/admin/administradores');
}
