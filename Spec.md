# Spec — CRM de Vendas (Interno)

**Nome sugerido:** FlowCRM
**Data:** 2026-04-15
**Status:** v2.0 — Final

---

## 1. Visão Geral

Sistema CRM de uso interno para equipe de vendas, com foco em gestão visual do funil de vendas (Kanban). O sistema permite que vendedores acompanhem oportunidades desde a prospecção até o fechamento, com visibilidade em tempo real do pipeline.

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) | SSR nativo, proteção de rotas via middleware |
| Estilo | Tailwind CSS v4 + shadcn/ui | Componentes prontos, design system consistente |
| Auth | Supabase Auth — Google OAuth | Zero fricção, sem cadastro manual de senhas |
| Banco de dados | Supabase (PostgreSQL) | RLS nativo, realtime, storage integrado |
| ORM / Query | Supabase JS Client | Queries tipadas sem overhead de ORM |
| Drag & Drop | @dnd-kit/core | Biblioteca leve para o Kanban |
| Hosting | VPS própria via EasyPanel | Controle total, custo fixo previsível |
| Container | Docker (via EasyPanel) | Deploy simples, rollback fácil |

---

## 3. Usuários e Perfis de Acesso

| Perfil | Descrição | Permissões |
|---|---|---|
| **admin** | Administrador do sistema | Acesso total: usuários, configurações, todos os dados |
| **vendedor** | Membro da equipe de vendas | Gerencia seus próprios leads e oportunidades |
| **gestor** | Liderança da equipe | Visualiza e edita dados de toda a equipe; sem acesso a configurações do sistema |

> Perfis são controlados via coluna `role` na tabela `profiles` com Row Level Security (RLS) no Supabase.

---

## 4. Funcionalidades

### 4.1 MVP (Fases 0–7)

#### Autenticação
- Login via Google OAuth com controle de acesso via **invite-only** (Supabase Authentication → Invite Users)
- O Supabase Auth, configurado em modo invite-only, impede que qualquer pessoa crie conta sem convite do admin. O trigger `on_auth_user_created` dispara após o aceite do convite e cria o `profile` correspondente
- Proteção de rotas via middleware Next.js
- Refresh automático de sessão
- Logout

#### Funil de Vendas — Kanban
- Visualização das oportunidades em colunas por etapa
- Etapas padrão do funil ativo: **Prospecção → Qualificação → Proposta → Negociação**
- Oportunidades com `status = 'won'`, `'lost'` ou `'archived'` **saem do Kanban** e ficam em visão separada ("Arquivo")
- Drag & drop para mover cards entre etapas do funil ativo
- Card de oportunidade exibe: nome do cliente, valor, responsável, data de criação
- Criar nova oportunidade via modal (sempre entra em "Prospecção")
- Editar oportunidade (clique no card)
- Ações no card: marcar como **Ganho**, **Perdido** ou **Arquivar** — remove do Kanban conforme a regra:

| Ação | `status` | `closed_at` | `archived_at` |
|---|---|---|---|
| Marcar Ganho | `won` | `now()` | — |
| Marcar Perdido | `lost` | `now()` | — |
| Arquivar | `archived` | — | `now()` |

#### Cadastro de Clientes
- Lista de clientes com busca e filtro
- Ficha do cliente: nome, empresa, e-mail, telefone, notas
- Vincular oportunidades ao cliente

#### Dashboard
- **Vendedor:** KPIs das próprias oportunidades — total por etapa e valor do pipeline pessoal
- **Gestor / Admin:** KPIs da equipe toda com opção de filtrar por vendedor — total por etapa, valor total do pipeline e ranking por responsável

---

### 4.2 Pós-MVP (Backlog)

- Registro de interações (ligações, e-mails, reuniões)
- Histórico de atividades por oportunidade
- Metas por vendedor com acompanhamento
- Relatórios exportáveis (PDF/Excel)
- Notificações de oportunidades paradas
- Integração com e-mail (Gmail/Outlook)
- API pública para integrações externas

---

## 5. Modelo de Dados

