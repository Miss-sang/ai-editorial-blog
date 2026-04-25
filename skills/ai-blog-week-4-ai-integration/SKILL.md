---
name: ai-blog-week-4-ai-integration
description: Integrate Longcat-powered AI features for the AI technical blog project. Use when adding server-side Longcat gateway routes, article summarization, text explanation, article Q and A, AI writing assist, SSE streaming, prompt templates, or model fallback behavior.
---

# AI Blog Week 4 AI Integration

Add the AI features that separate this project from a standard blog, but keep them reliable and cheap enough for MVP.

## Scope

- Longcat adapter and server-side AI gateway
- article TLDR generation
- selected-text explanation
- Ask This Article streaming Q and A
- admin AI writing assist
- prompt templates and safe parsing
- disabled states when API keys are missing

## Default Deliverables

- shared Longcat client in server code
- dedicated server routes for summary, explain, article-qa, and write-assist
- frontend components for TLDR, explain popover, article QA drawer, and admin AI toolbar
- prompt templates that return parseable outputs
- request logging and basic usage limits

## Workflow

1. Start by isolating Longcat access behind one server utility.
2. Keep model names configurable through runtime config.
3. Implement non-streaming features first:
   - summary
   - explain
   - write assist
4. Add SSE streaming for article Q and A after the adapter is stable.
5. Build strict UI states:
   - loading
   - success
   - empty
   - rate-limited
   - API-key-missing
6. Log prompts and responses in a way that supports later analytics without leaking secrets.

## Longcat Rules

- Call `https://api.longcat.chat/openai` from server code only.
- Assume OpenAI-compatible chat behavior and SSE support.
- Do not rely on `tools`, `function calling`, or `response_format` being perfect for MVP.
- Prefer prompt-directed JSON and defensive parsing for structured outputs.
- Keep a cheap default model and an optional deeper-thinking model.

## Guardrails

- Do not expose raw article corpora or secrets to the browser.
- Do not build a full-site RAG system in week 4.
- Keep AI Q and A scoped to the current article for MVP.
- Avoid blocking the article page on AI responses; AI should enhance reading, not gate it.

## When To Create Child Skills

- Create child skills if week 4 needs to split into:
  - Longcat gateway
  - public AI reading UX
  - admin AI writing UX
  - prompt tuning and logging
- Prefix child skills with `ai-blog-week-4-`.

## Validation

- Verify all AI routes fail gracefully without keys.
- Verify summary, explain, and write-assist return usable content.
- Verify article Q and A streams tokens incrementally.
- Verify no browser bundle contains Longcat secrets.
