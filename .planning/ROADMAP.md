# Roadmap — Estafometro

**Product:** App web de evaluación y prevención de estafas digitales
**Version:** v0.1
**Status:** Planning

---

## Overview

Free, no-login web app helping non-technical users evaluate if a digital interaction is likely a scam. Returns risk bands (`low` / `medium` / `high` / `very_high`), detected signals, and actionable recommendations.

**Core principle:** The tool never says "this is safe" or "this is definitely fraud." It reports risk bands, detected signals, and concrete next actions.

**Stack:** Next.js (App Router) + TypeScript + Tailwind on Vercel, Supabase (Postgres + Storage), Gemini for extraction only.

**Working language:** Product copy and docs in Spanish (es-AR). Code identifiers and commits in English.

---

## Requirements

### Functional Requirements (RF-01…RF-18)

| ID | Requirement |
|----|-------------|
| RF-01 | Iniciar caso sin autenticación |
| RF-02 | Aceptar narrativa libre |
| RF-03 | Aceptar múltiples evidencias |
| RF-04 | Procesar una sola evidencia mínima |
| RF-05 | Extraer entidades relevantes |
| RF-06 | Clasificar el tipo de caso |
| RF-07 | Detectar señales de riesgo |
| RF-08 | Ejecutar checks externos condicionales |
| RF-09 | Realizar repreguntas mínimas |
| RF-10 | Calcular un nivel de riesgo |
| RF-11 | Explicar el porqué |
| RF-12 | Recomendar acción siguiente |
| RF-13 | Indicar incertidumbres |
| RF-14 | Registrar patrones y matches |
| RF-15 | Registrar señales estructuradas |
| RF-16 | Permitir feedback |
| RF-17 | Registrar analíticas de uso |
| RF-18 | Respetar política de privacidad mínima |

---

## Phases

### Phase 00: Foundation
**Goal:** Project skeleton ready — Next.js + TypeScript + Tailwind, Supabase client, folder structure, env vars, linters, shared types.

**Requirements:** RF-01 (infra), RF-18 (env setup for privacy)

**Plans:**
- [x] 00-01-PLAN.md — Scaffold project, configure Supabase client, shared types
- [x] 00-02-PLAN.md — Folder structure, linting, env documentation

---

### Phase 01: Data Model & Persistence
**Goal:** Full SQL schema in Supabase, seed initial data (signal_catalog), TypeScript types derived from schema, data access helpers.

**Requirements:** RF-15, RF-18

**Plans:**
- [x] 01-01-PLAN.md — SQL migrations for all tables (cases, case_evidence, case_entities, case_signals, analysis_runs, external_checks, patterns, pattern_versions, pattern_matches, candidate_patterns, case_candidate_pattern_links, feedback, analytics_events, signal_catalog)
- [x] 01-02-PLAN.md — TypeScript types, data access helpers (createCase, attachEvidence, storeEntities, storeSignals, storeAnalysisRun, storeFeedback, trackEvent)

---

### Phase 02: Intake & Initial UI
**Goal:** Functional UX for user to start a case and upload evidence without authentication. Landing + case creation + evidence upload + analysis-in-progress + base result screens.

**Requirements:** RF-01, RF-02, RF-03, RF-04, RF-11, RF-12

**Plans:**
- [x] 02-01-PLAN.md — Landing page, case creation form, evidence upload components
- [x] 02-02-PLAN.md — API endpoints (POST /api/cases, POST /api/cases/:id/evidence), client-side case state management

---

### Phase 03: Basic Analysis Pipeline
**Goal:** End-to-end pipeline — preprocessing (OCR, normalize) → extraction (Gemini, strict JSON) → entity extraction → result stored in DB.

**Requirements:** RF-05, RF-06, RF-13

**Plans:**
- [x] 03-01-PLAN.md — Preprocessing module (OCR, text normalization, entity parsing), extraction module (Gemini prompt, JSON validation)
- [x] 03-02-PLAN.md — Analysis endpoint (POST /api/cases/:id/analyze), result endpoint (GET /api/cases/:id/result), entity storage

---

