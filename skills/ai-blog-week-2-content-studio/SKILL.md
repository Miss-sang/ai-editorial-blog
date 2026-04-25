---
name: ai-blog-week-2-content-studio
description: Build week 2 content-studio capability for the AI technical blog project. Use when implementing Prisma content models, admin auth and session routes, Supabase storage uploads, article/topic/tag/project CRUD, editor screens, or draft and publish flows.
---

# AI Blog Week 2 Content Studio

Turn the project from a static shell into a manageable content system. This week owns data shape and authoring flows.

## Scope

- Prisma content schema
- Admin auth and protected routes
- Supabase storage upload flow
- Article, topic, tag, and project CRUD
- Markdown editor and metadata form
- Draft and publish state transitions
- Basic admin dashboard summaries

## Default Deliverables

- `prisma/schema.prisma` with initial production-facing tables
- server routes for auth, article CRUD, tag CRUD, topic CRUD, project CRUD, and uploads
- admin pages for list, create, edit, publish, and archive flows
- shared admin form components for metadata and editor actions
- storage integration that returns safe public asset URLs

## Workflow

1. Finalize the content schema before building forms.
2. Prefer a simple server-side admin session over front-end-only localStorage auth.
3. Keep uploads behind server routes. Do not put privileged storage credentials in the client.
4. Build article editing around a single canonical source of truth:
   - title
   - slug
   - excerpt
   - cover
   - markdown
   - tags
   - topic
   - SEO
   - status
5. Implement list and edit views before trying to polish dashboards.
6. Seed enough demo content to unblock week 3 public pages.

## Guardrails

- Do not build a multi-role permission system in MVP.
- Do not over-design admin analytics yet.
- Do not create separate backend infrastructure outside the Nuxt server routes.
- Keep schema names stable and readable; avoid premature abstraction tables.

## When To Create Child Skills

- Create child skills if week 2 needs to split into:
  - admin auth
  - content schema and Prisma
  - upload and storage
  - editor UX
- Prefix child skills with `ai-blog-week-2-`.

## Validation

- Run Prisma generate and migration-related checks if configured.
- Verify protected admin pages reject unauthenticated access.
- Verify upload returns usable asset URLs.
- Verify article create, edit, draft, and publish flows round-trip through the database.
