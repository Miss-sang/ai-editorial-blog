---
name: ai-blog-week-3-public-web
description: Implement week 3 public-reader experience for the AI technical blog project. Use when building public pages, markdown rendering, topic and tag discovery, SEO metadata, search UI, article table of contents, code presentation, or related-content blocks.
---

# AI Blog Week 3 Public Web

Build the public-facing product that interviewers will actually see. Prioritize polish, hierarchy, and reading quality.

## Scope

- Homepage
- Article list and article detail
- Topic page and search page
- Labs, projects, and about pages
- Markdown rendering pipeline
- Code blocks, Mermaid, KaTeX, TOC, reading progress
- SEO metadata and discovery UX

## Default Deliverables

- fully rendered public routes backed by real database content
- article rendering components and content utilities
- search UI with keyword-based results
- topic-driven navigation and related article blocks
- dynamic `title`, `description`, `og`, canonical, sitemap, and robots support

## Workflow

1. Start with the three highest-value routes:
   - `/`
   - `/articles`
   - `/articles/[slug]`
2. Make the article page the best page in the product before polishing secondary routes.
3. Build a stable markdown pipeline before layering UI effects on top.
4. Add search and related content once primary reading works.
5. Use SSR-friendly data fetching and route-level SEO defaults.
6. Keep the public visual system distinct from generic SaaS cards. Use strong typography and editorial composition.

## Guardrails

- Do not ship placeholder lorem ipsum once real seeded content exists.
- Do not defer mobile layout until the end.
- Do not overcomplicate search in week 3; keyword search is enough for MVP.
- Keep markdown rendering secure and deterministic.

## When To Create Child Skills

- Create child skills if week 3 needs to split into:
  - homepage art direction
  - article rendering engine
  - search and SEO
  - secondary pages
- Prefix child skills with `ai-blog-week-3-`.

## Validation

- Verify the three primary routes render with live data.
- Verify article markdown handles headings, code, Mermaid, and math without crashing.
- Verify SEO tags change per route.
- Verify public pages are readable on mobile and desktop.
