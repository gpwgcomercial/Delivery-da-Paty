# Delivery da Paty

Projeto Next.js (App Router) + Supabase, pronto para rodar localmente e subir no Vercel.

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** → cole todo o conteúdo de `supabase/schema.sql` → **Run**.
   Isso cria as tabelas, os triggers (aprovação de loja, notificações automáticas) e as
   regras de segurança (RLS).
3. Vá em **Database → Replication** e confirme que `orders` e `notifications` estão marcadas
   (o script já faz isso, é só conferir).
4. Vá em **Authentication → URL Configuration** e configure:
   - **Site URL**: a URL do seu site (em produção, a URL do Vercel; em dev, `http://localhost:3000`)
   - **Redirect URLs**: adicione `SEU_DOMINIO/auth/callback`

## 2. Criar o primeiro ADM MESTRE

Como só um ADM MESTRE pode aprovar lojas ou convidar outros admins, o primeiro precisa ser
criado manualmente (depois disso, todos os outros são convidados pela própria tela
**Administradores**):

1. Em **Authentication → Users**, clique em **Add user** e crie o e-mail/senha do primeiro admin.
2. No **SQL Editor**, rode (trocando o e-mail):

   ```sql
   insert into admin_profiles (user_id, role, full_name)
   select id, 'master', 'Seu Nome'
   from auth.users
   where email = 'seuemail@exemplo.com';
   ```

## 3. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=          # Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY=         # Supabase → Settings → API (nunca exponha no navegador!)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` só é usada dentro de Server Actions (convite de novos
administradores) — nunca é enviada ao navegador. Trate-a como uma senha.

## 4. Rodar localmente

```bash
npm install
npm run dev
```

## 5. Deploy no Vercel

1. Suba este projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, adicione as mesmas 4 variáveis do passo 3 (troque
   `NEXT_PUBLIC_SITE_URL` pela URL final do Vercel).
4. Deploy.
5. Volte no Supabase (**Authentication → URL Configuration**) e atualize a Site URL e o
   Redirect URL com o domínio de produção.

## O que já funciona

- Cadastro e login de clientes e lojas (Supabase Auth)
- Cadastro de loja com aprovação obrigatória do ADM Mestre (garantida pelo banco, não só pela tela)
- Página da loja com destaques, categorias e variações de tamanho (P/M/G)
- Carrinho, checkout com escolha de forma de pagamento (Pix / Cartão / Dinheiro) e pedido mínimo
- Status do pedido com atualização em tempo real
- Notificações dentro do site (sininho), geradas automaticamente pelo banco a cada mudança de status
- Painel administrativo com os 3 papéis (Mestre / Administrador / Editor)

## O que ainda falta (próximos passos)

- **Painel da loja para editar o próprio cardápio** — hoje, cadastrar categorias/itens/variações
  é feito direto pelo Supabase Studio (Table Editor). Ainda não foi pedida uma tela para isso.
- **Pagamento de verdade** — o checkout só pergunta a forma escolhida; a cobrança online
  (Pix/cartão via InfinitePay ou PagBank) ainda não foi integrada.
- **Upload de imagem** — logo da loja e fotos dos itens usam campos de URL (`logo_url`,
  `photo_url`); não há upload de arquivo ainda (dá pra usar o Supabase Storage depois).
- **WhatsApp** — descartado por enquanto (ver `resumo_projeto.md`).