### Tabela: `profiles`
```sql
id          uuid references auth.users(id) on delete cascade primary key
full_name   text                   -- fallback: usar email quando null
email       text unique not null
role        text default 'vendedor'
              check (role in ('admin', 'gestor', 'vendedor'))
avatar_url  text
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

> **Controle de acesso:** o sistema usa o fluxo **invite-only** do Supabase (Authentication → Invite Users). Somente usuários convidados pelo admin conseguem criar conta — a barreira é aplicada pelo Supabase Auth antes do trigger. Não há coluna `approved`: a confiança é delegada integralmente ao mecanismo de convite do Supabase.
> **`full_name` nullable:** quando a conta Google não retorna nome, a UI usa `email` como fallback de exibição.
> **Interação de constraints:** a cascade `auth.users → profiles (ON DELETE CASCADE)` é silenciosamente bloqueada pelo banco enquanto `opportunities.owner_id` referenciar o perfil (`RESTRICT`). Deletar um usuário pelo Supabase Dashboard sem reatribuir suas oportunidades resultará em erro de FK. Seguir o processo de offboarding documentado na seção 12.

### Tabela: `customers`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null
company     text
email       text                 -- aviso de duplicata na UI, não constraint
phone       text
notes       text
created_by  uuid references profiles(id) on delete set null
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

> **Visibilidade:** clientes são compartilhados por toda a equipe autenticada (todos leem). Somente o criador e o admin podem editar ou excluir.
> **Email:** sem constraint `unique` — emails genéricos como `contato@empresa.com` podem existir em múltiplos clientes. A UI exibe aviso de possível duplicata ao cadastrar.
> **Clientes órfãos:** quando um usuário é deletado, seus clientes ficam com `created_by = null` e passam a ser editáveis **somente pelo admin**. O admin deve reatribuir `created_by` manualmente via Settings antes ou após a deleção do usuário.

### Tabela: `pipeline_stages`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null          -- ex: "Prospecção"
position    integer not null,
constraint pipeline_stages_position_unique
  unique (position) deferrable initially deferred, -- permite reordenação em transação
color       text                   -- hex de 6 dígitos, ex: "#6366f1"
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

> **`position DEFERRABLE`:** a constraint de unicidade é validada ao final da transação (não a cada UPDATE individual), permitindo que a UI reordene múltiplas etapas em uma única transação sem violar a constraint intermediariamente.
> **`color`:** formato esperado é hex de 6 dígitos (`#rrggbb`). A UI valida o formato antes de salvar.

### Tabela: `opportunities`
```sql
id          uuid primary key default gen_random_uuid()
title       text not null
value       numeric(12,2)          -- nullable: prospect sem valor definido
currency    text default 'BRL'     -- MVP: moeda única BRL; campo reservado para Fase 2+
customer_id uuid references customers(id) on delete set null
stage_id    uuid references pipeline_stages(id) on delete restrict not null
owner_id    uuid references profiles(id) on delete restrict not null
status      text default 'open'
              check (status in ('open', 'won', 'lost', 'archived'))
notes       text
created_at  timestamptz default now()
updated_at  timestamptz default now()
closed_at   timestamptz
archived_at timestamptz            -- preenchido ao arquivar sem decisão
```

> **`customer_id` nullable:** permite criar oportunidades para prospects ainda não cadastrados como clientes. Dashboard usa `coalesce(value, 0)` para não excluir oportunidades sem valor do total do pipeline.
> **`ON DELETE` policy:** cliente deletado → oportunidade sobrevive com `customer_id = null`. Usuário ou etapa com oportunidades ativas bloqueiam deleção (`RESTRICT`).
> **Moeda:** MVP assume moeda única BRL. O campo `currency` existe no schema para facilitar migração futura sem ALTER TABLE destrutivo.

### Dados Iniciais (Seed)

```sql
insert into pipeline_stages (name, position, color) values
  ('Prospecção',   1, '#6366f1'),
  ('Qualificação', 2, '#f59e0b'),
  ('Proposta',     3, '#3b82f6'),
  ('Negociação',   4, '#10b981');
```

> Executar uma vez após criar as tabelas, como parte da Fase 2 do roadmap. Admin pode adicionar, renomear ou reordenar etapas via Settings após o deploy.

