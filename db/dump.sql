-- =====================================================================
-- PantryChef — dados de exemplo (PostgreSQL 15+)
-- =====================================================================
-- O esquema é criado pelas migrações do Alembic, aplicadas automaticamente
-- quando o container da API sobe. Este arquivo contém APENAS dados:
--   1 usuário, 20 ingredientes e 3 receitas de exemplo.
--
-- É idempotente (ON CONFLICT DO NOTHING) e resolve as referências por
-- slug/e-mail, então pode ser aplicado a qualquer momento, inclusive depois
-- do seed automático de ingredientes:
--   docker compose exec -T db psql -U postgres -d pantrychef < db/dump.sql
--
-- Credenciais do usuário de teste:
--   email: ana@example.com   senha: senha123
-- =====================================================================

BEGIN;

INSERT INTO public.usuarios (id, nome, email, senha_hash, criado_em, atualizado_em) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Ana', 'ana@example.com',
   '$2b$12$OHS1QGW5HtiJ7MCCDBcIReVrnOo12tU0XrsFvJRPXbGdwrqsJMbOq',
   '2026-06-09 12:00:00+00', '2026-06-09 12:00:00+00')
ON CONFLICT DO NOTHING;

INSERT INTO public.ingredientes (nome, slug) VALUES
  ('Tomate',           'tomate'),
  ('Cebola',           'cebola'),
  ('Alho',             'alho'),
  ('Frango',           'frango'),
  ('Arroz',            'arroz'),
  ('Feijão',           'feijao'),
  ('Batata',           'batata'),
  ('Cenoura',          'cenoura'),
  ('Ovo',              'ovo'),
  ('Leite',            'leite'),
  ('Queijo',           'queijo'),
  ('Macarrão',         'macarrao'),
  ('Carne Moída',      'carne-moida'),
  ('Pimentão',         'pimentao'),
  ('Azeite',           'azeite'),
  ('Manteiga',         'manteiga'),
  ('Farinha de Trigo', 'farinha-de-trigo'),
  ('Açúcar',           'acucar'),
  ('Sal',              'sal'),
  ('Pimenta do Reino', 'pimenta-do-reino')
ON CONFLICT DO NOTHING;

INSERT INTO public.receitas
  (nome, slug, modo_preparo, categoria, tempo_preparo, dificuldade, usuario_id, criado_em)
SELECT r.nome, r.slug, r.modo_preparo, r.categoria, r.tempo_preparo, r.dificuldade,
       u.id, '2026-06-09 12:00:00+00'
FROM (VALUES
  ('Molho de Tomate', 'molho-de-tomate',
   '1. Refogue a cebola e o alho no azeite. 2. Junte o tomate picado. 3. Cozinhe em fogo baixo por 20 minutos.',
   'Molho', 30, 'facil'),
  ('Bife Acebolado', 'bife-acebolado',
   '1. Tempere a carne com sal. 2. Grelhe em frigideira bem quente. 3. Finalize com a cebola dourada na manteiga.',
   'Prato Principal', 25, 'medio'),
  ('Omelete Simples', 'omelete-simples',
   '1. Bata os ovos com sal. 2. Despeje na frigideira quente. 3. Adicione o queijo e dobre ao meio.',
   'Café da Manhã', 10, 'facil')
) AS r(nome, slug, modo_preparo, categoria, tempo_preparo, dificuldade)
LEFT JOIN public.usuarios u ON u.email = 'ana@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.receita_ingredientes (receita_id, ingrediente_id, quantidade)
SELECT r.id, i.id, itens.quantidade
FROM (VALUES
  ('molho-de-tomate', 'tomate',      '3 unidades'),
  ('molho-de-tomate', 'cebola',      '1 unidade'),
  ('molho-de-tomate', 'alho',        '2 dentes'),
  ('bife-acebolado',  'carne-moida', '500 g'),
  ('bife-acebolado',  'cebola',      '2 unidades'),
  ('bife-acebolado',  'manteiga',    '1 colher de sopa'),
  ('bife-acebolado',  'sal',         'a gosto'),
  ('omelete-simples', 'ovo',         '3 unidades'),
  ('omelete-simples', 'queijo',      '50 g'),
  ('omelete-simples', 'sal',         'a gosto')
) AS itens(receita_slug, ingrediente_slug, quantidade)
JOIN public.receitas r ON r.slug = itens.receita_slug
JOIN public.ingredientes i ON i.slug = itens.ingrediente_slug
ON CONFLICT DO NOTHING;

COMMIT;
