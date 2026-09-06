'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types';

export default function Header({
  clientId,
  cartCount = 0,
}: {
  clientId?: string | null;
  cartCount?: number;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!clientId) return;

    supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => data && setNotifications(data as Notification[]));

    // Toda vez que o banco cria uma notificação (trigger de status do
    // pedido), ela aparece aqui na hora, sem precisar recarregar a página.
    const channel = supabase
      .channel(`notifications-${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `client_id=eq.${clientId}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    if (!clientId || unreadCount === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('client_id', clientId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
      <Link href="/" className="flex items-center gap-2">
        <Mascot />
        <span className="font-display text-base font-semibold text-primaryDeep">Delivery da Paty</span>
      </Link>

      <div className="relative flex items-center gap-2">
        {clientId && (
          <>
            <button
              aria-label="Notificações"
              onClick={() => {
                setOpen((v) => !v);
                if (!open) markAllRead();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-bg"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-14 top-11 w-72 overflow-hidden rounded-m border border-line bg-surface shadow-lg">
                <div className="border-b border-line px-4 py-3 text-sm font-bold text-primaryDeep">
                  Notificações
                </div>
                {notifications.length === 0 && (
                  <div className="px-4 py-4 text-sm text-inkSoft">Nenhuma notificação ainda.</div>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className={`border-b border-line px-4 py-3 last:border-none ${!n.is_read ? 'bg-accentSoft' : ''}`}>
                    <b className="block text-sm">{n.title}</b>
                    <span className="text-xs text-inkSoft">{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <Link
          href="/carrinho"
          aria-label="Carrinho"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-bg"
        >
          🛍
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

function Mascot() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100">
      <rect x="18" y="46" width="16" height="26" rx="4" fill="#F2B33D" />
      <path d="M28 30 L72 30 L64 74 L36 74 Z" fill="#FFE3CC" />
      <path d="M28 30 Q50 8 72 30 Q50 46 28 30 Z" fill="#FF7A3D" />
      <circle cx="50" cy="24" r="15" fill="#7A2E49" />
      <rect x="35" y="22" width="30" height="6" rx="3" fill="#FDF1EF" />
      <circle cx="50" cy="16" r="4" fill="#F2B33D" />
    </svg>
  );
}