### Triggers de Banco de Dados

#### Criação automática de `profiles` ao autenticar

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Guard: email é NOT NULL em profiles; sem email o perfil não é criado
  -- e o middleware bloqueia o acesso ao sistema
  if new.email is null then
    return new;
  end if;

  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

> Este trigger garante que todo usuário autenticado via Google OAuth tenha imediatamente um registro em `profiles` com `role = 'vendedor'` (default). O admin promove roles manualmente via Settings.

#### Atualização automática de `updated_at`

```sql
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_customers
  before update on customers
  for each row execute procedure public.update_updated_at();

create trigger set_updated_at_opportunities
  before update on opportunities
  for each row execute procedure public.update_updated_at();

create trigger set_updated_at_pipeline_stages
  before update on pipeline_stages
  for each row execute procedure public.update_updated_at();

create trigger set_updated_at_profiles
  before update on profiles
  for each row execute procedure public.update_updated_at();
```

---

## 6. Rotas da Aplicação

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Redirect | Redireciona para `/login` ou `/dashboard` |
| `/login` | Public | Tela de login com Google OAuth |
| `/auth/callback` | Public | Handler de retorno do OAuth |
| `/api/health` | Public | Health check para EasyPanel — retorna `{ status: "ok" }` |
| `/dashboard` | Protected | KPIs e resumo do pipeline |
| `/pipeline` | Protected | Kanban de oportunidades (funil ativo) |
| `/pipeline/archive` | Protected | Oportunidades ganhas, perdidas e arquivadas |
| `/customers` | Protected | Lista de clientes |
| `/customers/[id]` | Protected | Ficha do cliente |
| `/opportunities/[id]` | Protected | Detalhe da oportunidade |
| `/settings` | Admin only | Configurações e gestão de usuários |

---

## 7. Segurança

### Row Level Security (RLS) — Regras por Operação

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Próprio perfil + admin | Apenas via trigger (system) | Próprio perfil (nome/avatar) + admin | Somente admin |
| `customers` | Todos autenticados | Todos autenticados | Quem criou + admin | Quem criou + admin |
| `opportunities` | Gestor/admin: todos. Vendedor: próprias | Todos autenticados | Owner + gestor + admin | Owner + admin |
| `pipeline_stages` | Todos autenticados | Somente admin | Somente admin | Somente admin (bloqueado se há oportunidades) |

> **Gestor pode editar oportunidades** que não são suas (ex: reatribuição, correção de dados) mas não pode deletá-las. Decisão de design explícita — documentar para o time.

### Proteção de Rotas por Role (Middleware)

| Rota | Regra no Middleware |
|---|---|
| `/login`, `/auth/callback`, `/api/**` | Pública — middleware não verifica sessão |
| `/dashboard`, `/pipeline/**`, `/customers/**`, `/opportunities/**` | Requer sessão ativa |
| `/settings` | Requer sessão ativa **e** `role === 'admin'` |

> **Leitura de `role` sem query ao banco:** o `role` é armazenado como **custom claim no JWT** via Supabase Auth Hook (`auth.jwt()` hook). O middleware lê `session.user.app_metadata.role` diretamente do token — zero roundtrip ao banco por request.
> Quando o admin atualiza o `role` de um usuário em `profiles`, o hook recalcula o JWT no próximo refresh de sessão (máx. 1h de defasagem).
> `/api/health` e todo `/api/**` são explicitamente excluídos do matcher do middleware.

### Configuração do JWT Custom Claim Hook

**Passo 1 — criar a função no banco (schema `public`):**
```sql
create or replace function public.custom_claims()
returns jsonb as $$
  select jsonb_build_object('role', role)
  from public.profiles
  where id = auth.uid();
$$ language sql stable security definer;
```

> A função fica em `public`, não em `auth`. O schema `auth` é gerenciado internamente pelo Supabase e pode bloquear ou sobrescrever funções customizadas em atualizações da plataforma.

**Passo 2 — ativar no Supabase:**
Supabase Dashboard → **Authentication → Hooks → Customize Access Token (JWT) Hook** → selecionar a função `public.custom_claims`.

