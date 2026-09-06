-- =====================================================================
-- DELIVERY DA PATY — Schema do banco de dados (Supabase / PostgreSQL)
-- =====================================================================
-- Como usar: cole este arquivo inteiro no SQL Editor do Supabase e
-- rode de uma vez. Ele cria tipos, tabelas, relacionamentos e um
-- trigger que cria automaticamente o "profile" quando alguém se
-- cadastra pelo Supabase Auth (login por e-mail/senha).
--
-- Recuperação de senha: NÃO precisa de tabela própria — o Supabase
-- Auth já resolve isso nativamente (supabase.auth.resetPasswordForEmail).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------

create type user_type as enum ('admin', 'store', 'client');
create type admin_role as enum ('master', 'admin', 'editor');
create type item_status as enum ('active', 'paused');
create type store_status as enum ('open', 'closed_temp', 'closed_manual');
create type store_approval_status as enum ('pending', 'approved', 'rejected');
create type order_status as enum (
  'pending', 'confirmed', 'preparing',
  'out_for_delivery', 'delivered', 'cancelled'
);
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type payment_provider as enum ('infinity_pay', 'pagbank', 'other');
-- meio de pagamento escolhido pelo cliente no checkout (tela simples por
-- enquanto — a integração de verdade com o provedor fica para depois)
create type payment_method as enum ('pix', 'card', 'cash');

-- ---------------------------------------------------------------------
-- 2. PERFIS (1-para-1 com auth.users do Supabase)
-- ---------------------------------------------------------------------
-- Toda conta (admin, loja ou cliente) faz login por e-mail/senha via
-- Supabase Auth. Esta tabela só diz QUAL TIPO de conta é aquele login.

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  user_type  user_type not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. ADMINISTRADORES (Mestre / Administrador / Editor)
-- ---------------------------------------------------------------------

create table admin_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  role       admin_role not null,
  full_name  text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- Regra de negócio (aplicada via RLS + na API, não só aqui):
--   master     -> acesso total, único que pode criar/apagar outros admins
--   admin      -> tudo, exceto criar/apagar contas admin
--   editor     -> não pode apagar dados de clientes/lojas

-- ---------------------------------------------------------------------
-- 4. ENDEREÇOS (reutilizável: responsável da loja, loja, cliente)
-- ---------------------------------------------------------------------

create table addresses (
  id           uuid primary key default gen_random_uuid(),
  street       text not null,
  number       text not null,
  complement   text,
  neighborhood text not null,
  city         text not null,
  state        text not null,
  zip_code     text not null,
  latitude     numeric(10,7),
  longitude    numeric(10,7),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. LOJAS
-- ---------------------------------------------------------------------

create table stores (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,

  -- dados do responsável
  responsible_name    text not null,
  responsible_email   text not null,
  responsible_phone   text not null,
  responsible_address_id uuid not null references addresses(id),

  -- dados da loja
  store_name          text not null,
  -- se true, a loja usa o endereço do responsável (checkbox do cadastro)
  uses_responsible_address boolean not null default false,
  store_address_id    uuid references addresses(id),
  logo_url            text,

  opening_hours       jsonb not null default '{}'::jsonb, -- ex: {"mon": ["08:00","22:00"], ...}
  min_order_value     numeric(10,2) not null default 0,
  delivery_fee        numeric(10,2), -- null = grátis
  status               store_status not null default 'open',
  status_reason        text, -- motivo quando "closed_temp" (ex: feriado)

  -- aprovação obrigatória: toda loja nasce "pending" e só aparece pros
  -- clientes depois que o ADM MESTRE aprovar (ver trigger na seção 12)
  approval_status      store_approval_status not null default 'pending',
  approved_by          uuid references admin_profiles(id),
  approved_at          timestamptz,
  rejection_reason     text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (user_id),
  check (
    (uses_responsible_address = true and store_address_id is null)
    or (uses_responsible_address = false and store_address_id is not null)
  )
);

-- ---------------------------------------------------------------------
-- 6. CLIENTES
-- ---------------------------------------------------------------------
-- Obs: o pedido original não incluía "nome" no cadastro do cliente
-- (só e-mail, senha, número e endereço). Deixei full_name opcional
-- aqui — é útil na hora de identificar o pedido, mas não obrigatório.

create table clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  full_name  text,
  phone      text not null,
  address_id uuid not null references addresses(id),
  created_at timestamptz not null default now(),

  unique (user_id)
);

