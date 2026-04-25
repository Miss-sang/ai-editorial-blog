---
name: ai-blog-program-manager
description: "Coordinate the six-week AI technical blog build based on the agreed stack: Nuxt 3 fullstack, TypeScript, Tailwind, Supabase, Prisma, Vercel, and Longcat. Use when the user asks what week to do next, wants to execute a weekly milestone, needs to split a week into narrower child skills, or needs architecture decisions reconciled before implementation."
---

# AI Blog Program Manager

Select the correct weekly skill, keep the stack stable, and stop the project from drifting into a larger full-stack product than the user wants.

## Fixed Contract

- Keep a single-repo Nuxt 3 fullstack architecture unless the user explicitly changes it.
- Keep AI calls server-side only. Never expose Longcat keys in browser code.
- Favor Vercel, Supabase, and other managed services over self-hosted infrastructure.
- Optimize for front-end interview value: polished public UX, strong component structure, credible AI features.
- Treat the public site and admin studio as one product, not as separate repos.

## Weekly Routing

- Use `ai-blog-week-1-foundation` for repo bootstrap, design tokens, layouts, envs, and deploy baseline.
- Use `ai-blog-week-2-content-studio` for Prisma models, admin auth, uploads, and content CRUD.
- Use `ai-blog-week-3-public-web` for public pages, markdown rendering, search, SEO, and reading experience.
- Use `ai-blog-week-4-ai-integration` for Longcat adapter, AI reading, AI writing, and streaming UX.
- Use `ai-blog-week-5-quality-ops` for telemetry, polish, safeguards, testing, and responsive cleanup.
- Use `ai-blog-week-6-launch-packaging` for deployment hardening, demo content, screenshots, and interview packaging.

## Workflow

1. Inspect the repo and decide which week is currently incomplete.
2. Load exactly one weekly skill as the active implementation guide.
3. Keep the active week narrow. Do not mix major work from multiple weeks in one pass unless the dependency is blocking.
4. If the active week still contains 3 or more unrelated workstreams, create child skills under `skills/generated/` with names prefixed by the current week.
5. Preserve existing user edits and work with the current codebase rather than resetting structure.
6. End each pass with completed work, validation notes, and the next missing milestone.

## Child Skill Rule

- Create child skills only when the current week becomes too broad to execute reliably.
- Create child skills inside the workspace, not in global skill directories.
- Use `skill-creator` to generate child skill folders.
- Keep child skills task-specific, for example:
  - `ai-blog-week-1-design-system`
  - `ai-blog-week-2-admin-auth`
  - `ai-blog-week-4-longcat-gateway`
  - `ai-blog-week-5-telemetry-tests`

## Ask The User Only For Real Inputs

- Brand name, headline copy, and visual direction if those are still undefined.
- External credentials such as Supabase, Vercel, or Longcat keys.
- Final domain name, analytics vendor, or third-party service choices.
- Any product decision that changes the agreed stack or MVP boundary.

## Done Criteria

- The selected weekly milestone is complete or clearly blocked by missing user-owned inputs.
- Validation has been run for the code changed in that pass.
- The next recommended week or child skill is explicitly identified.
