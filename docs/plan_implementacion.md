# Plan de implementación por módulos para Claude Code
## Producto: App web de evaluación y prevención de estafas digitales
## Versión: v0.1
## Estado: Plan ejecutable inicial

---

## 1. Objetivo del documento

Este documento organiza la implementación del sistema en módulos concretos, en un orden que minimiza dependencias cruzadas, reduce retrabajo y permite validar valor funcional de manera incremental.

El objetivo es que un agente como Claude Code pueda usar este plan como guía de ejecución técnica end-to-end.

El plan prioriza:

- construcción incremental,
- entregables verificables por módulo,
- bajo acoplamiento,
- criterios de aceptación claros,
- foco en el MVP real y no en extensiones futuras.

---

## 2. Principios de implementación

### 2.1 Construir primero el esqueleto funcional

Antes de sofisticar scoring, patterns o checks externos, debe existir un flujo end-to-end mínimo:

- crear caso,
- adjuntar evidencia,
- analizar,
- devolver resultado.

### 2.2 Priorizar estructura sobre refinamiento temprano

Claude Code debe construir primero:
- contratos,
- tipos,
- tablas,
- módulos,
- interfaces.

No conviene empezar por prompts o heurísticas finas sin estructura estable.

### 2.3 Evitar complejidad prematura

No introducir de entrada:
- auth,
- colas complejas,
- dashboards avanzados,
- scraping sofisticado,
- vector DB,
- infra asincrónica si no hace falta.

### 2.4 Cada módulo debe quedar usable y testeable

Cada etapa debe dejar un incremento funcional o una base clara para el siguiente módulo.

---

## 3. Secuencia general recomendada

### Fase 0 — Base del proyecto
### Fase 1 — Modelo de datos y persistencia
### Fase 2 — Flujo de intake y UI inicial
### Fase 3 — Pipeline de análisis básico
### Fase 4 — Señales y scoring
### Fase 5 — Pattern engine
### Fase 6 — Candidate patterns y aprendizaje incremental
### Fase 7 — Enrichment externo
### Fase 8 — Feedback, analytics y observabilidad
### Fase 9 — Privacidad, cleanup y endurecimiento
### Fase 10 — Pulido final y documentación operativa

---

## 4. Fase 0 — Base del proyecto

### Objetivo

Dejar listo el esqueleto del repositorio, el stack, las convenciones y la base operativa para el resto del desarrollo.

### Claude Code debe implementar

- bootstrap del proyecto Next.js + TypeScript + Tailwind
- configuración base de Supabase
- variables de entorno
- estructura de carpetas por dominio
- linters / formatters
- helpers base de servidor
- capa inicial de acceso a DB
- tipos comunes compartidos

### Estructura sugerida

```text
apps/web
  app/
  components/
  lib/
  server/
  types/
  config/
  styles/

supabase/
  migrations/
  seed/
  functions/

patterns/
  authority_impersonation/
  online_purchase/
  bank_support/
  family_money/
```

### Entregables

- proyecto corre localmente
- conexión a Supabase configurada
- variables `.env` documentadas
- estructura de carpetas creada
- convenciones de naming definidas

### Criterios de aceptación

- `npm run dev` levanta correctamente
- hay cliente server-side para Supabase
- hay utilidades base para logging, env y errores
- hay README técnico mínimo de arranque

---

## 5. Fase 1 — Modelo de datos y persistencia

### Objetivo

Implementar el esquema inicial de Supabase/Postgres y dejar lista la persistencia de todos los objetos centrales del dominio.

### Claude Code debe implementar

#### Migraciones SQL para:
- `cases`
- `case_evidence`
- `case_entities`
- `case_signals`
- `analysis_runs`
- `external_checks`
- `patterns`
- `pattern_versions`
- `pattern_matches`
- `candidate_patterns`
- `case_candidate_pattern_links`
- `feedback`
- `analytics_events`
- `signal_catalog`

#### Seeds iniciales para:
- `signal_catalog`
- patrones base si corresponde

#### Tipos TypeScript derivados del modelo

#### Repositorios / data access helpers
- createCase
- attachEvidence
- storeEntities
- storeSignals
- storeAnalysisRun
- storeFeedback
- trackEvent

### Entregables

- migraciones completas y ejecutables
- seed inicial
- tipos base del dominio
- capa de acceso a DB funcional

### Criterios de aceptación

