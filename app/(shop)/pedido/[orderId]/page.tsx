import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OrderTimeline from '@/components/OrderTimeline';

export default async function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_method, stores(store_name)')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) notFound();

  const paymentLabels: Record<string, string> = { pix: 'Pix', card: 'Cartão', cash: 'Dinheiro' };

  return (
    <main className="mx-auto max-w-md px-5 py-8 text-center">
      <div className="mb-2 text-4xl">✅</div>
      <h1 className="font-display text-xl text-primaryDeep">Pedido confirmado!</h1>
      <div className="text-xs text-inkSoft">
        Pedido #{order.id.slice(0, 8)} · {(order as any).stores.store_name}
      </div>
      <div className="mt-1 text-xs text-inkSoft">
        Forma de pagamento: {paymentLabels[order.payment_method] ?? order.payment_method}
      </div>

      <div className="text-left">
        <OrderTimeline orderId={order.id} initialStatus={order.status} />
      </div>
    </main>
  );
}
