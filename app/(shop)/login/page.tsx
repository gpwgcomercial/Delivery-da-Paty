import Link from 'next/link';
import { login } from '@/lib/actions/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="mb-1 text-sm text-inkSoft">Que bom te ver de novo</div>
      <h1 className="mb-6 font-display text-2xl text-primaryDeep">Entrar na sua conta</h1>

      {erro && (
        <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>
      )}

      <form action={login} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-inkSoft">E-mail</label>
          <input
            name="email"
            type="email"
            required
            placeholder="seuemail@exemplo.com"
            className="w-full rounded-s border border-line px-3 py-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-inkSoft">Senha</label>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full rounded-s border border-line px-3 py-3 text-sm"
          />
        </div>

        <Link href="/recuperar-senha" className="text-xs font-bold text-primary">
          Esqueci minha senha
        </Link>

        <button
          type="submit"
          className="mt-2 rounded-s bg-accent py-3 text-sm font-bold text-white"
        >
          Entrar
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-inkSoft">ainda não tem conta?</div>
      <div className="mt-2 flex flex-col gap-2">
        <Link href="/cadastro/cliente" className="text-center text-sm font-bold text-primary">
          Criar conta de cliente
        </Link>
        <Link href="/cadastro/loja" className="text-center text-sm font-bold text-primary">
          Cadastrar minha loja
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-inkSoft">
        É administrador?{' '}
        <Link href="/admin" className="font-bold text-primary">
          Entrar no painel
        </Link>
      </p>
    </main>
  );
}
