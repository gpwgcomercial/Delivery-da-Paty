import { requestPasswordReset } from '@/lib/actions/auth';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;

  if (enviado) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mb-3 text-4xl">📬</div>
        <h1 className="mb-2 font-display text-xl text-primaryDeep">E-mail a caminho</h1>
        <p className="text-sm text-inkSoft">
          Se esse e-mail estiver cadastrado, você vai receber o link de recuperação em instantes.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="mb-1 text-sm text-inkSoft">Sem problemas</div>
      <h1 className="mb-2 font-display text-2xl text-primaryDeep">Recuperar senha</h1>
      <p className="-mt-1 mb-6 text-sm text-inkSoft">
        Informe o e-mail cadastrado — vamos te enviar um link para criar uma nova senha.
      </p>

      <form action={requestPasswordReset} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="seuemail@exemplo.com"
          className="w-full rounded-s border border-line px-3 py-3 text-sm"
        />
        <button type="submit" className="rounded-s bg-accent py-3 text-sm font-bold text-white">
          Enviar link de recuperação
        </button>
      </form>
    </main>
  );
}
