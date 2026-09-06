import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let clientId: string | null = null;
  let cartCount = 0;

  if (user) {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (client) {
      clientId = client.id;
      const { data: carts } = await supabase.from('carts').select('id').eq('client_id', client.id);
      const cartIds = (carts ?? []).map((c) => c.id);
      if (cartIds.length > 0) {
        const { data: items } = await supabase
          .from('cart_items')
          .select('quantity')
          .in('cart_id', cartIds);
        cartCount = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);
      }
    }
  }

  return (
    <>
      <Header clientId={clientId} cartCount={cartCount} />
      {children}
    </>
  );
}