- se puede crear un caso desde código
- se pueden asociar evidencias
- se pueden persistir entidades y señales
- tablas tienen claves y relaciones correctas
- no hay ambigüedades de naming

---

## 6. Fase 2 — Intake y UI inicial

### Objetivo

Construir la primera experiencia funcional para que un usuario pueda iniciar un caso y aportar evidencia sin autenticación.

### Claude Code debe implementar

### Pantallas
- landing
- formulario de creación de caso
- carga de evidencia
- pantalla de análisis en progreso
- pantalla base de resultado

### Componentes
- textarea de narrativa libre
- uploader de screenshots
- inputs opcionales para URL / username / alias
- botón de iniciar análisis
- validaciones de tamaño y formato

### Lógica cliente
- manejo de estado local del caso
- submit del caso
- upload de evidencia
- navegación hacia resultado

### Endpoints
- `POST /api/cases`
- `POST /api/cases/:id/evidence`

### Entregables

- flujo visual básico usable
- creación real de caso en DB
- evidencia guardada o referenciada

### Criterios de aceptación

- un usuario puede iniciar caso sin login
- puede escribir narrativa y agregar evidencia opcional
- el sistema persiste el caso y devuelve identificador
- el usuario ve estado de proceso sin romper la UX

---

## 7. Fase 3 — Pipeline de análisis básico

### Objetivo

Construir el pipeline mínimo end-to-end que toma un caso, lo consolida, lo manda al modelo y devuelve un resultado estructurado.

### Claude Code debe implementar

### Módulo `preprocessing`
- merge de narrativa y texto adjunto
- OCR para screenshots si aplica
- limpieza y normalización de texto
- parseo básico de links, alias y teléfonos

### Módulo `llm-extraction`
- prompt estructurado para Gemini
- validación del JSON de salida
- manejo de errores y reintentos mínimos
- persistencia en `analysis_runs`

### Módulo `entity-extraction`
- normalización de entidades
- deduplicación
- persistencia en `case_entities`

### Endpoint
- `POST /api/cases/:id/analyze`
- `GET /api/cases/:id/result`

### Entregables

- caso consolidado listo para analizar
- JSON estructurado retornado por Gemini
- entidades persistidas
- resumen inicial disponible en resultado

### Criterios de aceptación

- un caso puede analizarse de punta a punta
- el sistema clasifica un tipo de caso probable
- el sistema extrae entidades básicas
- el resultado puede consultarse desde frontend

---

## 8. Fase 4 — Señales y scoring

### Objetivo

Agregar la lógica real de riesgo basada en señales, catálogo y reglas determinísticas.

### Claude Code debe implementar

### Módulo `signals`
- detección por regex / parsing
- mapping a `signal_catalog`
- señales provenientes del LLM
- deduplicación de señales
- priorización por severidad

### Módulo `risk`
- computeInteractionScore
- computePaymentScore
- computeIdentityScore
- computePlatformScore
- computeExternalValidationScore
- computeFinalScore
- deriveRiskLevel
- applyHardRules
- computeConfidence

### Persistencia
- guardar señales en `case_signals`
- guardar scoring en `analysis_runs` y `cases`

### Resultado de usuario
- listar señales detectadas
- mostrar banda de riesgo
- mostrar resumen y recomendación inicial

### Entregables

- scoring explicable funcionando
- risk bands visibles
- hard rules activas

### Criterios de aceptación

- el sistema produce score consistente
- los hard rules se aplican correctamente
- el resultado final incluye señales y recomendación
- el score no depende exclusivamente del LLM

---

## 9. Fase 5 — Pattern engine

### Objetivo

Incorporar la Fraud Pattern Library oficial y el matching de casos contra patrones conocidos.

### Claude Code debe implementar

### Carpeta `patterns/`
- archivos JSON/YAML por patrón
- loader de patterns desde disco
- validación de schema de pattern

### Tabla / sync
- sync desde repo a `patterns` y `pattern_versions`
- script o endpoint interno de sincronización

### Módulo `pattern-engine`
- matchOfficialPatterns
- matchBySignals
- matchByCaseType
- assignMatchScore
- persistPatternMatches

### Resultado de usuario
- opcionalmente exponer nombre amigable del patrón cuando tenga valor explicativo

### Entregables

- patterns iniciales cargados
- matches persistidos
- integración del pattern engine al pipeline

### Criterios de aceptación

- un caso conocido puede matchear con un patrón oficial
- se guarda `pattern_match`
- el match influye en la explicación y/o score donde corresponda

