# Plan de implementación end-to-end — Estafometro

> Nota de estado: este documento es un plan histórico de arranque. El repositorio ya contiene aplicación Next.js, migraciones Supabase, pipeline, patrones y tests; no debe leerse como descripción del estado actual.

## Context

Repo greenfield. Solo existen `CLAUDE.md` y 3 specs en [docs/](docs/) (funcional, técnica, plan por fases). No hay código, ni `package.json`, ni migraciones, ni `patterns/`. El objetivo es producir **Estafometro**, una web app gratuita y sin login que ayuda a usuarios no técnicos a evaluar si una interacción digital es una posible estafa y les devuelve una recomendación prudente.

Este plan traduce los 3 docs en una secuencia ejecutable: estructura de repo, fases con entregables, modelo de datos concreto (14 tablas con tipos y FKs), contratos de API, catálogo inicial de señales con pesos numéricos, 6 patrones iniciales listos para cargar, decisiones técnicas resueltas (con ADRs propuestos), vacíos explícitos que requieren input, y un checklist numerado por sprint.

Reglas de producto **load-bearing** (de CLAUDE.md + docs — no se pueden violar):
- LLM extrae, no decide el score.
- Ningún check externo puede bajar un caso crítico por sí solo.
- Hard rules ponen piso al risk band (p.ej. `asks_for_otp` → min `high`; `authority_impersonation + bribery_request` → min `very_high`).
- MVP sin auth — casos anónimos con `public_id`.
- Privacy-first: persistir estructura, raw text/screenshots con retención corta.
- No embeddings / vector DB / scraping masivo en MVP.
- Copy del producto en es-AR; código/commits/identificadores en inglés.

---

## 0. Inconsistencias detectadas en los docs

Antes de arrancar, dejar resueltas:

1. **Numeración de fases.** `plan_implementacion.md` usa 0→10; `especificacion_tecnica.md` sec. 19 usa 1→5. Uso la del plan (canónica según CLAUDE.md).
2. **14 tablas, no 13.** `plan_implementacion.md` sec. 5 enumera 14; la técnica sec. 4 lista 12 entidades. La diferencia son `case_candidate_pattern_links` y `signal_catalog` — ambas necesarias.
3. **Modo síncrono vs async.** Técnica 14.1 dice síncrono; 14.2 admite async "si latency forces it" sin umbral. Resuelto abajo (D4).
4. **OCR.** Mencionado sin elección. Resuelto (D1).
5. **Gemini modelo.** Sin especificar. Resuelto (D3).
6. **Estructura `patterns/`.** Jerarquía por categoría, sin definir granularidad. Decisión: **un archivo YAML por patrón**.
7. **Repreguntas (RF-09).** Flujo funcional 8.4 las contempla; pipeline técnico no las modela. Requiere decisión (O2 abajo).
8. **`privacy_mode`.** Aparece en API pero no en modelo de datos ni regla operativa. Resuelto (D12).
9. **`case_candidate_pattern_links`** aparece solo en el plan, no en la técnica. Se mantiene.

---

## 1. Estructura final del repo

Next.js App Router plano (sin `apps/web/` porque es un solo builder — desviación menor del doc).