-- ---------------------------------------------------------------------
-- 7. CARDÁPIO: categorias e itens
-- ---------------------------------------------------------------------
-- Categorias por loja (editável) — sugestão de lista inicial padrão:
-- Lanches, Pizza, Sorvetes/Açaí, Doces e Bolos, Salgados e Tortas, Bebidas

create table menu_categories (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  name          text not null,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create table menu_items (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  category_id  uuid not null references menu_categories(id) on delete restrict,
  name         text not null,
  description  text, -- "especificação do item"
  -- preço único do item. Se o item tiver variações de tamanho (P/M/G),
  -- deixe este campo null — o preço de cada tamanho fica em
  -- menu_item_variations (ver seção 7.1 logo abaixo).
  price        numeric(10,2),
  photo_url    text,
  is_featured  boolean not null default false, -- um dos 3 itens em destaque
  status       item_status not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- limita a no máximo 3 itens em destaque por loja
create unique index one_featured_slot_per_item on menu_items (id) where is_featured;
create or replace function check_featured_limit() returns trigger as $$
begin
  if new.is_featured then
    if (select count(*) from menu_items
        where store_id = new.store_id and is_featured and id <> new.id) >= 3 then
      raise exception 'Uma loja pode ter no máximo 3 itens em destaque';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_check_featured_limit
before insert or update on menu_items
for each row execute function check_featured_limit();

-- ---------------------------------------------------------------------
-- 7.1 VARIAÇÕES DE TAMANHO (P/M/G) — opcional, por item
-- ---------------------------------------------------------------------
-- Cada item pode ter 0 variações (usa o "price" da tabela menu_items)
-- ou várias (ex: P, M, G — ou qualquer rótulo, é livre), cada uma com
-- seu próprio preço. Ex: Pizza -> P: 35,00 / M: 45,00 / G: 55,00.

create table menu_item_variations (
  id            uuid primary key default gen_random_uuid(),
  menu_item_id  uuid not null references menu_items(id) on delete cascade,
  label         text not null,          -- 'P', 'M', 'G', ou nome livre
  price         numeric(10,2) not null,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),

  unique (menu_item_id, label)
);

-- ---------------------------------------------------------------------
-- 8. CARRINHO
-- ---------------------------------------------------------------------
-- Um carrinho ativo por cliente por loja (como no iFood: pedido de
-- lojas diferentes não se mistura no mesmo carrinho).

create table carts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  store_id   uuid not null references stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (client_id, store_id)
);

create table cart_items (
  id             uuid primary key default gen_random_uuid(),
  cart_id        uuid not null references carts(id) on delete cascade,
  menu_item_id   uuid not null references menu_items(id),
  -- preenchido só se o cliente escolheu um tamanho (P/M/G); null = item sem variação
  variation_id   uuid references menu_item_variations(id),
  variation_label text, -- snapshot do rótulo (ex: "M"), pro caso a variação mudar de nome depois
  quantity       int not null check (quantity > 0),
  unit_price     numeric(10,2) not null, -- snapshot do preço (do item ou da variação escolhida)
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. PEDIDOS
-- ---------------------------------------------------------------------

create table orders (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id),
  store_id            uuid not null references stores(id),
  delivery_address_id uuid not null references addresses(id),

  status              order_status not null default 'pending',
  subtotal            numeric(10,2) not null,
  delivery_fee        numeric(10,2) not null default 0,
  total                numeric(10,2) not null,

  -- meio escolhido na tela de checkout (Pix / cartão / dinheiro)
  payment_method       payment_method not null,
  -- só relevante se payment_method = 'cash': quanto o cliente vai pagar
  -- em espécie, pra loja/entregador saber quanto de troco levar
  cash_change_for      numeric(10,2),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  menu_item_id    uuid references menu_items(id),
  item_name       text not null,   -- snapshot: se o item mudar depois, o pedido não muda
  variation_label text,            -- snapshot do tamanho escolhido (ex: "G"), se houver
  unit_price      numeric(10,2) not null,
  quantity        int not null check (quantity > 0),
  subtotal        numeric(10,2) not null
);