---

## 10. Fase 6 — Candidate patterns y aprendizaje incremental

### Objetivo

Permitir que el sistema detecte variantes emergentes sin ML complejo ni revisión manual constante sobre raw data.

### Claude Code debe implementar

### Módulo `candidate-patterns`
- buildCaseFingerprint
- normalizeStructuralSignature
- hashFingerprint
- upsertCandidatePattern
- linkCaseToCandidatePattern

### Reglas
- crear candidate pattern si no hay patrón oficial fuerte
- incrementar `occurrence_count` si reaparece
- mantener `first_seen_at` y `last_seen_at`

### Persistencia
- `candidate_patterns`
- `case_candidate_pattern_links`

### Utilidad interna
- endpoint o script de revisión
- endpoint de promoción manual a patrón oficial

### Entregables

- fingerprints estructurados
- candidate patterns persistidos
- promoción manual soportada

### Criterios de aceptación

- dos casos estructuralmente similares actualizan el mismo candidate pattern
- los candidate patterns no guardan raw data innecesaria
- existe camino de promoción a patrón oficial

---

## 11. Fase 7 — Enrichment externo

### Objetivo

Agregar checks externos acotados que mejoren la evaluación sin volver el sistema frágil ni caro.

### Claude Code debe implementar

### Módulo `enrichment`
- shouldRunExternalChecks
- runExternalChecks
- mapFindingsToSignals

### Checkers iniciales
- platform bypass checker
- domain checker
- website consistency checker
- public business presence checker
- lightweight social profile checker

### Persistencia
- `external_checks`
- señales derivadas en `case_signals`

### Integración
- impacto en `externalValidationScore`
- impacto en explicación final

### Entregables

- al menos 2-3 checkers funcionales
- external checks visibles en resultado
- integración al scoring

### Criterios de aceptación

- los checks se ejecutan condicionalmente
- un fallo externo no rompe el análisis completo
- la conclusión no depende de un solo checker

---

## 12. Fase 8 — Feedback, analytics y observabilidad

### Objetivo

Agregar capacidad de medición, mejora continua y visibilidad del comportamiento del sistema.

### Claude Code debe implementar

### Feedback
- `POST /api/cases/:id/feedback`
- componente UI de feedback simple
- persistencia en `feedback`

### Analytics
- trackEvent helper
- emisión de eventos clave
- persistencia en `analytics_events`

### Dashboards / vistas
- métricas de funnel
- métricas de distribución de casos
- top señales
- top patrones
- helpful rate

### Observabilidad técnica
- logs estructurados por análisis
- latencia de pipeline
- errores por etapa

### Entregables

- feedback funcional
- analytics persistidas
- queries o vistas básicas para análisis

### Criterios de aceptación

- se registran eventos de producto clave
- se puede medir funnel de uso
- se puede medir feedback de utilidad
- se puede identificar qué patrones aparecen más

---

## 13. Fase 9 — Privacidad, cleanup y endurecimiento

### Objetivo

Reducir exposición de datos sensibles y endurecer el sistema para uso real.

### Claude Code debe implementar

### Módulo `privacy`
- redactSensitiveData
- applyRetentionPolicy
- sanitizeCaseForCandidatePattern

### Cleanup
- job o función de limpieza de casos expirados
- limpieza de screenshots temporales
- truncado o borrado de raw text si corresponde

### Seguridad técnica
- validación estricta de uploads
- rate limiting
- manejo de errores seguro
- bloqueo de acceso directo a tablas sensibles

### Entregables

- políticas de expiración funcionales
- sanitización activa
- rate limit básico
- raw data minimizada

### Criterios de aceptación

- los casos con expiración vencida se limpian
- candidate patterns no contienen información sensible cruda
- el sistema resiste inputs inválidos o abuso básico

---

## 14. Fase 10 — Pulido final y documentación operativa

### Objetivo

Dejar el sistema listo para mantenimiento, iteración y uso por terceros/agentes.

### Claude Code debe implementar

### Documentación técnica
- README de arquitectura
- README de desarrollo local
- guía de variables de entorno
- guía de migraciones
- guía de sync de patterns
- guía de despliegue

### Documentación funcional
- mapa de flujo del usuario
- explicación de risk levels
- explicación de límites del producto

### Calidad
- tests unitarios clave
- tests de integración en módulos críticos
- ejemplos de payloads reales anonimizados

