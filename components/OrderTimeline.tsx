'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { OrderStatus } from '@/lib/types';

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pedido recebido' },
  { status: 'confirmed', label: 'Pedido confirmado' },
  { status: 'preparing', label: 'A loja está preparando' },
  { status: 'out_for_delivery', label: 'Saiu para entrega' },
  { status: 'delivered', label: 'Entregue' },
];

export default function OrderTimeline({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setStatus((payload.new as any).status)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (status === 'cancelled') {
    return (
      <div className="rounded-m border border-dangerSoft bg-dangerSoft p-4 text-center">
        <div className="mb-1 text-2xl">✕</div>
        <b className="text-danger">Este pedido foi cancelado</b>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="mt-6">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STEPS.length - 1 && (
              <div className="absolute bottom-0 left-[11px] top-6 w-0.5 bg-line" />
            )}
            <div
              className={`z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs text-white ${
                done ? 'bg-ok' : current ? 'bg-accent' : 'bg-line'
              }`}
            >
              {done ? '✓' : ''}
            </div>
            <b className={`text-sm ${current || done ? 'text-ink' : 'text-inkSoft'}`}>{step.label}</b>
          </div>
        );
      })}
    </div>
  );
}
