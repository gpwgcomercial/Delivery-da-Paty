// Tipos espelhando o schema em supabase/schema.sql.
// Não é gerado automaticamente — se o schema mudar, atualize aqui também
// (ou rode `supabase gen types typescript` quando o projeto já estiver no ar).

export type AdminRole = 'master' | 'admin' | 'editor';
export type StoreApprovalStatus = 'pending' | 'approved' | 'rejected';
export type StoreStatus = 'open' | 'closed_temp' | 'closed_manual';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentMethod = 'pix' | 'card' | 'cash';

export interface Address {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface Store {
  id: string;
  user_id: string;
  responsible_name: string;
  responsible_email: string;
  responsible_phone: string;
  responsible_address_id: string;
  store_name: string;
  uses_responsible_address: boolean;
  store_address_id: string | null;
  logo_url: string | null;
  opening_hours: Record<string, [string, string]>;
  min_order_value: number;
  delivery_fee: number | null;
  status: StoreStatus;
  status_reason: string | null;
  approval_status: StoreApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
}

export interface MenuCategory {
  id: string;
  store_id: string;
  name: string;
  display_order: number;
}

export interface MenuItemVariation {
  id: string;
  menu_item_id: string;
  label: string;
  price: number;
  display_order: number;
}

export interface MenuItem {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  photo_url: string | null;
  is_featured: boolean;
  status: 'active' | 'paused';
  menu_item_variations?: MenuItemVariation[];
}

export interface Client {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string;
  address_id: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  menu_item_id: string;
  variation_id: string | null;
  variation_label: string | null;
  quantity: number;
  unit_price: number;
}

export interface Notification {
  id: string;
  client_id: string;
  order_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
