---
name: ai-blog-week-1-repo-tooling
description: Set up repository-level tooling for week 1 of the AI technical blog project. Use when creating or fixing package scripts, TypeScript config, ESLint and Prettier setup, environment variable conventions, module aliases, CI-friendly commands, or Vercel-ready build defaults.
---

# AI Blog Week 1 Repo Tooling

Own the project skeleton and developer ergonomics. This skill should make the repo consistent, runnable, and easy to extend.

## Primary Ownership

- `package.json`
- `tsconfig*.json`
- `.eslintrc*` or `eslint.config.*`
- `.prettierrc*`
- `.gitignore`
- `.env.example`
- `nuxt.config.ts` only for repo-level config, not page features
- CI or build helper files if they belong to week 1 bootstrap

## Core Tasks

- Normalize package manager usage and scripts.
- Add stable commands for `dev`, `build`, `lint`, `typecheck`, and `prepare` only if needed.
- Set TypeScript path aliases that match the folder structure.
- Align lint and formatting rules with a production Vue/Nuxt TypeScript codebase.
- Define environment keys without real secrets.
- Make the project deployable on Vercel without custom server assumptions.

## Workflow

1. Inspect the repo before changing anything.
2. Stabilize package scripts and config first.
3. Add missing config only if it materially improves development flow.
4. Keep defaults simple and readable.
5. Verify the main commands work before handing off to later skills.

## Guardrails

- Do not implement feature pages or business logic.
- Do not create a second app or split the repo.
- Do not add dev dependencies that solve imaginary future problems.
- Prefer conventions that are easy to explain in an interview.

## Done Criteria

- The repo has reliable dev, build, lint, and typecheck commands.
- Environment variable naming is consistent and documented in `.env.example`.
- Config files match the current folder layout.
- Vercel deployment assumptions are preserved.
