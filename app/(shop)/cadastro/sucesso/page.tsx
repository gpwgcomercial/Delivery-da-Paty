import Link from 'next/link';

export default async function SignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const isStore = tipo === 'loja';

  return (
    <main className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="mb-3 text-4xl">{isStore ? '⏳' : '🎉'}</div>
      <h1 className="mb-2 font-display text-xl text-primaryDeep">
        {isStore ? 'Cadastro em análise' : 'Cadastro enviado!'}
      </h1>
      <p className="text-sm text-inkSoft">
        {isStore
          ? 'Recebemos os dados da sua loja! Depois de confirmar seu e-mail, o cadastro passa por uma aprovação da nossa equipe antes de ficar visível para os clientes. Avisamos você por e-mail assim que for aprovado.'
          : 'Confirme seu e-mail para ativar a conta. Depois disso é só fazer login.'}
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block rounded-s bg-accent px-6 py-3 text-sm font-bold text-white"
      >
        Ir para o login
      </Link>
    </main>
  );
}
