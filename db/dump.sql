-- =====================================================================
-- PantryChef — dump inicial do banco de dados (PostgreSQL 15+)
-- =====================================================================
-- Conteúdo:
--   1. Schema completo (tabelas, chaves, índices) — equivalente a
--      `alembic upgrade head`. A tabela alembic_version é carimbada na
--      última revisão para que a aplicação não tente remigrar.
--   2. Dados de teste: 1 usuário, 20 ingredientes e 3 receitas de exemplo.
--
-- Como aplicar (banco vazio):
--   createdb pantrychef
--   psql -d pantrychef -f db/dump.sql
--
-- Ou via Docker (com o serviço `db` no ar):
--   docker compose exec -T db psql -U postgres -d pantrychef < db/dump.sql
--
-- Credenciais do usuário de teste:
--   email: ana@example.com   senha: senha123
-- =====================================================================

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
CREATE TABLE public.favoritos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    receita_id uuid NOT NULL,
    salvo_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.historico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    receita_id uuid NOT NULL,
    visualizado_em timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.ingredientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    slug character varying NOT NULL
);
CREATE TABLE public.receita_ingredientes (
    receita_id uuid NOT NULL,
    ingrediente_id uuid NOT NULL,
    quantidade character varying
);
CREATE TABLE public.receitas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    slug character varying NOT NULL,
    modo_preparo text NOT NULL,
    categoria character varying,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id uuid
);
CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    email character varying NOT NULL,
    senha_hash character varying NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    deletado_em timestamp with time zone
);
ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.historico
    ADD CONSTRAINT historico_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ingredientes
    ADD CONSTRAINT ingredientes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.receita_ingredientes
    ADD CONSTRAINT receita_ingredientes_pkey PRIMARY KEY (receita_id, ingrediente_id);
ALTER TABLE ONLY public.receitas
    ADD CONSTRAINT receitas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT uq_favoritos_usuario_receita UNIQUE (usuario_id, receita_id);
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
CREATE INDEX ix_favoritos_usuario_id ON public.favoritos USING btree (usuario_id);
CREATE INDEX ix_historico_usuario_id ON public.historico USING btree (usuario_id);
CREATE UNIQUE INDEX ix_ingredientes_slug ON public.ingredientes USING btree (slug);
CREATE UNIQUE INDEX ix_receitas_slug ON public.receitas USING btree (slug);
CREATE INDEX ix_receitas_usuario_id ON public.receitas USING btree (usuario_id);
CREATE UNIQUE INDEX ix_usuarios_email ON public.usuarios USING btree (email);
ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.receitas
    ADD CONSTRAINT fk_receitas_usuario_id FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.historico
    ADD CONSTRAINT historico_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.historico
    ADD CONSTRAINT historico_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.receita_ingredientes
    ADD CONSTRAINT receita_ingredientes_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.receita_ingredientes
    ADD CONSTRAINT receita_ingredientes_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id) ON DELETE CASCADE;


-- =====================================================================
-- DADOS DE TESTE
-- =====================================================================

BEGIN;

-- Revisão do Alembic (head) — evita remigração no boot da aplicação.
INSERT INTO public.alembic_version (version_num) VALUES ('a1f2c3d4e5b6');

-- Usuário de teste (senha: senha123)
INSERT INTO public.usuarios (id, nome, email, senha_hash, criado_em, atualizado_em) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Ana', 'ana@example.com',
   '$2b$12$OHS1QGW5HtiJ7MCCDBcIReVrnOo12tU0XrsFvJRPXbGdwrqsJMbOq',
   '2026-06-09 12:00:00+00', '2026-06-09 12:00:00+00');

-- Ingredientes (catálogo base em pt-BR)
INSERT INTO public.ingredientes (id, nome, slug) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Tomate',           'tomate'),
  ('10000000-0000-4000-8000-000000000002', 'Cebola',           'cebola'),
  ('10000000-0000-4000-8000-000000000003', 'Alho',             'alho'),
  ('10000000-0000-4000-8000-000000000004', 'Frango',           'frango'),
  ('10000000-0000-4000-8000-000000000005', 'Arroz',            'arroz'),
  ('10000000-0000-4000-8000-000000000006', 'Feijão',           'feijao'),
  ('10000000-0000-4000-8000-000000000007', 'Batata',           'batata'),
  ('10000000-0000-4000-8000-000000000008', 'Cenoura',          'cenoura'),
  ('10000000-0000-4000-8000-000000000009', 'Ovo',              'ovo'),
  ('10000000-0000-4000-8000-000000000010', 'Leite',            'leite'),
  ('10000000-0000-4000-8000-000000000011', 'Queijo',           'queijo'),
  ('10000000-0000-4000-8000-000000000012', 'Macarrão',         'macarrao'),
  ('10000000-0000-4000-8000-000000000013', 'Carne Moída',      'carne-moida'),
  ('10000000-0000-4000-8000-000000000014', 'Pimentão',         'pimentao'),
  ('10000000-0000-4000-8000-000000000015', 'Azeite',           'azeite'),
  ('10000000-0000-4000-8000-000000000016', 'Manteiga',         'manteiga'),
  ('10000000-0000-4000-8000-000000000017', 'Farinha de Trigo', 'farinha-de-trigo'),
  ('10000000-0000-4000-8000-000000000018', 'Açúcar',           'acucar'),
  ('10000000-0000-4000-8000-000000000019', 'Sal',              'sal'),
  ('10000000-0000-4000-8000-000000000020', 'Pimenta do Reino', 'pimenta-do-reino');

-- Receitas de exemplo (autor: Ana)
INSERT INTO public.receitas (id, nome, slug, modo_preparo, categoria, usuario_id, criado_em) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Molho de Tomate', 'molho-de-tomate',
   'Refogue a cebola e o alho, junte o tomate e cozinhe por 20 minutos.',
   'Molho', 'a0000000-0000-4000-8000-000000000001', '2026-06-09 12:00:00+00'),
  ('c0000000-0000-4000-8000-000000000002', 'Bife Acebolado', 'bife-acebolado',
   'Tempere a carne, grelhe e finalize com a cebola dourada na manteiga.',
   'Prato Principal', 'a0000000-0000-4000-8000-000000000001', '2026-06-09 12:00:00+00'),
  ('c0000000-0000-4000-8000-000000000003', 'Omelete Simples', 'omelete-simples',
   'Bata os ovos com sal, despeje na frigideira quente e adicione o queijo.',
   'Café da Manhã', 'a0000000-0000-4000-8000-000000000001', '2026-06-09 12:00:00+00');

-- Itens das receitas (pivot receita_ingredientes)
INSERT INTO public.receita_ingredientes (receita_id, ingrediente_id, quantidade) VALUES
  -- Molho de Tomate
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '3 unidades'),
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '1 unidade'),
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '2 dentes'),
  -- Bife Acebolado
  ('c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000013', '500 g'),
  ('c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '2 unidades'),
  ('c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000016', '1 colher de sopa'),
  ('c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000019', 'a gosto'),
  -- Omelete Simples
  ('c0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000009', '3 unidades'),
  ('c0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000011', '50 g'),
  ('c0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000019', 'a gosto');

COMMIT;