-- ---------------------------------------------------------------------
-- 10. PAGAMENTOS
-- ---------------------------------------------------------------------
-- Por enquanto o checkout só pergunta o payment_method (tabela orders)
-- e não integra de verdade com nenhum provedor. Esta tabela já fica
-- pronta pra quando a integração (InfinitePay/PagBank) for feita —
-- nesse momento, cada pagamento online passa a gerar uma linha aqui.

create table payments (
  id                     uuid primary key default gen_random_uuid(),
  order_id               uuid not null references orders(id) on delete cascade,
  provider               payment_provider not null,
  external_transaction_id text,
  status                 payment_status not null default 'pending',
  amount                 numeric(10,2) not null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 11. Trigger: cria o "profile" automaticamente ao se cadastrar
-- ---------------------------------------------------------------------
-- No cadastro (loja ou cliente), você passa user_type nos metadados
-- do signUp() do Supabase Auth, ex:
--   supabase.auth.signUp({ email, password, options: { data: { user_type: 'store' } } })
-- Este trigger lê isso e cria a linha em "profiles" sozinho.

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, user_type)
  values (new.id, coalesce((new.raw_user_meta_data->>'user_type')::user_type, 'client'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- 11.1 Trigger: só o ADM MESTRE pode aprovar/reprovar uma loja
-- ---------------------------------------------------------------------
-- Toda loja começa "pending" (ver default na tabela stores). Enquanto
-- isso, ela não aparece pros clientes (RLS na seção 12) nem recebe
-- pedidos (trigger na seção 11.2). Só uma linha em admin_profiles com
-- role = 'master' consegue mudar approval_status.

create or replace function check_store_approval_change() returns trigger as $$
begin
  if old.approval_status is distinct from new.approval_status then
    if not exists (
      select 1 from admin_profiles
      where user_id = auth.uid() and role = 'master'
    ) then
      raise exception 'Somente o Admin Mestre pode aprovar ou reprovar uma loja';
    end if;

    if new.approval_status = 'approved' then
      new.approved_by = (select id from admin_profiles where user_id = auth.uid());
      new.approved_at = now();
      new.rejection_reason = null;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_check_store_approval
before update on stores
for each row execute function check_store_approval_change();

-- ---------------------------------------------------------------------
-- 11.2 Trigger: trava de segurança — pedido só em loja aprovada
-- ---------------------------------------------------------------------
-- Mesmo que uma tela esqueça de checar isso, o banco não deixa passar.

create or replace function check_store_approved_for_order() returns trigger as $$
begin
  if not exists (
    select 1 from stores where id = new.store_id and approval_status = 'approved'
  ) then
    raise exception 'Esta loja ainda não foi aprovada — não é possível criar pedidos';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_check_store_approved_for_order
before insert on orders
for each row execute function check_store_approved_for_order();

-- ---------------------------------------------------------------------
-- 11.3 NOTIFICAÇÕES dentro do site (em vez de WhatsApp, por enquanto)
-- ---------------------------------------------------------------------
-- Sempre que o status de um pedido muda, uma notificação é criada
-- automaticamente para o cliente. O site só precisa ler esta tabela
-- (ex: um sininho no cabeçalho) — nenhuma lógica extra é necessária
-- na tela pra gerar o aviso.

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  order_id   uuid references orders(id) on delete cascade,
  title      text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function notify_order_status_change() returns trigger as $$
declare
  ttl text;
begin
  if (TG_OP = 'INSERT') or (TG_OP = 'UPDATE' and old.status is distinct from new.status) then
    ttl := case new.status
      when 'pending'           then 'Pedido recebido'
      when 'confirmed'         then 'Pedido confirmado'
      when 'preparing'         then 'A loja está preparando seu pedido'
      when 'out_for_delivery'  then 'Seu pedido saiu para entrega'
      when 'delivered'         then 'Pedido entregue'
      when 'cancelled'         then 'Pedido cancelado'
      else 'Atualização do pedido'
    end;
    insert into notifications (client_id, order_id, title, message)
    values (new.client_id, new.id, ttl, ttl || ' — pedido #' || substr(new.id::text, 1, 8));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_order_status
after insert or update on orders
for each row execute function notify_order_status_change();

-- ---------------------------------------------------------------------
-- 12. Row Level Security (RLS) — ponto de partida
-- ---------------------------------------------------------------------
-- Habilita RLS em tudo. As policies abaixo são um esqueleto inicial;
-- a matriz completa de permissões (master/admin/editor) deve crescer
-- conforme as telas forem sendo construídas.

alter table profiles enable row level security;
alter table stores enable row level security;
alter table clients enable row level security;
alter table menu_items enable row level security;
alter table menu_item_variations enable row level security;
alter table orders enable row level security;
alter table notifications enable row level security;
alter table addresses enable row level security;
alter table admin_profiles enable row level security;
alter table menu_categories enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

-- cliente só vê e marca como lida as próprias notificações
create policy "cliente vê as próprias notificações"
on notifications for select using (
  client_id in (select id from clients where user_id = auth.uid())
);

create policy "cliente marca a própria notificação como lida"
on notifications for update using (
  client_id in (select id from clients where user_id = auth.uid())
);

-- cliente cria, vê e edita o próprio cadastro
create policy "cliente cria o próprio cadastro"
on clients for insert with check (user_id = auth.uid());

create policy "cliente vê o próprio perfil"
on clients for select using (user_id = auth.uid());

create policy "cliente edita o próprio perfil"
on clients for update using (user_id = auth.uid());

-- admin (qualquer papel) vê a lista de clientes no painel
create policy "admin vê todos os clientes"
on clients for select using (
  exists (select 1 from admin_profiles where user_id = auth.uid())
);

-- loja cria, vê e edita o próprio cadastro
create policy "loja cria o próprio cadastro"
on stores for insert with check (user_id = auth.uid());

create policy "loja vê o próprio cadastro"
on stores for select using (user_id = auth.uid());

create policy "loja edita o próprio cadastro"
on stores for update using (user_id = auth.uid());

create policy "loja gerencia os próprios itens"
on menu_items for all using (
  store_id in (select id from stores where user_id = auth.uid())
);

-- cardápio é público para leitura, mas só de lojas já aprovadas
create policy "cardápio é público"
on menu_items for select using (
  status = 'active'
  and exists (
    select 1 from stores s
    where s.id = menu_items.store_id and s.approval_status = 'approved'
  )
);

-- qualquer visitante vê lojas aprovadas (navegação/busca)
create policy "lojas aprovadas são públicas"
on stores for select using (approval_status = 'approved');

-- categorias: loja gerencia as próprias, público lê as de lojas aprovadas
create policy "loja gerencia as próprias categorias"
on menu_categories for all using (
  store_id in (select id from stores where user_id = auth.uid())
);

create policy "categorias de lojas aprovadas são públicas"
on menu_categories for select using (
  exists (select 1 from stores s where s.id = menu_categories.store_id and s.approval_status = 'approved')
);

-- loja gerencia as variações dos próprios itens
create policy "loja gerencia as próprias variações"
on menu_item_variations for all using (
  menu_item_id in (
    select mi.id from menu_items mi
    join stores s on s.id = mi.store_id
    where s.user_id = auth.uid()
  )
);

-- variações são públicas para leitura junto com o item
create policy "variações são públicas"
on menu_item_variations for select using (true);

-- admins (master/admin/editor) enxergam todas as lojas
create policy "admin vê todas as lojas"
on stores for select using (
  exists (
    select 1 from admin_profiles
    where user_id = auth.uid() and role in ('master', 'admin', 'editor')
  )
);

-- admins podem atualizar qualquer loja (a troca de approval_status,
-- porém, só passa de fato se for o ADM MESTRE — trigger da seção 11.1)
create policy "admin atualiza lojas"
on stores for update using (
  exists (
    select 1 from admin_profiles
    where user_id = auth.uid() and role in ('master', 'admin', 'editor')
  )
);

-- apagar loja/cliente é ação de master ou admin — editor fica de fora
create policy "master/admin apagam lojas"
on stores for delete using (
  exists (select 1 from admin_profiles where user_id = auth.uid() and role in ('master', 'admin'))
);

create policy "master/admin apagam clientes"
on clients for delete using (
  exists (select 1 from admin_profiles where user_id = auth.uid() and role in ('master', 'admin'))
);

-- ---------------------------------------------------------------------
-- 12.1 ADMINISTRADORES
-- ---------------------------------------------------------------------
-- cada admin vê a própria linha; o master vê e gerencia todo mundo
-- (criar/remover admin é ação exclusiva do master, incluindo pra si)

create policy "admin vê a própria linha"
on admin_profiles for select using (user_id = auth.uid());

create policy "master gerencia todos os administradores"
on admin_profiles for all using (
  exists (select 1 from admin_profiles self where self.user_id = auth.uid() and self.role = 'master')
) with check (
  exists (select 1 from admin_profiles self where self.user_id = auth.uid() and self.role = 'master')
);

-- ---------------------------------------------------------------------
-- 12.2 ENDEREÇOS
-- ---------------------------------------------------------------------
-- qualquer usuário logado pode criar um endereço (é o primeiro passo do
-- cadastro, antes de existir a linha em clients/stores). A leitura fica
-- restrita a quem o endereço pertence, ou a admins.

create policy "usuário autenticado cria endereço"
on addresses for insert to authenticated with check (true);

create policy "dono ou admin vê o endereço"
on addresses for select using (
  id in (select address_id from clients where user_id = auth.uid())
  or id in (select responsible_address_id from stores where user_id = auth.uid())
  or id in (select store_address_id from stores where user_id = auth.uid())
  or id in (
    select delivery_address_id from orders
    where client_id in (select id from clients where user_id = auth.uid())
       or store_id in (select id from stores where user_id = auth.uid())
  )
  or exists (select 1 from admin_profiles where user_id = auth.uid())
);

-- ---------------------------------------------------------------------
-- 12.3 CARRINHO
-- ---------------------------------------------------------------------
-- só o dono do carrinho mexe nele — nunca aparece pra ninguém mais.

create policy "cliente gerencia o próprio carrinho"
on carts for all using (
  client_id in (select id from clients where user_id = auth.uid())
) with check (
  client_id in (select id from clients where user_id = auth.uid())
);

create policy "cliente gerencia os itens do próprio carrinho"
on cart_items for all using (
  cart_id in (
    select id from carts where client_id in (select id from clients where user_id = auth.uid())
  )
) with check (
  cart_id in (
    select id from carts where client_id in (select id from clients where user_id = auth.uid())
  )
);

-- ---------------------------------------------------------------------
-- 12.4 PEDIDOS
-- ---------------------------------------------------------------------
-- cliente cria e vê os próprios pedidos; loja vê e atualiza status dos
-- pedidos que recebeu; admin vê tudo.

create policy "cliente cria os próprios pedidos"
on orders for insert with check (
  client_id in (select id from clients where user_id = auth.uid())
);

create policy "cliente vê os próprios pedidos"
on orders for select using (
  client_id in (select id from clients where user_id = auth.uid())
);

create policy "loja vê pedidos da própria loja"
on orders for select using (
  store_id in (select id from stores where user_id = auth.uid())
);

create policy "loja atualiza status dos próprios pedidos"
on orders for update using (
  store_id in (select id from stores where user_id = auth.uid())
);

create policy "admin vê todos os pedidos"
on orders for select using (
  exists (select 1 from admin_profiles where user_id = auth.uid())
);

-- itens do pedido seguem a mesma regra do pedido em si
create policy "cliente cria itens do próprio pedido"
on order_items for insert with check (
  order_id in (select id from orders where client_id in (select id from clients where user_id = auth.uid()))
);

create policy "cliente vê itens dos próprios pedidos"
on order_items for select using (
  order_id in (select id from orders where client_id in (select id from clients where user_id = auth.uid()))
);

create policy "loja vê itens de pedidos da própria loja"
on order_items for select using (
  order_id in (select id from orders where store_id in (select id from stores where user_id = auth.uid()))
);

-- ---------------------------------------------------------------------
-- 12.5 PAGAMENTOS
-- ---------------------------------------------------------------------
-- só leitura por enquanto (nada escreve aqui até a integração real —
-- quando isso acontecer, a escrita vem de um webhook usando a service
-- role, que ignora RLS).

create policy "cliente vê pagamentos dos próprios pedidos"
on payments for select using (
  order_id in (select id from orders where client_id in (select id from clients where user_id = auth.uid()))
);

create policy "loja vê pagamentos dos próprios pedidos"
on payments for select using (
  order_id in (select id from orders where store_id in (select id from stores where user_id = auth.uid()))
);

-- ---------------------------------------------------------------------
-- 13. REALTIME
-- ---------------------------------------------------------------------
-- Necessário pra o sininho de notificação e a tela de status do pedido
-- atualizarem sozinhos no site, sem precisar recarregar a página.

alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table orders;
