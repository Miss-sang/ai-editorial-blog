---
name: ai-blog-week-1-design-system
description: Build the week 1 design system for the AI technical blog project. Use when creating design tokens, Tailwind base layers, color and typography variables, spacing rules, surface styles, utility classes, or shared low-level UI primitives for the public site and admin shell.
---

# AI Blog Week 1 Design System

Own the visual foundation. This skill should define the project's look and reusable UI language before feature pages become complex.

## Primary Ownership

- `assets/styles/**`
- Tailwind config files
- low-level UI primitives under shared component folders
- typography, color, radius, and shadow tokens
- global container, section, and surface utilities

## Core Tasks

- Define semantic tokens for:
  - background
  - surface
  - border
  - text tiers
  - accent
  - success, warning, danger
- Establish type scale for hero, section, body, caption, and code.
- Build shared primitives such as:
  - container
  - section header
  - badge
  - button
  - input
  - empty state
  - loading skeleton
- Keep the design aligned with the agreed `AI Editorial + Console` direction.

## Workflow

1. Set tokens first.
2. Apply tokens through base styles and utilities.
3. Create only the primitives needed by week 1 and week 3 pages.
4. Test light and dark modes together rather than separately.
5. Favor restrained, premium UI over decorative gradients everywhere.

## Guardrails

- Do not drift into full page implementation unless a primitive needs a usage example.
- Do not use generic purple-on-white SaaS styling.
- Do not create too many component variants in week 1.
- Keep primitives composable and framework-native.

## Done Criteria

- The project has a coherent visual token system.
- Shared primitives exist for the shells and first public pages.
- Light and dark themes both look intentional.
- Later page work can reuse primitives without rewriting visual rules.
