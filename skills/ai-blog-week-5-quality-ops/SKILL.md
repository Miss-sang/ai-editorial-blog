---
name: ai-blog-week-5-quality-ops
description: Add week 5 quality, telemetry, and production safeguards to the AI technical blog project. Use when implementing visit, search, and AI logs, rate limiting, loading or error states, responsive polishing, accessibility refinements, testing, performance checks, or operational guardrails.
---

# AI Blog Week 5 Quality Ops

Harden the product. This week is about trust, resilience, and smooth presentation, not new headline features.

## Scope

- visit, search, and AI usage logs
- rate limits and abuse protection
- loading, empty, and error states
- responsive cleanup and accessibility fixes
- basic tests and regression coverage
- performance and caching review
- operational env and failure handling

## Default Deliverables

- server-side telemetry tables and routes
- AI usage and search logging
- rate limiting for auth, uploads, and AI endpoints
- mobile and tablet layout cleanup
- skeletons, fallbacks, and empty states across public and admin UI
- core tests for high-risk flows

## Workflow

1. Instrument first, then polish based on real rough edges.
2. Focus telemetry on what matters for MVP:
   - page visits
   - search queries
   - AI feature usage
3. Add rate limits around expensive or abusable routes.
4. Sweep the app for broken empty states, loading states, and error states.
5. Run responsive fixes on the public pages before admin refinements.
6. Add tests only where regressions would be embarrassing in a demo:
   - auth
   - article CRUD
   - article render
   - AI gateway happy path and failure path

## Guardrails

- Do not invent vanity analytics dashboards that provide no product value.
- Do not treat week 5 as a rewrite phase.
- Prefer targeted fixes over broad refactors.
- Accessibility work should improve keyboard flow, focus visibility, and semantic labeling first.

## When To Create Child Skills

- Create child skills if week 5 needs to split into:
  - telemetry
  - responsive and accessibility polish
  - tests and quality gates
  - performance review
- Prefix child skills with `ai-blog-week-5-`.

## Validation

- Verify telemetry records without breaking the main UX.
- Verify expensive routes have clear failure and rate-limit behavior.
- Run tests and summarize any remaining high-risk gaps.
- Confirm core public flows look correct on mobile, tablet, and desktop.