```text
.
├── CLAUDE.md
├── README.md
├── package.json                           # Next 15, React 19, TS strict, Tailwind, Zod, @supabase/supabase-js, pino, nanoid, tesseract.js
├── tsconfig.json                          # strict, noUncheckedIndexedAccess
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── vitest.config.ts
├── playwright.config.ts
├── .github/workflows/
│   ├── ci.yml                             # lint + typecheck + vitest
│   └── patterns-sync.yml                  # valida patterns/ en PR
├── docs/
│   ├── especificacion_funcional.md        # (existente)
│   ├── especificacion_tecnica.md          # (existente)
│   ├── plan_implementacion.md             # (existente)
│   └── adr/
│       ├── 0001-ocr-choice.md
│       ├── 0002-gemini-model.md
│       ├── 0003-rate-limit-postgres.md
│       ├── 0004-direct-upload-to-storage.md
│       └── 0005-privacy-mode-semantics.md
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260421000001_initial_schema.sql
│   │   ├── 20260421000002_signal_catalog_seed.sql
│   │   ├── 20260421000003_rls_policies.sql
│   │   └── 20260421000004_analytics_views.sql
│   ├── seed/
│   └── functions/cleanup-expired/index.ts
├── patterns/
│   ├── _schema.json                       # JSON Schema
│   ├── README.md
│   ├── authority_impersonation/arrest_threat_bribery.yaml
│   ├── online_purchase/
│   │   ├── marketplace_bypass.yaml
│   │   └── urgent_deposit_seller.yaml
│   ├── bank_support/
│   │   ├── otp_request.yaml
│   │   └── account_unlock_link.yaml
│   └── family_money/new_number_relative.yaml
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                       # landing (16.1)
│   │   ├── globals.css
│   │   ├── (marketing)/info/page.tsx      # límites (16.6)
│   │   ├── caso/
│   │   │   ├── nuevo/page.tsx             # intake (16.2)
│   │   │   └── [publicId]/
│   │   │       ├── page.tsx               # progreso (16.3)
│   │   │       └── resultado/page.tsx     # resultado+feedback (16.4-5)
│   │   └── api/
│   │       ├── cases/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── evidence/route.ts
│   │       │       ├── analyze/route.ts
│   │       │       ├── result/route.ts
│   │       │       └── feedback/route.ts
│   │       └── internal/
│   │           ├── patterns/sync/route.ts
│   │           └── candidate-patterns/promote/route.ts
│   ├── components/
│   │   ├── ui/                            # shadcn-style local
│   │   ├── case-intake/
│   │   ├── evidence-upload/
│   │   ├── analysis-progress/
│   │   ├── result/                        # RiskBadge, SignalList, ExternalFindings, RecommendationPanel, LimitsNotice, ResultSummary
│   │   └── feedback/FeedbackForm.tsx
│   ├── server/
│   │   ├── db/{client.ts, anon-client.ts, types.ts}
│   │   ├── cases/{create-case.ts, get-case.ts, repository.ts}
│   │   ├── evidence/{attach-evidence.ts, upload-to-storage.ts, validate-file.ts}
│   │   ├── preprocessing/{run-ocr.ts, normalize-text.ts, parse-basic-entities.ts, merge-evidence.ts}
│   │   ├── extraction/
│   │   │   ├── gemini-client.ts
│   │   │   ├── prompts/{extraction.v1.ts, explanation.v1.ts}
│   │   │   ├── run-extraction.ts
│   │   │   ├── schema.ts                  # Zod del output Gemini
│   │   │   └── normalize-entities.ts
│   │   ├── signals/
│   │   │   ├── catalog.ts                 # source of truth
│   │   │   ├── detectors/                 # regex-otp, regex-urgency, regex-platform-bypass, ...
│   │   │   ├── merge-signals.ts
│   │   │   ├── hard-rules.ts
│   │   │   └── dedupe.ts
│   │   ├── risk/{subscores.ts, final-score.ts, risk-band.ts, confidence.ts, apply-hard-rules.ts}
│   │   ├── patterns/{load-from-disk.ts, schema.ts, sync-to-db.ts, match-official.ts, match-score.ts}
│   │   ├── candidate-patterns/{fingerprint.ts, upsert.ts, promote.ts}
│   │   ├── enrichment/
│   │   │   ├── should-run.ts
│   │   │   ├── run-checks.ts
│   │   │   ├── findings-to-signals.ts
│   │   │   └── checkers/{platform-bypass.ts, domain.ts, website-consistency.ts, public-business.ts, social-profile.ts}
│   │   ├── explanations/{build-user-summary.ts, build-recommendations.ts, limits-notice.ts, top-signals.ts}
│   │   ├── analytics/{track-event.ts, events.ts}
│   │   ├── privacy/{redact.ts, retention-policy.ts, cleanup.ts}
│   │   ├── storage/{supabase-storage.ts, signed-urls.ts}
│   │   ├── rate-limit/postgres-rate-limit.ts
│   │   └── pipeline/run-analysis.ts       # orquestador central
│   ├── lib/
│   │   ├── validation/{case.ts, evidence.ts, api.ts}
│   │   ├── config/env.ts                  # zod-validated
│   │   ├── copy/es-ar.ts                  # copy centralizado
│   │   ├── errors.ts
│   │   ├── logger.ts                      # pino
│   │   ├── id.ts                          # nanoid
│   │   └── utils.ts
│   ├── types/{cases.ts, entities.ts, signals.ts, patterns.ts, analysis.ts, api.ts}
│   └── styles/
├── scripts/{sync-patterns.ts, gen-signal-seed.ts, gen-supabase-types.sh}
└── tests/
    ├── unit/{signals,risk,patterns,fingerprint}
    ├── integration/{create-case.test.ts, run-analysis.test.ts, pattern-match.test.ts}
    ├── fixtures/{cases,gemini-responses}
    └── e2e/happy-path.spec.ts
```

**Decisión arquitectónica clave:** todo el código servidor vive en `src/server/`; las rutas `src/app/api/*` son thin controllers que delegan a funciones puras → testables sin levantar Next.

---

## 2. Detalle por fase

Secuencia 0→10, agrupada en sprints. Feedback UI se adelanta a Sprint 4, no Fase 2, para no inflar el MVP mínimo.

### Fase 0 — Base del proyecto (Sprint 1)

