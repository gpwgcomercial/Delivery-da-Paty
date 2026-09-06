'use client';

import { useTransition } from 'react';
import { updateCartItemQuantity } from '@/lib/actions/cart';

export default function CartItemRow({
  id,
  name,
  variationLabel,
  quantity,
  unitPrice,
}: {
  id: string;
  name: string;
  variationLabel: string | null;
  quantity: number;
  unitPrice: number;
}) {
  const [pending, startTransition] = useTransition();

  function change(delta: number) {
    startTransition(() => {
      updateCartItemQuantity(id, quantity + delta);
    });
  }

  return (
    <div className="flex items-center justify-between border-b border-line py-3.5">
      <div>
        <h4 className="text-sm font-bold">{name}</h4>
        {variationLabel && <span className="text-xs text-inkSoft">Tamanho {variationLabel}</span>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <button
            disabled={pending}
            onClick={() => change(-1)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line text-primaryDeep"
          >
            −
          </button>
          <span className="min-w-[14px] text-center text-sm font-bold">{quantity}</span>
          <button
            disabled={pending}
            onClick={() => change(1)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line text-primaryDeep"
          >
            +
          </button>
        </div>
        <span className="text-sm font-bold">R$ {(unitPrice * quantity).toFixed(2).replace('.', ',')}</span>
      </div>
    </div>
  );
}
