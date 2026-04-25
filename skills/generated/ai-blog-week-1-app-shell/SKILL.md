---
name: ai-blog-week-1-app-shell
description: Create the week 1 application shell for the AI technical blog project. Use when building layouts, route shells, shared navigation, footer structure, top-level page placeholders, public and admin chrome, or the first screen hierarchy for the public app.
---

# AI Blog Week 1 App Shell

Own the route structure and shared chrome. This skill should make the app navigable before real content and business logic arrive.

## Primary Ownership

- `app.vue`
- `layouts/**`
- route shell pages
- shared app header, footer, side navigation, top bar
- page-level placeholder sections for public and admin routes

## Core Tasks

- Establish public and admin shell separation.
- Create route placeholders for:
  - `/`
  - `/articles`
  - `/articles/[slug]`
  - `/search`
  - `/labs`
  - `/projects`
  - `/about`
  - `/admin`
- Build reusable layout pieces:
  - public header
  - footer
  - global command entry
  - admin sidebar
  - admin topbar
- Ensure shells already respect responsive breakpoints.

## Workflow

1. Create the top-level route map first.
2. Build shared layout components before page-specific placeholders.
3. Make the first viewport strong on the homepage shell.
4. Keep admin shell utility-first and clean, not marketing-heavy.
5. Leave hooks for later data loading and AI modules without faking them as finished.

## Guardrails

- Do not implement final article rendering logic here.
- Do not add real admin CRUD tables yet.
- Do not let placeholder pages become throwaway code; make them reusable shells.
- Keep navigation labels and IA aligned with the agreed MVP.

## Done Criteria

- All core routes exist and render through shared layouts.
- Public and admin shells are visually distinct and navigable.
- The homepage shell establishes brand hierarchy.
- Later week skills can drop real content into stable page scaffolds.