**Passo 3 — ler no middleware:**
```typescript
const role = session?.user?.app_metadata?.role ?? 'vendedor'
```

> Sem esta configuração, `app_metadata.role` retorna `undefined` e o middleware não consegue proteger `/settings` corretamente.

---

## 8. Infraestrutura — VPS + EasyPanel

### Serviços no EasyPanel

| Serviço | Tipo | Descrição |
|---|---|---|
| `flowcrm-app` | App (Docker) | Aplicação Next.js |
| Supabase | Externo (cloud) | Auth + DB + Storage gerenciados |

### `.dockerignore`

```
node_modules
.next
.env*
*.md
.git
.gitignore
supabase/
```

### Deploy da Aplicação

```dockerfile
# Dockerfile (multi-stage)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
```

> O endpoint `/api/health` deve ser criado em `app/api/health/route.ts` retornando `{ status: "ok" }` com HTTP 200. Usado pelo EasyPanel para verificar se o container está pronto.

### Variáveis de Ambiente (EasyPanel)

```env
# Públicas (expostas ao browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://flowcrm.seudominio.com

# Servidor apenas (NUNCA prefixar com NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Runtime
HOSTNAME=0.0.0.0
PORT=3000
NODE_ENV=production
```

> `NEXT_PUBLIC_APP_URL` é usado como `redirectTo` no OAuth, evitando dependência de `window.location.origin` que não funciona em SSR.
> `HOSTNAME=0.0.0.0` é obrigatório para o Next.js standalone escutar em todas as interfaces dentro do container. Sem isso, o EasyPanel não consegue rotear tráfego para a aplicação.
> `SUPABASE_SERVICE_ROLE_KEY` é necessária para operações administrativas em `/settings` (promover `role` de outros usuários), pois essas operações precisam contornar o RLS. Usar **exclusivamente em Server Actions e Route Handlers** — nunca exposta ao client-side.

### Cliente Admin (`lib/supabase/admin.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

// Bypass RLS — usar APENAS em Server Actions e Route Handlers do módulo /settings
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

> **Nunca** importar `supabaseAdmin` em Client Components ou em arquivos que possam ser bundlados para o browser. Usar `lib/supabase/server.ts` (com anon key + cookies) para todas as outras operações autenticadas.

### HTTPS

O EasyPanel gerencia HTTPS automaticamente via **Let's Encrypt**. Configurar em: **Domains → Add Domain → Enable HTTPS**. Nenhuma configuração adicional no Dockerfile ou no Next.js é necessária — o EasyPanel atua como reverse proxy e termina o TLS antes de repassar o tráfego ao container.

### Configuração Next.js para standalone

```js
// next.config.ts
export default {
  output: "standalone",
};
```

### Estratégia de Deploy e Git

| Branch | Propósito | Deploy |
|---|---|---|
| `main` | Produção estável | Auto-deploy no EasyPanel via GitHub webhook |
| `develop` | Integração de features | Sem deploy automático |
| `feature/*` | Desenvolvimento | Sem deploy |

**Fluxo:** `feature/*` → PR → `develop` → PR revisado → `main` → EasyPanel faz pull e rebuild automático.

> Configurar no EasyPanel: **Source → GitHub → Branch: main → Auto deploy: On push**. A cada push em `main`, o EasyPanel faz rebuild e restart do container `flowcrm-app`.

---

## 9. Estrutura de Arquivos

