# PantryChef Frontend

Frontend web do PantryChef, construído com React + Vite + TypeScript.

## Stack

- React 18 + Vite
- TypeScript
- Tailwind CSS + shadcn/ui
- React Router DOM
- Framer Motion
- React Hook Form + Zod
- TanStack Query
- Lucide React
- Vitest + Testing Library

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse http://localhost:5173

## Testes

```bash
npm run test        # watch mode
npm run test:run    # single run
```

## Build

```bash
npm run build
```

## Estrutura

```
src/
├── app/          # Configuração (router, providers, layouts)
── features/     # Features por domínio
├── shared/       # Componentes e hooks compartilhados
├── types/        # Tipos TypeScript globais
├── lib/          # Utilitários
└── test/         # Configuração de testes
```