'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    redirect(`/login?erro=${encodeURIComponent(error?.message ?? 'Não foi possível entrar')}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', data.user!.id)
    .maybeSingle();

  revalidatePath('/', 'layout');
  redirect(profile?.user_type === 'admin' ? '/admin' : '/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email'));
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // Não revelamos se o e-mail existe ou não — mensagem genérica sempre.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/recuperar-senha/nova-senha`,
  });

  redirect('/recuperar-senha?enviado=1');
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get('password'));

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/recuperar-senha/nova-senha?erro=${encodeURIComponent(error.message)}`);
  }

  redirect('/login');
}

export async function signUpClient(formData: FormData) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const phone = String(formData.get('phone'));
  const fullName = String(formData.get('full_name') || '') || null;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { user_type: 'client' },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (signUpError || !signUpData.user) {
    redirect(`/cadastro/cliente?erro=${encodeURIComponent(signUpError?.message ?? 'Erro ao criar conta')}`);
  }

  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .insert({
      street: String(formData.get('street')),
      number: String(formData.get('number')),
      neighborhood: String(formData.get('neighborhood')),
      city: String(formData.get('city')),
      state: String(formData.get('state')),
      zip_code: String(formData.get('zip_code')),
    })
    .select('id')
    .single();
  if (addressError || !address) {
    redirect(`/cadastro/cliente?erro=${encodeURIComponent('Não foi possível salvar o endereço')}`);
  }

  const { error: clientError } = await supabase.from('clients').insert({
    user_id: signUpData.user.id,
    full_name: fullName,
    phone,
    address_id: address.id,
  });
  if (clientError) {
    redirect(`/cadastro/cliente?erro=${encodeURIComponent(clientError.message)}`);
  }

  redirect('/cadastro/sucesso?tipo=cliente');
}

export async function signUpStore(formData: FormData) {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const usesResponsibleAddress = formData.get('uses_responsible_address') === 'on';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { user_type: 'store' },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (signUpError || !signUpData.user) {
    redirect(`/cadastro/loja?erro=${encodeURIComponent(signUpError?.message ?? 'Erro ao criar conta')}`);
  }

  const { data: responsibleAddress, error: respAddrError } = await supabase
    .from('addresses')
    .insert({
      street: String(formData.get('resp_street')),
      number: String(formData.get('resp_number')),
      neighborhood: String(formData.get('resp_neighborhood')),
      city: String(formData.get('resp_city')),
      state: String(formData.get('resp_state')),
      zip_code: String(formData.get('resp_zip_code')),
    })
    .select('id')
    .single();
  if (respAddrError || !responsibleAddress) {
    redirect(`/cadastro/loja?erro=${encodeURIComponent('Não foi possível salvar o endereço do responsável')}`);
  }

  let storeAddressId: string | null = null;
  if (!usesResponsibleAddress) {
    const { data: storeAddress, error: storeAddrError } = await supabase
      .from('addresses')
      .insert({
        street: String(formData.get('store_street')),
        number: String(formData.get('store_number')),
        neighborhood: String(formData.get('store_neighborhood')),
        city: String(formData.get('store_city')),
        state: String(formData.get('store_state')),
        zip_code: String(formData.get('store_zip_code')),
      })
      .select('id')
      .single();
    if (storeAddrError || !storeAddress) {
      redirect(`/cadastro/loja?erro=${encodeURIComponent('Não foi possível salvar o endereço da loja')}`);
    }
    storeAddressId = storeAddress!.id;
  }

  const { error: storeError } = await supabase.from('stores').insert({
    user_id: signUpData.user.id,
    responsible_name: String(formData.get('responsible_name')),
    responsible_email: email,
    responsible_phone: String(formData.get('responsible_phone')),
    responsible_address_id: responsibleAddress.id,
    store_name: String(formData.get('store_name')),
    uses_responsible_address: usesResponsibleAddress,
    store_address_id: storeAddressId,
  });
  if (storeError) {
    redirect(`/cadastro/loja?erro=${encodeURIComponent(storeError.message)}`);
  }

  redirect('/cadastro/sucesso?tipo=loja');
}
