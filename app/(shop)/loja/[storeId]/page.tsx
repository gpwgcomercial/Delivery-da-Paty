import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StoreMenu from '@/components/StoreMenu';
import type { MenuCategory, MenuItem, Store } from '@/lib/types';

export default async function StorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .eq('approval_status', 'approved')
    .maybeSingle();

  if (!store) notFound();

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('store_id', storeId)
    .order('display_order');

  const { data: items } = await supabase
    .from('menu_items')
    .select('*, menu_item_variations(*)')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .order('name');

  return (
    <StoreMenu
      store={store as Store}
      categories={(categories ?? []) as MenuCategory[]}
      items={(items ?? []) as MenuItem[]}
    />
  );
}
