---
name: ai-blog-week-1-foundation
description: Establish week 1 foundation for the AI technical blog project using a single Nuxt 3 fullstack repo. Use when scaffolding package and tooling setup, route shells, design tokens, Tailwind setup, shared layout, Vercel-ready env handling, Supabase and Prisma bootstrapping, or repository standards.
---

# AI Blog Week 1 Foundation

Create the baseline that every later week depends on. Finish structure, not business depth.

## Scope

- Nuxt 3 fullstack project structure
- TypeScript, lint, format, and basic scripts
- Tailwind and global design tokens
- Public route shells and admin route shells
- Shared layout, navigation, and empty states
- Prisma and Supabase bootstrap files
- `.env.example` and deploy-safe config defaults
- Vercel-friendly build baseline

## Default Deliverables

- `package.json` scripts for dev, build, lint, and typecheck
- `nuxt.config.ts` with app metadata, runtime config, and modules
- `app.vue`, `layouts/default.vue`, and route skeletons
- `assets/styles/` with base tokens and utilities
- `components/app/` shell components
- `server/utils/` or `server/lib/` bootstrap helpers
- `prisma/schema.prisma` initial shell
- `.env.example`

## Workflow

1. Inspect the existing repo before adding files. Reuse what already exists.
2. Normalize tooling first: package manager, scripts, lint, formatting, TS config.
3. Establish design tokens before building page sections.
4. Create route shells for:
   - `/`
   - `/articles`
   - `/articles/[slug]`
   - `/search`
   - `/labs`
   - `/projects`
   - `/about`
   - `/admin`
5. Add minimal shared app chrome: header, footer, container, section heading, empty state.
6. Stub server-safe env access for Supabase and Longcat without real keys.
7. Leave placeholders and TODOs only where external credentials are required.

## Guardrails

- Do not implement full CRUD or real AI features in week 1.
- Do not split into multiple repos.
- Do not add premature global state unless a shared UI concern requires it.
- Prefer boring, stable project structure over creative folder inventions.

## When To Create Child Skills

- Create a child skill if week 1 splits naturally into:
  - design system
  - repository tooling
  - data and env bootstrap
- Prefix child skills with `ai-blog-week-1-`.

## Validation

- Run the local dev server if dependencies exist.
- Run typecheck and build if scripts exist.
- Confirm all core routes render shell UI without crashing.
- Confirm no browser-side file contains real secrets.
