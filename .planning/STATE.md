# State — Estafometro

**Last updated:** 2026-04-21

---

## Project Status

| Dimension | Status |
|-----------|--------|
| Overall | Greenfield — design docs only, no source code |
| Phase | 00 (not started) |
| Source code | None |
| Database | Not initialized |
| Deployment | None |

---

## Decisions (Locked)

| Decision | Source |
|----------|--------|
| Next.js App Router + TypeScript + Tailwind | especificacion_tecnica.md |
| Supabase (Postgres + Storage) | especificacion_tecnica.md |
| Gemini for extraction only (NOT scoring) | especificacion_tecnica.md, plan_implementacion.md |
| No auth in MVP | especificacion_funcional.md |
| No embeddings/vector DB | especificacion_tecnica.md |
| Spanish (es-AR) product copy | CLAUDE.md |
| English code identifiers | CLAUDE.md |

---

## Decisions (Deferred)

| Decision | Notes |
|----------|-------|
| Dark mode | Not required for MVP |
| Search functionality | Not in MVP scope |
| User history | Not in MVP scope |

---

## Blockers

| Blocker | Phase |
|---------|-------|
| None yet | — |

---

## Pending Issues

| Issue | Phase |
|-------|-------|
| Need Supabase project set up | 00 |
| Need Gemini API key | 00 |
| Need Vercel account | 00 |

---

## Phase Log

| Phase | Status | Completion |
|-------|--------|------------|
| 00 — Foundation | pending | — |
| 01 — Data Model | pending | — |
| 02 — Intake UI | pending | — |
| 03 — Analysis Pipeline | pending | — |
| 04 — Signals & Scoring | pending | — |
| 05 — Pattern Engine | pending | — |
| 06 — Candidate Patterns | pending | — |
| 07 — Enrichment | pending | — |
| 08 — Analytics | pending | — |
| 09 — Privacy | pending | — |
| 10 — Polish | pending | — |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Vercel Serverless Functions, Supabase Edge Functions |
| Database | Supabase Postgres |
| Storage | Supabase Storage (temporary evidence) |
| AI | Gemini API (extraction only) |
| Deployment | Vercel |

---

## Useful Commands

| Command | Phase |
|---------|-------|
| `npm run dev` | Local development |
| `supabase db push` | Push migrations |
| `vercel deploy` | Deploy to Vercel |

---

<sub>Edit this file as phases complete</sub>
