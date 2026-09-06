'use client';

import { useState } from 'react';
import { createOrder } from '@/lib/actions/checkout';

const METHODS = [
  { id: 'pix', icon: '💠', label: 'Pix', hint: 'Confirmação rápida' },
  { id: 'card', icon: '💳', label: 'Cartão', hint: 'Débito ou crédito na entrega ou maquininha' },
  { id: 'cash', icon: '💵', label: 'Dinheiro', hint: 'Pagamento na entrega' },
] as const;

export default function CheckoutForm({ cartId }: { cartId: string }) {
  const [method, setMethod] = useState<'pix' | 'card' | 'cash'>('pix');

  return (
    <form action={createOrder} className="flex flex-col gap-2">
      <input type="hidden" name="cart_id" value={cartId} />
      <p className="mb-1 mt-2 text-xs font-bold text-inkSoft">Forma de pagamento</p>
      <p className="-mt-1 mb-2 text-xs text-inkSoft">
        Por enquanto só perguntamos a forma escolhida — a cobrança online ainda vai ser integrada.
      </p>

      {METHODS.map((m) => (
        <label
          key={m.id}
          className={`flex cursor-pointer items-center gap-3 rounded-m border p-3.5 ${
            method === m.id ? 'border-accent shadow-[0_0_0_1px_theme(colors.accent)]' : 'border-line'
          }`}
        >
          <input
            type="radio"
            name="payment_method"
            value={m.id}
            checked={method === m.id}
            onChange={() => setMethod(m.id)}
            className="sr-only"
          />
          <span className="text-xl">{m.icon}</span>
          <div>
            <b className="block text-sm">{m.label}</b>
            <span className="text-xs text-inkSoft">{m.hint}</span>
          </div>
        </label>
      ))}

      {method === 'cash' && (
        <div className="mt-1">
          <label className="mb-1 block text-xs font-bold text-inkSoft">Precisa de troco para quanto?</label>
          <input
            name="cash_change_for"
            type="text"
            placeholder="Ex: 50 (deixe em branco se não precisar)"
            className="w-full rounded-s border border-line px-3 py-3 text-sm"
          />
        </div>
      )}

      <button type="submit" className="mt-4 w-full rounded-s bg-accent py-3.5 text-sm font-bold text-white">
        Finalizar pedido
      </button>
    </form>
  );
}
