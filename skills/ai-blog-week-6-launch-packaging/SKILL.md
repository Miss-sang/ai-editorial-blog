---
name: ai-blog-week-6-launch-packaging
description: Finish week 6 launch preparation for the AI technical blog project. Use when polishing visual details, seeding demo content, writing deployment docs, preparing screenshots and talking points, validating the hosted build, or packaging the project as an interview-ready showcase.
---

# AI Blog Week 6 Launch Packaging

Package the project so it is easy to deploy, easy to demo, and easy to explain in an interview.

## Scope

- final visual polish
- demo-safe seed data and screenshots
- deploy checklist and env documentation
- README and architecture summary
- interview talking points and resume bullets
- final regression pass on the hosted build

## Default Deliverables

- cleaned-up public UI and admin UI details
- stable demo content that highlights AI features
- deployment instructions and `.env.example` alignment
- concise architecture summary and feature summary
- interview-facing bullets explaining technical tradeoffs and product value

## Workflow

1. Freeze architecture. Do not introduce large new features in week 6.
2. Seed content that demonstrates:
   - strong article rendering
   - Longcat AI reading
   - admin AI writing assist
   - polished project storytelling
3. Clean visual inconsistencies and remove obviously unfinished UI.
4. Verify deployment, runtime config, and database setup instructions are accurate.
5. Prepare project-story artifacts:
   - short README summary
   - architecture bullets
   - interview talking points
   - resume bullets
6. Run a final end-to-end demo path from landing page to admin publishing to AI article reading.

## Guardrails

- Do not treat week 6 as a refactor excuse.
- Do not add hidden setup steps that make the project harder to demo.
- Do not leave screenshots or docs stale after changing behavior.
- Prioritize clarity and trust over extra ornament.

## When To Create Child Skills

- Create child skills if week 6 needs to split into:
  - launch docs
  - demo content
  - interview packaging
  - final UI polish
- Prefix child skills with `ai-blog-week-6-`.

## Validation

- Verify deploy docs by matching them to the actual repo files and env names.
- Verify the main hosted or local demo path works without manual patching.
- Verify screenshots, bullets, and docs reflect the current product.
