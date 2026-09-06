import { signUpClient } from '@/lib/actions/auth';
import Field from '@/components/Field';

export default async function SignupClientPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="mb-1 text-sm text-inkSoft">Cadastro de cliente</div>
      <h1 className="mb-6 font-display text-2xl text-primaryDeep">Crie sua conta</h1>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      <form action={signUpClient} className="flex flex-col gap-3">
        <Field label="Nome (opcional)" name="full_name" />
        <Field label="E-mail" name="email" type="email" required />
        <Field label="Senha" name="password" type="password" required placeholder="mínimo 8 caracteres" />
        <Field label="Telefone" name="phone" type="tel" required placeholder="(00) 00000-0000" />
        <Field label="CEP" name="zip_code" required placeholder="00000-000" />
        <div className="flex gap-2">
          <div className="flex-1">
            <Field label="Rua" name="street" required />
          </div>
          <div className="w-24">
            <Field label="Número" name="number" required />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Field label="Bairro" name="neighborhood" required />
          </div>
          <div className="flex-1">
            <Field label="Cidade" name="city" required />
          </div>
        </div>
        <Field label="Estado (UF)" name="state" required placeholder="ES" />

        <button type="submit" className="mt-2 rounded-s bg-accent py-3 text-sm font-bold text-white">
          Criar conta
        </button>
      </form>
    </main>
  );
}