- **Objetivo:** repo ejecutable localmente con stack y helpers base.
- **Archivos:** `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `.env.example`, `src/lib/config/env.ts`, `src/lib/{logger,errors,id}.ts`, `src/server/db/{client,anon-client}.ts`, `.eslintrc.cjs`, `.prettierrc`, `.github/workflows/ci.yml`, `vitest.config.ts`, `supabase/config.toml`.
- **Decisiones:** Next.js 15 (App Router), Supabase JS client (no `pg` directo — permite reusar para Storage/RLS), Zod en todos los bordes, Tailwind + componentes shadcn-style locales, TS strict, nanoid 12 chars para `public_id`, pino para logs.
- **Dependencias:** ninguna.
- **Riesgos:** Supabase local en Windows vía Docker. Mitigación: **usar Supabase cloud desde el inicio** (proyecto de dev separado).
- **Aceptación:** `npm run dev` levanta; `npm run lint` + `typecheck` pasan; health check a Supabase OK.

### Fase 1 — Modelo de datos y persistencia (Sprint 1)

- **Objetivo:** 14 tablas + enums + índices + seeds + repositorios CRUD.
- **Archivos:** migración `initial_schema.sql` (8 enums + 14 tablas + índices), `signal_catalog_seed.sql` (generada desde `src/server/signals/catalog.ts`), `src/server/signals/catalog.ts`, `scripts/gen-signal-seed.ts`, repositorios en `src/server/{cases,evidence,...}/`, `src/server/db/types.ts` (supabase gen types), `src/types/*.ts`.
- **Decisiones:** uuid PK default `gen_random_uuid()`; `public_id` nanoid separado; enums Postgres solo para dominios cerrados/estables (`risk_level`, `case_status`, `evidence_type`, `entity_type`, `signal_severity`, `check_type`, `check_status`, `privacy_mode`); `signal_code` = text + FK a `signal_catalog`; jsonb para snapshots volátiles; `timestamptz` siempre; índices en `cases(public_id)` unique, `case_signals(case_id, signal_code)`, `candidate_patterns(fingerprint)` unique; RLS activa pero MVP usa service role (gate en backend).
- **Dependencias:** Fase 0.
- **Riesgos:** enums cambiables fuerzan migraciones caras — mantener cerrados solo los estables.
- **Aceptación:** `supabase db reset` idempotente; tests de repositorio crean caso + adjuntan evidencia + leen con joins.

### Fase 2 — Intake + UI base (Sprint 1)

- **Objetivo:** crear caso anónimo con narrativa + evidencia, persistir, sin análisis aún.
- **Archivos:** `src/app/page.tsx`, `src/app/caso/nuevo/page.tsx`, `src/app/caso/[publicId]/{page,resultado/page}.tsx` (stubs), `src/app/api/cases/route.ts`, `src/app/api/cases/[id]/evidence/route.ts`, `src/components/{case-intake,evidence-upload}/*`, `src/lib/validation/{case,evidence}.ts`, `src/server/evidence/upload-to-storage.ts`.
- **Decisiones:** Server Actions para submits; bucket privado `case-evidence` + signed URLs (lectura) y **signed upload URLs directas cliente→Supabase Storage** (bypass Vercel 4.5MB body limit — ADR 0004); validación magic-byte además de MIME; límites 10MB/archivo, 5 archivos/caso, 30MB total; MIME: `image/{png,jpeg,webp}`.
- **Dependencias:** Fase 1.
- **Riesgos:** Vercel body size — resuelto con upload directo.
- **Aceptación:** RF-01–RF-04 end-to-end sin análisis.

### Fase 3 — Pipeline de análisis básico (Sprint 2)

- **Objetivo:** Gemini + OCR + parseo → entidades + summary persistidos.
- **Archivos:** `src/server/preprocessing/*`, `src/server/extraction/{gemini-client,run-extraction,schema,normalize-entities}.ts`, `src/server/extraction/prompts/extraction.v1.ts`, `src/server/pipeline/run-analysis.ts`, `src/app/api/cases/[id]/{analyze,result}/route.ts`.
- **Decisiones:**
  - **Gemini vía fetch REST** (no SDK — evita bugs de schema validation, menos peso). Modelo inicial **`gemini-2.0-flash-001`** (ADR 0002); fallback a `pro` solo si flash falla validación 2 veces.
  - **Response schema nativo de Gemini** + Zod del lado cliente como defensa.
  - **OCR: tesseract.js WASM local** (ADR 0001 — costo 0, privacy-first). Medir `ocr_quality_score`; migrar a Google Vision si falla > 20%.
  - Prompts como **constantes TS versionadas** (`PROMPT_VERSION = 'v1'`, persistido en `analysis_runs.prompt_version`).
  - **Síncrono** con `export const maxDuration = 60` (Vercel Pro requerido — ver O3).
  - Reintento único con prompt correctivo si JSON inválido; si falla, `status='partial'`.
  - **Lock advisory Postgres** (`pg_try_advisory_xact_lock(hashtext(case_id))`) para evitar doble análisis concurrente.
- **Dependencias:** Fases 1, 2.
- **Riesgos:** timeouts Gemini, OCR lento. Mitigaciones: resize pre-OCR, `Promise.all` de OCR paralelos, circuit breaker.
- **Aceptación:** caso con narrativa + 1 screenshot produce `case_type` + entidades + summary; `GET /result` los devuelve.

### Fase 4 — Señales y scoring (Sprint 2)

- **Objetivo:** lógica de riesgo determinística.
- **Archivos:** completar `src/server/signals/catalog.ts`, `src/server/signals/detectors/*`, `hard-rules.ts`, `merge-signals.ts`, `dedupe.ts`; `src/server/risk/*`; `src/server/explanations/build-recommendations.ts` básico; componentes `RiskBadge`, `SignalList`, `RecommendationPanel`.
- **Decisiones:**
  - **3 fuentes de señales** (regex deterministas, LLM, enrichment futuro) mergeadas con dedupe por `signal_code` → toma `max(confidence)`, acumula `sources[]`.
  - **Hard rules = función pura** `applyHardRules(signals, band) → flooredBand`. Ningún check externo puede bajar el piso.
  - **Subscores:** cada señal aporta a uno o más grupos (`signal_catalog.group_name`); subscore = suma truncada a `[0, 100/N]`; score final = suma clamped `[0,100]`.
  - **Banda:** 0-24 low, 25-49 medium, 50-74 high, 75-100 very_high.
  - **Confianza placeholder:** `clamp(0.2 + 0.1*n_signals + 0.2*has_external + 0.3*has_pattern_match, 0, 1)`.
- **Dependencias:** Fase 3.
- **Riesgos:** doble conteo señal LLM vs regex → dedupe estricta por code.
- **Aceptación:** suite "casos oro" (fixture por cada patrón) produce banda esperada ±0; hard rules verificados con casos sintéticos.

### Fase 5 — Pattern engine (Sprint 3)

- **Objetivo:** cargar Fraud Pattern Library + matching.
- **Archivos:** `patterns/_schema.json`, los 6 YAML iniciales (sec. 6 abajo), `src/server/patterns/*`, `src/app/api/internal/patterns/sync/route.ts` (protegido `x-internal-secret`), `scripts/sync-patterns.ts`.
- **Decisiones:** YAML (más legible que JSON); `pattern_versions` guarda `definition_snapshot jsonb` + `source_hash sha256` para rollback/audit; match score = `coverage(core)*0.6 + presence(high_weight)*0.3 + case_type_match*0.1`; threshold `>= 0.6`; match influye en: (a) aplicar `hard_rules` del patrón, (b) sobrescribir piso con `minimum_risk_level` si es más alto, (c) sumar `recommended_actions`.
- **Dependencias:** Fase 4.
- **Riesgos:** drift archivos vs DB — mitigar con `source_hash`.
- **Aceptación:** 6 patrones cargan; casos oro matchean su patrón esperado.

### Fase 6 — Candidate patterns (Sprint 3)

- **Objetivo:** variantes emergentes vía fingerprint estructural.
- **Archivos:** `src/server/candidate-patterns/{fingerprint,upsert,promote}.ts`, `src/app/api/internal/candidate-patterns/promote/route.ts`.
- **Decisiones:**
  - **Fingerprint:** `sha256(JSON.stringify({actor, threat, requested_action, payment_reason, theme, urgency_level}))` con keys ordenadas determinísticamente. Dimensiones provistas por LLM (con **set enumerado cerrado en el prompt** para evitar drift).
  - **Upsert solo si NO hay `pattern_match` oficial con score ≥ 0.8** — evita ensuciar candidatos con casos ya cubiertos.
  - **Nunca raw text** en `candidate_patterns` — solo fingerprint + componentes + `occurrence_count`.
- **Dependencias:** Fases 3, 4, 5.
- **Riesgos:** granularidad del fingerprint. Revisar balance manualmente en Fase 8.
- **Aceptación:** dos casos con misma signature incrementan `occurrence_count`; promoción manual crea pattern oficial.

### Fase 7 — Enrichment externo (Sprint 4)

- **Objetivo:** checks acotados que agregan señal externa.
- **Archivos:** `src/server/enrichment/{should-run,run-checks,findings-to-signals}.ts`, `checkers/*`.
- **Decisiones:**
  - **5 checkers sin API key third-party:** `platform-bypass` (heurístico marketplace+handle), `domain` (WHOIS RDAP público, sin key), `website-consistency` (HEAD fetch timeout 3s), `public-business-presence` (allowlist estática), `social-profile` (patrones handle lightweight).
  - **Timeout 3s/checker + global 5s**; `Promise.allSettled`; fallo individual NO aborta pipeline (`status='failed'`).
  - **Gate `should-run`:** solo si entidades relevantes + `case_type` lo amerita.
  - **Cap explícito:** un hallazgo externo positivo no puede bajar un caso crítico (hard rule del producto).
- **Dependencias:** Fase 4.
- **Riesgos:** latency. Mitigación: timeout global.
- **Aceptación:** caso con URL sospechosa genera `external_checks` row; fallo de checker no rompe análisis.

### Fase 8 — Feedback + analytics + observabilidad (Sprint 4)

- **Objetivo:** medición, loop de calidad, logs estructurados.
- **Archivos:** `src/app/api/cases/[id]/feedback/route.ts`, `FeedbackForm`, `src/server/analytics/{track-event,events}.ts`, migración `analytics_views.sql`, logger integrado en pipeline.
- **Decisiones:** feedback 3 dims (`helpful`, `false_alarm`, `comment?`) — sin estrellas; analytics en tabla Postgres + vistas SQL (sin Mixpanel/GA); logs JSON pino con Vercel log drain; Sentry opcional (O6).
- **Dependencias:** Fase 2 + 4.
- **Aceptación:** métricas 19.1–19.4 del funcional consultables por SQL.

### Fase 9 — Privacy, cleanup, hardening (Sprint 5)

- **Objetivo:** cumplir RF-18, RNF-05; resistir abuso.
- **Archivos:** `src/server/privacy/{redact,retention-policy,cleanup}.ts`, `supabase/functions/cleanup-expired/index.ts` (cron), `src/server/rate-limit/postgres-rate-limit.ts`.
- **Decisiones:**
  - **Rate limit en Postgres** (ADR 0003) — tabla `rate_limit_hits(ip_hash, bucket_key, window_start, count)` unique + upsert. 10 casos/h/IP, 5 análisis/h/IP. IP hasheada con salt.
  - **Retención:** screenshots → 72h; `case_evidence.raw_text` → 30 días; `analysis_runs.raw_llm_response` → 7 días; `candidate_patterns` sin raw, indefinido.
  - **`privacy_mode`** (ADR 0005):
    - `minimal_retention` (default): persiste estructura + raw con retención estándar.
    - `no_store_raw`: no persiste `raw_text` / `raw_llm_response` / originales de screenshots (borrado tras análisis in-memory); fingerprints y señales sí.
  - **Cleanup cron:** Supabase Edge Function diaria 03:00 UTC.
  - **RLS activa** con policies muy restrictivas; gate efectivo en backend (sin auth, no hay subject real).
  - **Turnstile** (decidir O4) si rate limit por IP no alcanza.
- **Dependencias:** todas.
- **Aceptación:** casos > 72h sin screenshots; test de `no_store_raw`; rate limit bloquea 11ª request/hora.

### Fase 10 — Documentación + tests (Sprint 5)

- **Objetivo:** handoff limpio.
- **Archivos:** `README.md`, `docs/adr/*.md` (0001–0005), `docs/ops/*.md`, suite de tests completa, 1 Playwright happy-path.
- **Decisiones:** Vitest (unit+integration, ESM/TS nativo) + Playwright (1 e2e).
- **Aceptación:** CI verde; README levanta proyecto en < 15 min; cobertura ≥ 70% en `src/server/`.

---

## 3. Modelo de datos concreto (14 tablas + 1 auxiliar)

### Enums Postgres

```sql
create type risk_level as enum ('low','medium','high','very_high');
create type case_status as enum ('received','processing','needs_context','analyzed','partial','error','expired');
create type evidence_type as enum ('narrative','pasted_chat','screenshot','url','username','alias','phone','note');
create type entity_type as enum ('platform','business_name','instagram_handle','url','domain','alias','cbu','phone','authority','bank','product','payment_method','marketplace');
create type signal_severity as enum ('info','low','medium','high','critical');
create type check_type as enum ('platform_bypass','domain','website_consistency','public_business','social_profile');
create type check_status as enum ('pending','success','failed','skipped');
create type privacy_mode as enum ('minimal_retention','no_store_raw');
```

### Tablas (PK `id uuid default gen_random_uuid()`, timestamps `timestamptz default now()`)

| # | Tabla | Columnas clave |
|---|-------|----------------|
| 1 | `cases` | `public_id text unique` (nanoid), `status case_status`, `privacy_mode privacy_mode`, `narrative_text text`, `merged_case_text text`, `case_type text`, `summary text`, `final_risk_score int 0..100`, `final_risk_level risk_level`, `confidence numeric(3,2)`, `ip_hash text`, `user_agent_hash text`, `expires_at`, `analyzed_at` |
| 2 | `case_evidence` | `case_id fk`, `evidence_type evidence_type`, `raw_text text` (nullable, retention), `storage_path text`, `ocr_text text`, `parsed_metadata jsonb`, `expires_at` |
| 3 | `case_entities` | `case_id fk`, `entity_type entity_type`, `value text`, `normalized_value text`, `confidence numeric(3,2)`, `source text` ('llm'\|'regex'\|'user_input'); index `(case_id, entity_type)` |
| 4 | `case_signals` | `case_id fk`, `signal_code text fk signal_catalog(code)`, `confidence numeric(3,2)`, `weight int`, `sources text[]`, `evidence_ref_id uuid`; **unique `(case_id, signal_code)`** |
| 5 | `signal_catalog` | `code text pk`, `group_name text`, `description text`, `default_weight int`, `severity signal_severity`, `is_active bool` |
| 6 | `analysis_runs` | `case_id fk`, `pipeline_version text`, `prompt_version text`, `llm_model text`, `status text` ('success'\|'partial'\|'error'), `raw_llm_response jsonb` (retention corta), `subscores jsonb`, `hard_rules_applied text[]`, `duration_ms int`, `error_message text` |
| 7 | `external_checks` | `case_id fk`, `check_type check_type`, `status check_status`, `result_summary text`, `result_json jsonb`, `signal_impact jsonb` |
| 8 | `patterns` | `code text unique`, `name text`, `category text`, `current_version_id fk pattern_versions`, `is_active bool` |
| 9 | `pattern_versions` | `pattern_id fk`, `version int`, `definition_snapshot jsonb`, `source_hash text`; **unique `(pattern_id, version)`** |
| 10 | `pattern_matches` | `case_id fk`, `pattern_id fk`, `pattern_version_id fk`, `match_score numeric(3,2)`, `matched_signals text[]`; index `(case_id)`, `(pattern_id)` |
| 11 | `candidate_patterns` | `fingerprint text unique`, `signature_components jsonb`, `occurrence_count int default 1`, `first_seen_at`, `last_seen_at`, `promoted_pattern_id fk patterns`, `status text` ('open'\|'promoted'\|'dismissed') |
| 12 | `case_candidate_pattern_links` | `case_id fk`, `candidate_pattern_id fk`; **unique `(case_id, candidate_pattern_id)`** |
| 13 | `feedback` | `case_id fk`, `helpful bool`, `false_alarm bool`, `comment text`; **unique `(case_id)`** |
| 14 | `analytics_events` | `id bigserial pk` (alto volumen), `event_type text`, `case_id fk null`, `properties jsonb`, `ip_hash text`; index `(event_type, created_at desc)` |
| aux | `rate_limit_hits` (Fase 9) | `ip_hash text`, `bucket_key text`, `window_start`, `count int`; **unique `(ip_hash, bucket_key, window_start)`** |

---

## 4. Contratos de API

Envelope: `{ ok: true, data }` o `{ ok: false, error: { code, message, details? } }`. Zod en request y response.

### `POST /api/cases`
- Request: `{ narrative_text?, privacy_mode?, evidence_metadata?: Array<{ type, value }> }` — al menos narrativa o una evidencia.
- Response 201: `{ case_id, public_id, status: 'received' }`

### `POST /api/cases/:publicId/evidence`
- multipart: `file` (image/{png,jpeg,webp} ≤10MB) OR `json { type: 'pasted_chat'|'url'|'username'|'alias'|'phone'|'note', value }`
- Response 201: `{ evidence_id, type, storage_path? }`

### `POST /api/cases/:publicId/analyze`
- Idempotente por `case_id` (si `analysis_runs.status='success'`, devuelve existente).
- Response 200 síncrono hasta ~60s: `{ case_id, public_id, status: 'analyzed'|'partial'|'error', analysis_run_id }`

### `GET /api/cases/:publicId/result`
```ts
{
  public_id, status,
  risk: { level, score, confidence, band_label_es },
  summary, case_type,
  signals: [{ code, description_es, severity, confidence }],
  external_findings: [{ type, summary_es, positive }],
  pattern_matches: [{ pattern_code, pattern_name_es, match_score }],
  uncertainties: string[],
  recommendations: string[],
  limits_notice: string,
  analyzed_at
}
```

### `POST /api/cases/:publicId/feedback`
- Request: `{ helpful, false_alarm?, comment? }` → `{ feedback_id }`

### `POST /api/internal/patterns/sync` (header `x-internal-secret`)
- Response: `{ added, updated, unchanged, errors: [] }`

### `POST /api/internal/candidate-patterns/promote`
- Request: `{ candidate_pattern_id, new_pattern_code, overrides }` → `{ pattern_id, pattern_version_id }`

---

## 5. Catálogo inicial de señales (weights 0–30, suma clamped [0,100])

### `interaction`
| code | severity | weight |
|---|---|---|
| `emotional_pressure` | medium | 10 |
| `urgency_language` | medium | 8 |
| `secrecy_request` | high | 12 |
| `identity_change` | high | 15 |
| `new_number_claim` | high | 14 |

### `urgency`
| `urgent_transfer` | high | 16 |
| `deadline_pressure` | medium | 9 |

### `payment`
| `transfer_request` | high | 14 |
| `deposit_request` | medium | 10 |
| `off_platform_payment` | high | 16 |
| `asks_for_credentials` | critical | 20 |
| `asks_for_otp` | critical | 22 |
| `cbu_shared` | medium | 7 |
| `alias_shared` | low | 5 |

### `identity`
| `authority_impersonation` | critical | 20 |
| `bank_impersonation` | critical | 20 |
| `support_impersonation` | high | 15 |
| `family_impersonation` | high | 15 |
| `inconsistent_identity` | medium | 10 |

### `authority`
| `threatens_arrest` | critical | 22 |
| `threatens_legal_action` | high | 15 |
| `bribery_request` | critical | 20 |

### `platform`
| `platform_bypass` | high | 16 |
| `suspicious_link` | high | 14 |
| `channel_shift` | medium | 10 |

### `external`
| `external_presence_inconsistent` | medium | 10 |
| `domain_recently_created` | high | 14 |
| `website_unreachable` | low | 5 |

### `trust_reducer`
| `unsolicited_contact` | medium | 8 |
| `price_too_good` | medium | 9 |

### `trust_builder` (weights negativos — hard rules dominan)
| `verified_identity_signal` | info | -8 |
| `payment_on_delivery_available` | info | -6 |
| `official_platform_interaction` | info | -8 |

**Calibración esperada:** `asks_for_otp` (22) + hard rule → piso `high`. `authority_impersonation` (20) + `bribery_request` (20) + `threatens_arrest` (22) = 62 + hard rule → `very_high`.

---

## 6. Biblioteca inicial de patrones (6 archivos YAML)

Ubicados bajo `patterns/<categoria>/<slug>.yaml`. Schema: `code, name, category, summary, core_signals, high_weight_signals, hard_rules, counter_signals, variant_examples, recommended_actions, minimum_risk_level`.

1. **`family_money/new_number_relative.yaml`** — Familiar con número nuevo pide plata. Core: `[identity_change, new_number_claim, transfer_request]`. High weight: `[urgent_transfer, emotional_pressure, family_impersonation]`. Counter: `[verified_identity_signal]`. Min: `high`.
2. **`online_purchase/marketplace_bypass.yaml`** — Vendedor desvía fuera de plataforma. Core: `[platform_bypass, off_platform_payment, channel_shift]`. Hard rule: `[platform_bypass, off_platform_payment] → floor high`. Counter: `[payment_on_delivery_available, official_platform_interaction]`. Min: `high`.
3. **`bank_support/otp_request.yaml`** — Supuesto banco pide código. Core: `[bank_impersonation, asks_for_otp]`. Hard rule: `[asks_for_otp] → floor high`. Min: `very_high`.
4. **`authority_impersonation/arrest_threat_bribery.yaml`** — Autoridad amenaza + cobra. Core: `[authority_impersonation, threatens_arrest, bribery_request]`. Hard rules: `[authority_impersonation, bribery_request] → floor very_high`; `[threatens_arrest, transfer_request] → floor very_high`. Min: `very_high`.
5. **`online_purchase/urgent_deposit_seller.yaml`** — Seña urgente para reservar. Core: `[deposit_request, urgency_language, price_too_good]`. Counter: `[verified_identity_signal, official_platform_interaction]`. Min: `medium`.
6. **`bank_support/account_unlock_link.yaml`** — Link para "desbloquear" cuenta. Core: `[bank_impersonation, suspicious_link, urgency_language]`. High weight: `[asks_for_credentials, asks_for_otp]`. Hard rule: `[asks_for_credentials] → floor high`. Min: `high`.

Cada YAML incluye además `variant_examples` (2–3 frases reales) y `recommended_actions` (3 bullets en es-AR, empezando con verbo imperativo: "No transfieras", "Llamá al banco…", "Cortá la comunicación").

---

## 7. Decisiones técnicas (ADRs propuestos)

### Resueltas (propongo registrar)

| # | Pregunta | Decisión |
|---|----------|----------|
| D1 | OCR | **tesseract.js** local. Migrar a Vision si `ocr_failed > 20%`. ADR 0001. |
| D2 | Gemini SDK | **fetch directo** + Zod. |
| D3 | Modelo Gemini | **`gemini-2.0-flash-001`** inicial; fallback a `pro` tras 2 fallos. ADR 0002. |
| D4 | Sync vs async | **Síncrono** con `maxDuration=60` (requiere Vercel Pro). Plan B: OCR como job previo en upload si > 45s. |
| D5 | Rate limit | **Tabla Postgres** `rate_limit_hits` + upsert. ADR 0003. |
| D6 | RLS sin auth | **Service role en endpoints**; policies muy restrictivas; gate efectivo = backend. |
| D7 | Testing | **Vitest** (unit+integration) + **Playwright** (1 e2e). |
| D8 | i18n | **Hardcoded es-AR**. Copy centralizado en `src/lib/copy/es-ar.ts`. |
| D9 | Prompts | **Archivos TS versionados**, `PROMPT_VERSION` const, persistido en `analysis_runs`. |
| D10 | Storage | **Bucket privado** + signed URLs 10min. |
| D11 | Lifecycle | Cron diario borra objetos > 72h. |
| D12 | privacy_mode | Columna `cases.privacy_mode`. `no_store_raw` skippea writes de raw (detalle en Fase 9). ADR 0005. |
| D13 | Uploads > 4.5MB | **Signed upload URLs cliente→Supabase Storage**. ADR 0004. |

### Abiertas — requieren input del usuario

| # | Pregunta | Opciones |
|---|----------|----------|
| **O1** | Supabase cloud vs self-hosted | Recomiendo cloud (Windows + single builder). |
| **O2** | Repreguntas (RF-09) en MVP o post | **Afecta API y estado `needs_context`.** Propuesta: MVP devuelve `suggested_followup_question` como texto informativo; ciclo de re-análisis post-MVP. |
| **O3** | Vercel Pro vs Hobby | Hobby maxDuration=10s — inviable para sync. **Pro es requisito práctico.** |
| **O4** | Turnstile anti-bot | Recomendado antes de Fase 9. Sin captcha, rate-limit-por-IP es insuficiente. |
| **O5** | Dashboards analytics | SQL views en MVP; Metabase/Grafana post-MVP. |
| **O6** | Sentry | Recomendado (free tier). |

### Vacíos técnicos adicionales

- **Concurrencia en `/analyze`:** usuario hace doble click. Mitigar con `pg_try_advisory_xact_lock(hashtext(case_id))` o idempotencia por `analysis_runs.status`.
- **`fingerprint` depende de consistencia del LLM** (`narrative_theme`, `actor`, `theme`, `urgency`). Mitigar con **enum cerrado en el prompt** para esas dimensiones.
- **UX mobile de uploads** — caso de uso más común (screenshots desde celular); merece spec específica pre-Fase 2.
- **UI de `privacy_mode`:** ¿visible al usuario? Propuesta: checkbox colapsado "Opciones avanzadas" con default `minimal_retention`.

---

## 8. Orden exacto de ejecución (80 pasos)

### Sprint 1 — Base + intake (Fases 0, 1, 2)
1. `package.json` + deps (Next 15, React 19, TS, Tailwind, Zod, Supabase JS, pino, nanoid, tesseract.js).
2. `tsconfig` strict, `.eslintrc`, `.prettierrc`.
3. Crear Supabase project cloud + `.env.local`.
4. `src/lib/config/env.ts` (Zod env validation).
5. `src/server/db/{client,anon-client}.ts`.
6. `src/lib/{logger,id,errors}.ts`.
7. `app/layout.tsx` + landing `app/page.tsx` es-AR.
8. GitHub Actions CI (lint + typecheck + vitest dry).
9. Migración `initial_schema.sql`: 8 enums + 14 tablas + índices.
10. `src/server/signals/catalog.ts` completo (sec. 5).
11. `scripts/gen-signal-seed.ts` + migración `signal_catalog_seed.sql`.
12. Aplicar migraciones a Supabase cloud.
13. `supabase gen types typescript` → `src/server/db/types.ts`.
14. Repositorios: `src/server/cases/repository.ts`, `evidence/`, etc.
15. Tests unit de repositorios (fixtures + cleanup).
16. UI `caso/nuevo/page.tsx` con Server Action → `POST /api/cases`.
17. `EvidenceDropzone` con signed upload URL directa a Storage.
18. Endpoints `POST /api/cases` y `POST /api/cases/:id/evidence`.
19. Zod validation en ambos.
20. Stub `caso/[publicId]/{page,resultado/page}.tsx`.
21. Smoke test manual: crear caso, subir screenshot, ver en DB.

### Sprint 2 — Pipeline + scoring (Fases 3, 4)
22. `preprocessing/normalize-text.ts` + tests.
23. `preprocessing/run-ocr.ts` con tesseract.js + fixture test.
24. `preprocessing/parse-basic-entities.ts` (regex alias/CBU/URL/phone).
25. `preprocessing/merge-evidence.ts`.
26. `extraction/prompts/extraction.v1.ts` con responseSchema y **enums cerrados para fingerprint dims**.
27. `extraction/schema.ts` (Zod LLM output).
28. `extraction/gemini-client.ts` (fetch + retry único).
29. `extraction/{run-extraction,normalize-entities}.ts`.
30. `signals/detectors/*` (regex OTP, urgencia, bypass, etc.).
31. `signals/{merge-signals,dedupe,hard-rules}.ts`.
32. `risk/{subscores,final-score,risk-band,confidence,apply-hard-rules}.ts`.
33. `explanations/*` básico es-AR.
34. `pipeline/run-analysis.ts` orquestador.
35. Endpoints `POST /analyze` + `GET /result`.
36. Componentes resultado: `RiskBadge`, `SignalList`, `RecommendationPanel`, `LimitsNotice`.
37. UI `caso/[publicId]/resultado/page.tsx`.
38. Fixtures "casos oro" (1 por patrón).
39. Tests integration end-to-end del pipeline.

### Sprint 3 — Patterns + candidate patterns (Fases 5, 6)
40. `patterns/_schema.json`.
41. `src/server/patterns/schema.ts` (Zod).
42. 6 YAMLs iniciales (sec. 6).
43. `patterns/{load-from-disk,sync-to-db}.ts`.
44. Endpoint `POST /api/internal/patterns/sync`.
45. `scripts/sync-patterns.ts`.
46. `patterns/{match-official,match-score}.ts`.
47. Integrar pattern match en `run-analysis.ts` (después signals, antes risk final).
48. Aplicar `pattern.minimum_risk_level` como floor.
49. Tests: casos oro matchean patrón esperado.
50. `candidate-patterns/fingerprint.ts` (sha256 determinista).
51. `candidate-patterns/upsert.ts` con gate "no-match oficial fuerte".
52. Integrar upsert en pipeline.
53. Endpoint `POST /api/internal/candidate-patterns/promote`.

### Sprint 4 — Enrichment + feedback + analytics (Fases 7, 8)
54. `enrichment/should-run.ts`.
55. Checkers prioritarios: `platform-bypass`, `domain`, `website-consistency`.
56. `enrichment/run-checks.ts` (`Promise.allSettled` + timeout 5s).
57. `enrichment/findings-to-signals.ts` con cap explícito.
58. Integrar enrichment después de pattern match.
59. Componente `ExternalFindings` en resultado.
60. `POST /api/cases/:id/feedback` + `FeedbackForm`.
61. `analytics/{track-event,events}.ts` cableado en cada fase.
62. Vistas SQL para métricas 19.1–19.4.
63. Sentry (si O6 = sí).
64. Checkers 4–5 (`public-business`, `social-profile`) si queda tiempo.

### Sprint 5 — Privacy + hardening + docs (Fases 9, 10)
65. `privacy/{redact,retention-policy}.ts`.
66. Columnas `expires_at` + backfill.
67. Edge Function `cleanup-expired` con cron.
68. `no_store_raw` mode: skips en writes.
69. `rate-limit/postgres-rate-limit.ts` + middleware.
70. Turnstile en `/caso/nuevo` (si O4 = sí).
71. Validación magic-byte en uploads.
72. Tests de seguridad: fuzzing en endpoints.
73. README técnico + README operaciones.
74. ADRs 0001–0005 en `docs/adr/`.
75. Playwright e2e happy-path.
76. Cobertura ≥ 70% `src/server/`.
77. `patterns/README.md`.
78. Guía promoción manual candidate patterns.
79. Verificar deploy Vercel production.
80. Runbook de incidentes.

---

## 9. Criterios de aceptación del MVP

El MVP está **done** cuando:
1. Usuario anónimo crea caso (`RF-01`) con narrativa y/o evidencia única (`RF-04`).
2. Pipeline produce `case_type`, entidades, ≥1 señal, banda de riesgo, recomendación, límites — en ≤ 60s.
3. Hard rules (`asks_for_otp → high`, `authority_impersonation + bribery_request → very_high`) verificables por test.
4. Al menos 1 caso oro por patrón matchea su patrón esperado.
5. Fingerprint estable (mismo caso → mismo hash) y distinto para variantes.
6. Ningún checker externo baja un caso crítico.
7. `no_store_raw` verificable: no hay `raw_text` ni `raw_llm_response` en DB tras análisis.
8. Rate limit bloquea 11ª request/hora desde la misma IP.
9. Cleanup cron borra screenshots > 72h.
10. Feedback persistido, métricas 19.1–19.4 consultables por SQL.

---

## Critical files to create

- [src/server/pipeline/run-analysis.ts](src/server/pipeline/run-analysis.ts) — orquestador central; define el contrato entre módulos del pipeline.
- [src/server/signals/catalog.ts](src/server/signals/catalog.ts) — source of truth del catálogo; manda sobre seeds y tipos.
- [supabase/migrations/20260421000001_initial_schema.sql](supabase/migrations/20260421000001_initial_schema.sql) — sin las 14 tablas no hay nada sobre qué construir.
- [src/server/extraction/prompts/extraction.v1.ts](src/server/extraction/prompts/extraction.v1.ts) — calidad del prompt determina calidad de todo downstream (signals, fingerprint, explanation).
- [src/server/risk/apply-hard-rules.ts](src/server/risk/apply-hard-rules.ts) — punto de cumplimiento de las reglas load-bearing del producto; si falla, se rompe la postura de seguridad.
- [src/server/candidate-patterns/fingerprint.ts](src/server/candidate-patterns/fingerprint.ts) — estabilidad del fingerprint = viabilidad del aprendizaje incremental.
- [patterns/_schema.json](patterns/_schema.json) + 6 YAMLs iniciales — biblioteca base del matching.

---

## Verification plan

Cómo testear que cada capa funciona end-to-end durante la implementación:

**Post-Sprint 1:**
- `npm run dev` levanta la landing.
- `curl -X POST /api/cases -d '{"narrative_text":"soy tu hijo..."}'` devuelve `public_id`.
- Inspección en Supabase Studio: fila en `cases` + fila en `case_evidence` si se subió.

**Post-Sprint 2:**
- `POST /analyze` sobre el caso anterior devuelve `status: 'analyzed'` en < 60s.
- `GET /result` devuelve payload con `risk.level`, ≥1 signal, recomendación.
- Vitest: fixtures de casos oro producen banda esperada.

**Post-Sprint 3:**
- `POST /api/internal/patterns/sync` carga los 6 YAMLs; verificar `patterns` y `pattern_versions` en DB.
- Caso "banco pide OTP" → `pattern_matches` incluye `bank_otp_request`; banda ≥ `high`.
- Correr el mismo caso dos veces con variaciones leves → mismo `fingerprint` en `candidate_patterns` (`occurrence_count = 2`).

**Post-Sprint 4:**
- Caso con URL de dominio creado hace < 7 días → `external_checks` con `domain_recently_created` signal.
- `POST /feedback` persiste fila; query a vista `funnel_daily` muestra el evento.

**Post-Sprint 5:**
- Playwright e2e: usuario completa flujo landing → intake → análisis → resultado → feedback.
- Manual: esperar 72h (o forzar `expires_at` en test) → `cleanup-expired` elimina objeto de bucket.
- Burst test: 11 POST /cases desde misma IP → 11ª devuelve 429.
- `no_store_raw` test: crear caso con ese modo → inspeccionar DB, `raw_text` y `raw_llm_response` en null.
- Build y deploy en Vercel staging, smoke test production-like.

**Preguntas abiertas que resolver antes de Sprint 1:**
- O2 (repreguntas en MVP?) — afecta API y `case_status`.
- O3 (Vercel Pro ok?) — sin esto el sync-analyze no es viable.
- O4 (Turnstile?) — antes de Fase 9.
- D12 confirmación (privacy_mode semántica) — afecta writes desde el día 1.
