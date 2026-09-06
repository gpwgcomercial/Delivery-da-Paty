import { updatePassword } from '@/lib/actions/auth';

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <h1 className="mb-6 font-display text-2xl text-primaryDeep">Defina sua nova senha</h1>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      <form action={updatePassword} className="flex flex-col gap-3">
        <input
          name="password"
          type="password"
          required
          placeholder="Nova senha (mínimo 8 caracteres)"
          className="w-full rounded-s border border-line px-3 py-3 text-sm"
        />
        <button type="submit" className="rounded-s bg-accent py-3 text-sm font-bold text-white">
          Salvar nova senha
        </button>
      </form>
    </main>
  );
}