```
projeto1/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # redirect → /login
│   ├── error.tsx                       # Boundary de erro global (runtime errors)
│   ├── not-found.tsx                   # Página 404 customizada
│   ├── login/page.tsx                  # Tela de login
│   ├── auth/callback/route.ts          # OAuth callback
│   ├── api/
│   │   └── health/route.ts             # Health check (EasyPanel)
│   ├── dashboard/page.tsx              # Dashboard com KPIs
│   ├── pipeline/
│   │   ├── page.tsx                    # Kanban (funil ativo)
│   │   └── archive/page.tsx            # Oportunidades ganhas/perdidas/arquivadas
│   ├── customers/
│   │   ├── page.tsx                    # Lista de clientes
│   │   └── [id]/page.tsx               # Ficha do cliente
│   ├── opportunities/[id]/page.tsx     # Detalhe da oportunidade
│   └── settings/page.tsx              # Admin: configurações
├── components/
│   ├── ui/                             # shadcn/ui gerados
│   ├── kanban/
│   │   ├── Board.tsx                   # Container do Kanban
│   │   ├── Column.tsx                  # Coluna do funil
│   │   └── OpportunityCard.tsx         # Card da oportunidade
│   ├── customers/
│   │   └── CustomerForm.tsx
│   ├── LogoutButton.tsx
│   └── Navbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client (anon key)
│   │   ├── server.ts                   # SSR com cookies (anon key)
│   │   └── admin.ts                    # Service role — NUNCA importar em client components
│   └── utils.ts
├── types/
│   └── index.ts                        # Profile, Customer, Opportunity, PipelineStage
├── supabase/
│   └── migrations/                     # Arquivos .sql versionados
├── middleware.ts                        # Proteção de rotas
├── Dockerfile
├── .dockerignore
├── .env.local
└── Spec.md
```

---

## 10. Ordem de Desenvolvimento (Roadmap)

| Fase | Entregável | Prioridade |
|---|---|---|
| **0** | Auth completo (login Google + middleware) | ✅ Em andamento |
| **1** | Dockerfile + deploy base no EasyPanel (CI/CD desde o início) | Alta |
| **2** | Setup Supabase: tabelas + RLS + seed de etapas + JWT custom claim hook | Alta |
| **3** | Navbar + layout base autenticado | Alta |
| **4** | Módulo de Clientes (CRUD) | Alta |
| **5** | Kanban de oportunidades (drag & drop) + visão de Arquivo (`/pipeline/archive`) | Alta |
| **6** | Dashboard com KPIs | Média |
| **7** | Tela de Settings (admin) | Baixa |

> Deploy foi movido para Fase 1 para garantir que cada feature seja validada no ambiente real desde o início.

---

## 11. Critérios de Aceitação do MVP

- [ ] Login via Google funciona e cria sessão válida para usuário convidado
- [ ] Conta Google não convidada pelo admin não consegue acessar o sistema
- [ ] Rota `/pipeline` exibe as etapas do funil com suas oportunidades
- [ ] É possível mover um card entre colunas via drag & drop
- [ ] É possível criar, editar e arquivar uma oportunidade
- [ ] É possível cadastrar e visualizar clientes
- [ ] Dashboard exibe total de oportunidades abertas (`status = 'open'`) e soma do valor das oportunidades abertas por etapa
- [ ] Vendedor vê apenas suas oportunidades; gestor/admin veem tudo
- [ ] Aplicação roda em container Docker no EasyPanel com HTTPS
- [ ] Acesso a `/settings` por vendedor ou gestor redireciona para `/dashboard`
- [ ] `/api/health` retorna HTTP 200 com o container em execução

---

## 12. Decisões Técnicas Complementares

| Decisão | Definição |
|---|---|
| **Migrations** | Dev: `supabase db push`. Produção: `supabase link --project-ref <ref>` (uma vez) → revisar com `supabase migration list` → aplicar com `supabase db push` |
| **Expiração de sessão** | Sessão expira após 7 dias de inatividade (padrão Supabase — configurável em Auth Settings) |
| **Idioma** | Sistema somente em Português (PT-BR). Sem i18n no MVP |
| **Paginação** | Listas com mais de 50 registros usam paginação server-side via `range()` do Supabase |
| **Erro no OAuth** | Falha no callback redireciona para `/login?error=auth_callback_failed` com mensagem de erro visível ao usuário |
| **`ANON_KEY` exposta** | Intencional e segura — a barreira de segurança real é o RLS no banco, não a chave pública |
| **Offboarding de usuário** | Antes de deletar um perfil, o admin deve: (1) reatribuir todas as oportunidades do usuário via Settings; (2) reatribuir `created_by` dos clientes criados por ele. A deleção é bloqueada pelo banco (`RESTRICT`) enquanto houver oportunidades com `owner_id` referenciando o perfil |

---

*Spec gerado em 2026-04-15 — FlowCRM v2.1 — Final (revisões encerradas)*
