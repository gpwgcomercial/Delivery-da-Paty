'use client';

import { useMemo, useState, useTransition } from 'react';
import { addToCart } from '@/lib/actions/cart';
import type { MenuCategory, MenuItem, Store } from '@/lib/types';

export default function StoreMenu({
  store,
  categories,
  items,
}: {
  store: Store;
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const [pending, startTransition] = useTransition();
  const [openVariation, setOpenVariation] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<Record<string, string>>({});

  const featured = items.filter((i) => i.is_featured);
  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const item of items) {
      map[item.category_id] = map[item.category_id] ?? [];
      map[item.category_id].push(item);
    }
    return map;
  }, [items]);

  function priceLabel(item: MenuItem) {
    if (item.menu_item_variations && item.menu_item_variations.length > 0) {
      const min = Math.min(...item.menu_item_variations.map((v) => v.price));
      return `a partir de R$ ${min.toFixed(2).replace('.', ',')}`;
    }
    return `R$ ${(item.price ?? 0).toFixed(2).replace('.', ',')}`;
  }

  function handleAddSimple(item: MenuItem) {
    startTransition(() => {
      addToCart({ storeId: store.id, menuItemId: item.id, unitPrice: item.price ?? 0 });
    });
  }

  function handleAddVariation(item: MenuItem) {
    const variationId = selectedVariation[item.id];
    const variation = item.menu_item_variations?.find((v) => v.id === variationId);
    if (!variation) return;
    startTransition(() => {
      addToCart({
        storeId: store.id,
        menuItemId: item.id,
        unitPrice: variation.price,
        variationId: variation.id,
        variationLabel: variation.label,
      });
      setOpenVariation(null);
    });
  }

  return (
    <main className="pb-16">
      {/* hero */}
      <div className="h-28 bg-gradient-to-br from-primary to-primaryDeep" />
      <div className="-mt-9 px-4">
        <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-surface bg-gold text-3xl">
          🍽️
        </div>
        <h1 className="mt-2 font-display text-2xl text-primaryDeep">{store.store_name}</h1>
        <div className="my-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-okSoft px-3 py-1 text-xs font-bold text-ok">
            {store.status === 'open' ? 'Aberta agora' : 'Fechada no momento'}
          </span>
        </div>
        <div className="flex rounded-m border border-line bg-surface p-3">
          <Stat label="Pedido mínimo" value={`R$ ${store.min_order_value.toFixed(2).replace('.', ',')}`} />
          <Stat
            label="Taxa de entrega"
            value={store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2).replace('.', ',')}` : 'Grátis'}
          />
        </div>
      </div>

      {featured.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 px-4 font-display text-lg text-primaryDeep">Destaques da casa</h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1">
            {featured.map((item) => (
              <div key={item.id} className="w-[148px] flex-shrink-0 rounded-m border border-line bg-surface">
                <div className="flex h-[88px] items-center justify-center bg-accentSoft text-3xl">🍽️</div>
                <div className="p-2.5">
                  <b className="block text-sm">{item.name}</b>
                  <span className="text-sm font-bold text-primary">{priceLabel(item)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* abas */}
      <div className="sticky top-[57px] z-20 flex gap-5 overflow-x-auto border-b border-line bg-bg px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap border-b-2 pb-1.5 text-sm font-bold ${
              activeCategory === cat.id
                ? 'border-accent text-primaryDeep'
                : 'border-transparent text-inkSoft'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* cardápio */}
      {categories.map((cat) => (
        <section key={cat.id} id={cat.id} className="px-4 pt-4">
          <h3 className="mb-2 font-display text-base text-primaryDeep">{cat.name}</h3>
          {(itemsByCategory[cat.id] ?? []).map((item) => {
            const hasVariations = (item.menu_item_variations?.length ?? 0) > 0;
            return (
              <div key={item.id} className="flex gap-3 border-b border-line py-3.5">
                <div className="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center rounded-s bg-accentSoft text-2xl">
                  🍽️
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold">{item.name}</h4>
                  {item.description && <p className="mb-1.5 text-xs text-inkSoft">{item.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{priceLabel(item)}</span>
                    <button
                      disabled={pending}
                      onClick={() =>
                        hasVariations
                          ? setOpenVariation(openVariation === item.id ? null : item.id)
                          : handleAddSimple(item)
                      }
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent text-lg text-white disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  {hasVariations && openVariation === item.id && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {item.menu_item_variations!.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariation((prev) => ({ ...prev, [item.id]: v.id }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                            selectedVariation[item.id] === v.id
                              ? 'border-primaryDeep bg-primaryDeep text-white'
                              : 'border-line bg-surface text-ink'
                          }`}
                        >
                          {v.label} · R$ {v.price.toFixed(2).replace('.', ',')}
                        </button>
                      ))}
                      <button
                        onClick={() => handleAddVariation(item)}
                        disabled={!selectedVariation[item.id] || pending}
                        className="mt-1 w-full rounded-s bg-accent py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 border-l border-line px-2 text-center first:border-l-0">
      <b className="block text-sm">{value}</b>
      <small className="text-[11px] text-inkSoft">{label}</small>
    </div>
  );
}