### Entregables

- repositorio documentado
- setup reproducible
- módulos críticos cubiertos mínimamente por tests

### Criterios de aceptación

- otro desarrollador o agente puede correr el proyecto
- la arquitectura está explicada
- las decisiones principales están documentadas

---

## 15. Orden exacto de implementación recomendado para Claude Code

### Sprint 1
- Fase 0 completa
- Fase 1 completa
- Fase 2 base

### Sprint 2
- Fase 3 completa
- Fase 4 completa

### Sprint 3
- Fase 5 completa
- Fase 6 base

### Sprint 4
- Fase 7 completa
- Fase 8 base

### Sprint 5
- Fase 9 completa
- Fase 10 completa

---

## 16. Dependencias entre módulos

### `case-intake`
Depende de:
- DB base
- tipos base

### `preprocessing`
Depende de:
- intake
- evidencia persistida

### `llm-extraction`
Depende de:
- preprocessing
- prompt versioning

### `signals`
Depende de:
- extraction
- signal_catalog

### `risk`
Depende de:
- signals
- hard rules

### `pattern-engine`
Depende de:
- signals
- risk
- patterns sync

### `candidate-patterns`
Depende de:
- extraction
- signals
- pattern-engine

### `enrichment`
Depende de:
- entities
- case_type

### `feedback` y `analytics`
Dependen de:
- case lifecycle

### `privacy`
Depende de:
- persistencia
- cleanup

---

## 17. Lista de módulos que Claude Code debe crear explícitamente

### Backend/domain modules
- `server/cases`
- `server/evidence`
- `server/preprocessing`
- `server/extraction`
- `server/entities`
- `server/signals`
- `server/risk`
- `server/patterns`
- `server/candidate-patterns`
- `server/enrichment`
- `server/explanations`
- `server/analytics`
- `server/privacy`
- `server/storage`
- `server/db`

### Frontend/ui modules
- `components/case-intake`
- `components/evidence-upload`
- `components/analysis-progress`
- `components/result-summary`
- `components/risk-display`
- `components/signal-list`
- `components/external-findings`
- `components/recommendation-panel`
- `components/feedback-form`

### Shared modules
- `types/cases`
- `types/entities`
- `types/signals`
- `types/patterns`
- `types/analysis`
- `types/api`
- `lib/validation`
- `lib/config`
- `lib/utils`

---

## 18. Tests mínimos sugeridos por módulo

### DB / repositories
- createCase
- attachEvidence
- storeSignals
- upsertCandidatePattern

### Extraction
- parse de salida JSON del LLM
- normalización de entidades
- manejo de respuesta inválida

### Signals
- detección de señales por regex
- deduplicación
- hard rules

### Risk
- cálculo de subscores
- bandas de riesgo
- mínimos por hard rules

### Patterns
- match correcto con pattern oficial
- fingerprint estable
- promoción de candidate pattern

### Enrichment
- activación condicional
- manejo de fallo externo
- mapeo de hallazgos a señales

---

## 19. Definición de done por fase

### Done general
Una fase está completa si:
- el código existe,
- está integrado,
- corre localmente,
- persiste lo necesario,
- tiene criterios mínimos de verificación,
- y deja una base sólida para la siguiente fase.

### Done del MVP funcional
El MVP puede considerarse operativo cuando:
- un usuario crea un caso,
- sube evidencia,
- el sistema analiza,
- detecta señales,
- calcula riesgo,
- matchea patrones si aplica,
- da una recomendación,
- guarda analytics y feedback,
- y respeta limpieza mínima de datos.

---

## 20. Instrucción operativa para Claude Code

Claude Code debe implementar este plan respetando estas prioridades:

1. Primero estructura, contratos y persistencia.
2. Luego flujo end-to-end mínimo.
3. Luego scoring y explicabilidad.
4. Luego memoria de patrones.
5. Luego checks externos y analytics.
6. Finalmente endurecimiento, privacidad y documentación.

Debe evitar introducir features fuera de alcance del MVP salvo que sean estrictamente necesarias para cerrar dependencias críticas.

---

## 21. Artefactos que deben generarse a continuación

Luego de este plan conviene derivar:

1. SQL schema final con migraciones completas,
2. contratos API detallados endpoint por endpoint,
3. tipos TypeScript,
4. catálogo inicial de señales,
5. biblioteca inicial de patrones,
6. prompt maestro para Claude Code que le indique implementar este plan por fases.

