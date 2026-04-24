# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Greenfield. The repo currently contains **design documentation only** (in Spanish, under `docs/`) and no source code. Any implementation work starts from scratch against the specs below. Do not assume package.json, migrations, or module scaffolding exist — check before referencing them.

## What this product is

**Estafometro**: a free, no-login web app that helps non-technical users evaluate whether a digital interaction (WhatsApp/Instagram/SMS message, marketplace listing, "bank support" call, etc.) is likely a scam, and returns a prudent, actionable recommendation — *not* a verdict.

Core UX principle: the tool never says "this is safe" or "this is definitely fraud." It reports risk bands (`low` / `medium` / `high` / `very_high`), detected signals, and a concrete next action ("don't transfer yet", "verify through another channel").

## Source-of-truth documents

Read these before implementing any module — they define contracts, entities, and pipeline order. All three are in [docs/](docs/):

- [especificacion_funcional.md](docs/especificacion_funcional.md) — functional spec: user flows, inputs/outputs, risk bands, screens, RF-01…RF-18 requirements.
- [especificacion_tecnica.md](docs/especificacion_tecnica.md) — technical architecture: 8 pipeline modules, data model entities, signal catalog, scoring formula, API surface, LLM JSON schema.
- [plan_implementacion.md](docs/plan_implementacion.md) — phased build plan (Fase 0 → Fase 10) with explicit module list and dependency graph. **Follow this ordering** unless the user overrides it.

When a user request is ambiguous, the spec hierarchy is: functional > technical > plan. The plan is execution guidance, not a contract.

## Architecture in one paragraph

Next.js (App Router) + TypeScript + Tailwind on Vercel, with Supabase (Postgres + Storage) for persistence. A case flows through 8 server-side modules in order: **intake → preprocessing (OCR, normalize) → extraction (Gemini, strict JSON out) → signal engine (regex + catalog + hard rules) → enrichment (conditional external checks) → pattern engine (match official `patterns/` library, upsert `candidate_patterns` via structural fingerprint) → risk engine (subscores → final score → band) → explanation engine (user-facing summary + recommendation)**. Gemini is used for extraction/summarization only; scoring and the final decision are driven by deterministic rules and the signal catalog, not the LLM.

## Non-obvious design rules that must be preserved

These are load-bearing decisions from the spec — violating them breaks the product's safety posture:

- **LLM is never the source of the final score.** Signals, weights, and hard rules decide risk. Gemini extracts structure; it does not adjudicate.
- **No single positive external check can override a critical red flag.** E.g. a "nice-looking" Instagram profile does not cancel `platform_bypass + off_platform_payment`.
- **Hard rules floor the risk band.** `asks_for_otp` → min `high`; `authority_impersonation + bribery_request` → min `very_high`; `threatens_arrest + transfer_request` → min `very_high`.
- **Privacy-first persistence.** Persist structured artifacts (entities, signals, scores, fingerprints) long-term; raw screenshots/OCR/sensitive text are temporary. `candidate_patterns` store fingerprints, not raw case text.
- **No embeddings, no scraping, no vector DB in MVP.** Incremental learning is done via structural fingerprints hashed into `candidate_patterns`.
- **Single-evidence cases must work.** The pipeline cannot require both narrative *and* screenshots — one input is enough for a first pass.
- **No auth in MVP.** Cases are created anonymously with a `public_id`.

## Fraud Pattern Library

Two-level: versioned JSON/YAML files under a `patterns/` directory (source of truth) synced into Postgres (`patterns`, `pattern_versions`) for runtime matching. A case produces a `fingerprint` (hashed structural signature of `{actor, threat, requested_action, payment_reason, theme, urgency}`); matches go to `pattern_matches`, unknown fingerprints upsert into `candidate_patterns` (with `occurrence_count`, `first_seen_at`, `last_seen_at`) and are manually promoted to official patterns later.

## API surface (target)

`POST /api/cases`, `POST /api/cases/:id/evidence`, `POST /api/cases/:id/analyze`, `GET /api/cases/:id/result`, `POST /api/cases/:id/feedback`, plus internal `POST /api/internal/patterns/sync` and `POST /api/internal/candidate-patterns/promote`. MVP runs the pipeline synchronously inside `/analyze`; only move to async if latency forces it.

## Working language

Product copy, docs, and user-facing strings are in **Spanish (es-AR)**. Code identifiers, commits, and PR descriptions are in English. Keep this split — don't translate the docs.

## Commands

None yet. Once Fase 0 lands, add the real `npm run dev` / migration / lint commands here.
