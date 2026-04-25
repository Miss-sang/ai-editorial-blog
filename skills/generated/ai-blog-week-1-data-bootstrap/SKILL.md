---
name: ai-blog-week-1-data-bootstrap
description: Prepare the week 1 data and environment bootstrap for the AI technical blog project. Use when creating the initial Prisma shell, Supabase connectivity helpers, server-side runtime config, upload or storage scaffolding, environment-safe utilities, or placeholder database access patterns for later weeks.
---

# AI Blog Week 1 Data Bootstrap

Own the data-facing foundation without implementing the full content system. This skill should make later database and storage work straightforward.

## Primary Ownership

- `prisma/schema.prisma`
- `server/utils/**` or `server/lib/**` data helpers
- Supabase client bootstrap files
- runtime config access helpers
- server-side env-safe wrappers for storage and AI config

## Core Tasks

- Create the initial Prisma schema shell with the agreed MVP model directions.
- Add Prisma client bootstrap that works in a serverless-friendly Nuxt environment.
- Create Supabase server helper stubs for database and storage usage.
- Define runtime config keys for:
  - database
  - Supabase
  - Longcat
  - site URL
  - admin session secret
- Keep all credential handling server-side.

## Workflow

1. Start by matching the agreed MVP entities rather than inventing extras.
2. Add env-safe access helpers before any feature-specific data code.
3. Build only bootstrap and connectivity layers in week 1.
4. Leave the actual CRUD logic to week 2.
5. Prefer stable and explicit config naming over smart wrappers.

## Guardrails

- Do not wire real secrets into committed files.
- Do not build full auth, uploads, or article CRUD here.
- Do not create duplicate client factories for the same service.
- Keep server and client boundaries explicit.

## Done Criteria

- Prisma and Supabase bootstrap code exists and is coherent.
- Runtime config keys are defined and documented.
- Storage and AI integrations have safe placeholder entry points.
- Week 2 can start building real content and admin features without restructuring the foundation.