### Phase 04: Signals & Scoring
**Goal:** Deterministic risk scoring based on signal catalog, regex rules, hard rules. Risk bands visible. Score NOT dependent on LLM.

**Requirements:** RF-07, RF-10, RF-11, RF-12, RF-15

**Plans:**
- [x] 04-01-PLAN.md — Signal detection (regex + catalog mapping), signal storage, deduplication
- [x] 04-02-PLAN.md — Risk engine (subscores → final score → band), hard rules, result display

---

### Phase 05: Pattern Engine
**Goal:** Fraud Pattern Library (JSON/YAML files) synced to Postgres, pattern matching against official patterns.

**Requirements:** RF-14

**Plans:**
- [x] 05-01-PLAN.md — Pattern library files, pattern loader, DB sync, pattern matching engine

---

### Phase 06: Candidate Patterns & Incremental Learning
**Goal:** Structural fingerprinting for new variants, upsert candidate_patterns, manual promotion path.

**Requirements:** RF-14

**Plans:**
- [x] 06-01-PLAN.md — Fingerprint builder, candidate pattern upsert logic

---

### Phase 07: External Enrichment
**Goal:** Conditionally run external checks (platform bypass, domain, website consistency, business presence, social profile). At least 2-3 functional checkers.

**Requirements:** RF-08, RF-13

**Plans:**
- [x] 07-01-PLAN.md — Enrichment module, external checkers (platform bypass, domain, website consistency)

---

### Phase 08: Feedback, Analytics & Observability
**Goal:** User feedback capture, analytics event tracking, basic dashboards / SQL views for metrics.

**Requirements:** RF-16, RF-17

**Plans:**
- [x] 08-01-PLAN.md — Feedback endpoint and UI, analytics events

---

### Phase 09: Privacy, Cleanup & Hardening
**Goal:** Data retention policies, sensitive data redaction, cleanup jobs, rate limiting, security hardening.

**Requirements:** RF-18

**Plans:**
- [x] 09-01-PLAN.md — Privacy module, retention policies, cleanup jobs

---

### Phase 10: Final Polish & Operational Documentation
**Goal:** README, architecture docs, migration guide, pattern sync guide, deployment guide, minimal test coverage for critical modules.

**Requirements:** All

**Plans:**
- [x] 10-01-PLAN.md — Technical documentation (README, architecture, guides)
- [x] 10-02-PLAN.md — Functional documentation, test coverage, examples

---

## Wave Structure

| Wave | Phases | Description |
|------|--------|-------------|
| 1 | 00, 01 | Foundation + Data model — no dependencies |
| 2 | 02, 03 | Intake UI + API, Analysis pipeline — depends on 01 |
| 3 | 04, 05, 06 | Signals/scoring, Pattern engine, Candidate patterns — depends on 02+03 |
| 4 | 07, 08 | Enrichment, Analytics — depends on 04+05 |
| 5 | 09, 10 | Privacy hardening, Documentation — depends on all |

---

## Key Decisions (Locked)

1. **LLM is never the source of the final score.** Signals, weights, and hard rules decide risk. Gemini extracts structure; it does not adjudicate.
2. **No single positive external check can override a critical red flag.**
3. **Hard rules floor the risk band.** `asks_for_otp` → min `high`; `authority_impersonation + bribery_request` → min `very_high`; `threatens_arrest + transfer_request` → min `very_high`.
4. **Privacy-first persistence.** Persist structured artifacts; raw screenshots/OCR/sensitive text are temporary.
5. **No embeddings, no scraping, no vector DB in MVP.** Incremental learning via structural fingerprints.
6. **Single-evidence cases must work.** Pipeline cannot require both narrative AND screenshots.
7. **No auth in MVP.** Cases created anonymously with a `public_id`.
8. **Spanish (es-AR) for product copy.** English for code identifiers and commits.

---

## Out of Scope

- Login and user profiles
- Extended case history per user
- WhatsApp bot integration
- Real-time monitoring
- Automatic reporting to authorities
- Legal identity verification
- Public reputation of phones/aliases
- Social moderation of reports
- Native app

---

## Next

Execute: `/gsd-execute-phase 00`

<sub>`/clear` first — fresh context window</sub>
