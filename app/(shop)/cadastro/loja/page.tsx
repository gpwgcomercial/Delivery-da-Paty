import StoreSignupForm from '@/components/StoreSignupForm';

export default async function SignupStorePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="mb-1 text-sm text-inkSoft">Cadastro de loja parceira</div>
      <h1 className="mb-6 font-display text-2xl text-primaryDeep">Coloque sua loja no ar</h1>

      {erro && <p className="mb-4 rounded-s bg-dangerSoft px-3 py-2 text-sm text-danger">{erro}</p>}

      <StoreSignupForm />
    </main>
  );
}
