## 1. Principios de arquitectura técnica

### 1.1 Stateless en la experiencia, con persistencia mínima operativa

La aplicación debe sentirse como una herramienta puntual y sin cuenta, aunque internamente persista estructura suficiente para trazabilidad, aprendizaje de patrones y analíticas.

### 1.2 LLM como extractor, no como autoridad de decisión

Gemini debe utilizarse para:
- resumir,
- extraer entidades,
- sugerir señales,
- clasificar el tipo de caso,
- ayudar a construir una explicación.

No debe ser la fuente única del score final ni de la decisión crítica.

### 1.3 Reglas como columna vertebral

Las decisiones de riesgo deben apoyarse en:
- catálogo de señales,
- pesos controlados,
- hard rules,
- matching de patrones,
- contexto externo cuando exista.

### 1.4 Privacy-first

Se debe minimizar el almacenamiento de raw data sensible. La persistencia debe priorizar estructura anonimizada por encima de texto bruto y archivos.

### 1.5 Diseño modular

La arquitectura debe permitir reemplazar o mejorar módulos sin reescribir todo el sistema.

---

## 2. Arquitectura lógica del sistema

La arquitectura se divide en ocho módulos principales.

### 2.1 Módulo de intake

Responsable de:
- crear casos,
- recibir narrativa,
- registrar evidencias,
- validar formatos,
- iniciar el pipeline.

### 2.2 Módulo de preprocessing

Responsable de:
- OCR de screenshots,
- limpieza de texto,
- normalización de inputs,
- consolidación de narrativa + adjuntos.

### 2.3 Módulo de extraction

Responsable de:
- extraer entidades,
- clasificar caso,
- detectar señales semánticas,
- producir un JSON estructurado a partir del LLM.

### 2.4 Módulo de signal engine

Responsable de:
- detectar señales por reglas,
- mapear señales a catálogo,
- calcular pesos base,
- aplicar hard rules.

### 2.5 Módulo de enrichment

Responsable de:
- ejecutar checks externos condicionales,
- investigar plataformas, dominios y presencia pública,
- convertir hallazgos en señales estructuradas.

### 2.6 Módulo de pattern engine

Responsable de:
- cargar la Fraud Pattern Library,
- comparar casos con patrones oficiales,
- generar fingerprints estructurados,
- crear o actualizar candidate patterns.

### 2.7 Módulo de risk engine

Responsable de:
- calcular subscores,
- calcular score final,
- asignar banda de riesgo,
- definir nivel de confianza.

### 2.8 Módulo de explanation engine

Responsable de:
- construir resumen del caso,
- traducir señales a lenguaje entendible,
- listar incertidumbres,
- generar recomendaciones accionables.

---

## 3. Diagrama lógico textual

### Flujo de alto nivel

1. El usuario crea un caso.
2. El sistema guarda narrativa y evidencias.
3. El sistema preprocesa texto e imágenes.
4. El sistema envía el caso consolidado a Gemini para extracción estructurada.
5. El sistema corre reglas locales y catálogo de señales.
6. El sistema decide si ejecutar checks externos.
7. El sistema corre scoring y matching con patrones.
8. El sistema genera una decisión final.
9. El sistema persiste resultados estructurados.
10. El frontend consulta y renderiza el resultado.
11. El usuario puede enviar feedback.

---

## 4. Modelo de datos técnico

### 4.1 Entidad `Case`

Representa una consulta completa del usuario.

Responsabilidades:
- identificar el caso,
- guardar el input principal,
- registrar el estado del pipeline,
- contener score y resultado final.

### 4.2 Entidad `CaseEvidence`

Representa cada unidad de evidencia adjunta al caso.

Tipos esperados:
- narrative,
- pasted_chat,
- screenshot,
- url,
- username,
- alias,
- phone,
- note.

### 4.3 Entidad `CaseEntity`

Representa entidades extraídas del caso.

Tipos esperados:
- platform,
- business_name,
- instagram_handle,
- url,
- domain,
- alias,
- cbu,
- phone,
- authority,
- bank,
- product,
- payment_method,
- marketplace.

### 4.4 Entidad `CaseSignal`

Representa señales de riesgo o señales atenuantes detectadas por el sistema.

### 4.5 Entidad `ExternalCheck`

Representa una investigación externa realizada a partir del caso.

### 4.6 Entidad `AnalysisRun`

Permite trazabilidad de una corrida específica del pipeline.

### 4.7 Entidad `Pattern`

Representa un patrón oficial de fraude.

### 4.8 Entidad `PatternVersion`

Versiona el esquema y contenido de un patrón.

### 4.9 Entidad `PatternMatch`

Relaciona un caso con un patrón oficial.

### 4.10 Entidad `CandidatePattern`

Representa una posible variante emergente aún no promovida a patrón oficial.

### 4.11 Entidad `Feedback`

Captura la percepción del usuario luego del análisis.

### 4.12 Entidad `AnalyticsEvent`

Registra eventos del uso del producto.

---

## 5. Esquema funcional del pipeline de análisis

### 5.1 Fase 1 — Creación del caso

Input esperado:
- narrativa libre,
- evidencias opcionales,
- metadata mínima.

Proceso:
- validar tamaños y formatos,
- crear `cases`,
- crear `case_evidence`,
- devolver `case_id` y `public_id`.

### 5.2 Fase 2 — Preprocesamiento

Proceso:
- OCR si hay screenshots,
- normalización de texto,
- limpieza de whitespace y caracteres anómalos,
- parsing de links,
- parsing de alias o teléfonos si aparecen,
- consolidación del texto principal.

Output esperado:
- `merged_case_text`,
- lista inicial de entidades detectadas por parsing,
- evidencias preprocesadas.

### 5.3 Fase 3 — Extracción semántica

El sistema debe llamar a Gemini con un prompt controlado y salida JSON estricta.

El output debe incluir:
- tipo probable de caso,
- resumen breve,
- requested_action,
- narrative_theme,
- entidades detectadas,
- señales semánticas,
- incertidumbres,
- patrón probable si aplica,
- sugerencia de repregunta opcional.

### 5.4 Fase 4 — Motor de reglas

El sistema debe:
- detectar señales por regex,
- mapear `signal_code` a `signal_catalog`,
- sumar pesos,
- ejecutar hard rules,
- deduplicar señales equivalentes.

### 5.5 Fase 5 — Enriquecimiento externo

El sistema debe decidir si conviene correr checks externos según:
- caso detectado,
- entidades presentes,
- costo esperado,
- beneficio potencial.

No se deben correr checks externos indiscriminadamente.

### 5.6 Fase 6 — Pattern matching

El sistema debe:
- comparar el caso con patrones oficiales,
- asignar `match_score`,
- generar `fingerprint` estructural,
- hacer upsert en `candidate_patterns`.

### 5.7 Fase 7 — Scoring final

El sistema debe calcular:
- subscores,
- score total,
- banda de riesgo,
- nivel de confianza,
- explicación interna.

### 5.8 Fase 8 — Resultado final

El sistema debe construir:
- `final_summary`,
- `risk_level`,
- `risk_score`,
- `recommendations`,
- `uncertainties`,
- `pattern_matches`.

---

## 6. Diseño del JSON de extracción LLM

La salida del LLM debe cumplir un schema estricto. La estructura mínima recomendada es:

```json
{
  "case_type": "online_purchase",
  "summary": "El usuario fue desviado de una plataforma a un canal externo y le piden transferencia.",
  "requested_action": "transfer_money",
  "narrative_theme": "marketplace_bypass",
  "entities": [
    { "type": "marketplace", "value": "Mercado Libre" },
    { "type": "instagram_handle", "value": "@mueblesxyz" },
    { "type": "alias", "value": "MUEBLES.XYZ" }
  ],
  "signals": [
    { "code": "platform_bypass", "confidence": 0.95 },
    { "code": "transfer_request", "confidence": 0.96 }
  ],
  "uncertainties": [
    "No hay validación independiente del vendedor"
  ],
  "suggested_followup_question": "¿Te pidió pagar por fuera de la plataforma?"
}
```

### Reglas del schema

- No debe inventar entidades no observadas.
- Debe distinguir hechos visibles de inferencias.
- Debe devolver códigos controlados, no texto libre para señales.
- Debe evitar afirmaciones absolutas.

---

## 7. Catálogo técnico de señales

El sistema debe tener un catálogo canónico de señales con:

- `code`
- `group_name`
- `description`
- `default_weight`
- `severity`
- `is_active`

### Grupos de señales sugeridos

- interaction
- urgency
- payment
- identity
- authority
- platform
- external
- trust_reducer
- trust_builder

### Ejemplos de `signal_code`

- urgent_transfer
- transfer_request
- asks_for_otp
- new_number_claim
- identity_change
- emotional_pressure
- authority_impersonation
- bribery_request
- threatens_arrest
- platform_bypass
- off_platform_payment
- suspicious_link
- external_presence_inconsistent
- verified_identity_signal
- payment_on_delivery_available

---

## 8. Motor de scoring técnico

### 8.1 Subscores recomendados

#### `interaction_score`
Evalúa:
- urgencia,
- presión,
- manipulación,
- secreto,
- lenguaje coercitivo.

#### `payment_score`
Evalúa:
- transferencia,
- seña,
- alias,
- coima,
- pedido de código,
- pedido de credenciales.

#### `identity_score`
Evalúa:
- número nuevo,
- suplantación,
- autoridad declarada,
- identidad dudosa,
- negocio inconsistente.

#### `platform_score`
Evalúa:
- desvío fuera de plataforma,
- intento de cerrar por canal externo,
- bypass de protecciones.

#### `external_validation_score`
Evalúa:
- presencia pública razonable,
- inconsistencias en sitio/perfil,
- ausencia de validación independiente.

### 8.2 Fórmula inicial sugerida

```ts
finalScore = clamp(
  interactionScore +
  paymentScore +
  identityScore +
  platformScore +
  externalValidationScore,
  0,
  100
)
```

### 8.3 Bandas de riesgo

- 0–24 → low
- 25–49 → medium
- 50–74 → high
- 75–100 → very_high

### 8.4 Hard rules sugeridas

Ejemplos:
- `asks_for_otp` → riesgo mínimo `high`
- `authority_impersonation` + `bribery_request` → riesgo mínimo `very_high`
- `platform_bypass` + `off_platform_payment` → riesgo mínimo `high`
- `threatens_arrest` + `transfer_request` → riesgo mínimo `very_high`

---

## 9. Pattern engine técnico

### 9.1 Fraud Pattern Library

La biblioteca de patrones debe existir en dos niveles:

1. fuente de verdad versionada en archivos JSON/YAML del repo,
2. copia sincronizada en base de datos para consulta runtime.

### 9.2 Estructura de patrón

Cada patrón debe incluir:
- `code`
- `name`
- `category`
- `summary`
- `core_signals`
- `high_weight_signals`
- `hard_rules`
- `counter_signals`
- `variant_examples`
- `recommended_actions`
- `minimum_risk_level`

### 9.3 Matching con patrones oficiales

El pattern engine debe considerar:
- cobertura de señales núcleo,
- presencia de señales de alto peso,
- coincidencia del tipo de caso,
- coincidencia temática,
- presencia o ausencia de contra-señales.

### 9.4 Candidate patterns

Para variantes nuevas, el sistema debe generar una firma estructural reducida a partir del caso.

Ejemplo de signature:

```json
{
  "actor": "authority",
  "threat": "arrest_or_search",
  "requested_action": "transfer_money",
  "payment_reason": "avoid_consequences",
  "theme": "minor_or_sexual_case",
  "urgency": "high"
}
```

La signature debe serializarse y hashearse para formar el `fingerprint`.

### 9.5 Upsert de candidate pattern

Si el `fingerprint` ya existe:
- incrementar `occurrence_count`,
- actualizar `last_seen_at`.

Si no existe:
- crear nuevo `candidate_pattern`.

---

## 10. Enrichment engine técnico

### 10.1 Objetivo

Mejorar la calidad del análisis investigando contexto público o semiestructurado más allá del mensaje aportado por el usuario.

### 10.2 Reglas de activación

El engine no debe correr siempre. Debe activarse solo si:
- hay entidades suficientes,
- el tipo de caso lo amerita,
- el check aporta señal discriminativa,
- el costo es razonable.

### 10.3 Checkers iniciales sugeridos

- platform origin / platform bypass checker
- domain checker
- website consistency checker
- public business presence checker
- lightweight social profile checker

### 10.4 Salida esperada de cada checker

Cada check debe devolver:
- `check_type`
- `status`
- `result_summary`
- `result_json`
- `signal_impact`

### 10.5 Regla de prudencia

Ningún checker externo debe poder bajar por sí solo un caso de riesgo crítico a riesgo bajo.

---

## 11. Explanation engine técnico

### 11.1 Objetivo

Transformar salida técnica interna en una respuesta entendible para el usuario final.

### 11.2 Componentes de salida

- `user_summary`
- `risk_label`
- `top_signals`
- `external_findings`
- `uncertainties`
- `recommended_actions`
- `limits_notice`

### 11.3 Reglas de redacción

La salida no debe:
- afirmar certeza absoluta,
- usar tono alarmista excesivo,
- usar jerga técnica innecesaria,
- exponer lógica interna compleja.

La salida sí debe:
- justificar por qué alerta,
- sugerir una próxima acción clara,
- indicar qué no pudo verificarse.

---

## 12. API lógica propuesta

### 12.1 `POST /api/cases`

Crea un caso nuevo.

Input:
- narrative_text
- privacy_mode
- evidence metadata opcional

Output:
- case_id
- public_id
- status

### 12.2 `POST /api/cases/:caseId/evidence`

Adjunta evidencia adicional a un caso existente.

### 12.3 `POST /api/cases/:caseId/analyze`

Dispara el pipeline de análisis.

### 12.4 `GET /api/cases/:caseId/result`

Devuelve el resultado final del análisis.

### 12.5 `POST /api/cases/:caseId/feedback`

Guarda feedback funcional del usuario.

### 12.6 `POST /api/internal/patterns/sync`

Sincroniza la library del repo a la base.

### 12.7 `POST /api/internal/candidate-patterns/promote`

Promueve un candidate pattern a patrón oficial.

---

## 13. Módulos de código sugeridos

### 13.1 `case-intake`
- createCase
- attachEvidence
- validateEvidence

### 13.2 `preprocessing`
- runOCR
- normalizeText
- mergeEvidenceText
- parseBasicEntities

### 13.3 `entity-extraction`
- runGeminiExtraction
- normalizeEntities
- persistEntities

### 13.4 `signals`
- detectRuleSignals
- mapSignalsToCatalog
- applyHardRules
- dedupeSignals

### 13.5 `enrichment`
- shouldRunExternalChecks
- runExternalChecks
- mapExternalFindingsToSignals

### 13.6 `patterns`
- loadPatterns
- matchOfficialPatterns
- buildCaseFingerprint
- upsertCandidatePattern
- promoteCandidatePattern

### 13.7 `risk`
- computeSubscores
- computeFinalScore
- deriveRiskLevel
- computeConfidence

### 13.8 `explanations`
- buildFinalDecision
- buildRecommendations
- buildLimitsNotice

### 13.9 `analytics`
- trackEvent
- storeFeedback
- aggregateMetrics

### 13.10 `privacy`
- redactSensitiveData
- enforceRetentionPolicy
- cleanupExpiredCases

---

## 14. Modelo de ejecución recomendado

### 14.1 MVP síncrono controlado

Para la primera versión, el análisis puede ejecutarse en una request orquestada si el tiempo total es razonable.

### 14.2 Evolución posible

Si luego el pipeline se vuelve más pesado, se puede pasar a:
- job async,
- polling de resultado,
- o estado `processing` con reintento.

### 14.3 Recomendación actual

Empezar simple:
- create case,
- upload evidence,
- analyze,
- fetch result.

---

## 15. Seguridad técnica

### 15.1 API keys

Las claves de Gemini, Supabase service role y checkers externos deben existir solo del lado servidor.

### 15.2 Acceso a base

El frontend no debe escribir directamente en tablas sensibles.

### 15.3 RLS

Se recomienda habilitar RLS y mantener políticas restrictivas.

### 15.4 Rate limiting

Debe existir limitación por IP o session para evitar abuso del servicio.

### 15.5 Validación de archivos

Se debe limitar:
- tamaño máximo,
- cantidad de archivos,
- mime types permitidos,
- payload total.

---

## 16. Privacidad y retención

### 16.1 Modos de privacidad

Se recomienda soportar al menos:
- `minimal_retention`
- `no_store_raw`

### 16.2 Estrategia de persistencia mínima

Persistir preferentemente:
- entidades,
- señales,
- score,
- matches,
- fingerprints,
- eventos analíticos agregados.

Persistir solo temporalmente:
- screenshots,
- OCR raw,
- textos sensibles completos si no son necesarios luego.

### 16.3 Cleanup

Debe existir una tarea periódica para:
- borrar archivos expirados,
- archivar o truncar raw data,
- conservar solo estructura necesaria.

---

## 17. Observabilidad y analítica técnica

### 17.1 Events de producto

Se deben emitir eventos como:
- case_started
- evidence_uploaded
- analysis_started
- analysis_completed
- analysis_failed
- feedback_submitted

### 17.2 Métricas técnicas

Se deben medir:
- latency por etapa,
- tasa de error,
- uso de OCR,
- uso de checks externos,
- distribución de risk levels,
- top signal codes,
- top pattern codes,
- cantidad de candidate patterns creados.

### 17.3 Dashboards sugeridos

- funnel de uso
- distribución por tipo de caso
- patrones más frecuentes
- helpful rate
- false alarm perceived rate
- ratio official pattern vs candidate pattern

---

## 18. Decisiones técnicas explícitas

### 18.1 No usar embeddings como núcleo inicial

El aprendizaje incremental se basará primero en patterns + fingerprints estructurados.

### 18.2 No usar scraping masivo

Los checks externos deben ser acotados y oportunistas.

### 18.3 No depender de un único checker externo

La conclusión debe poder sostenerse aunque falle una fuente externa.

### 18.4 No guardar datos sensibles sin necesidad

La estructura debe sobrevivir mejor que el raw input.

### 18.5 No permitir que un hallazgo positivo aislado neutralice una red flag crítica

Ejemplo: un perfil social “lindo” no debe compensar por sí solo un bypass de plataforma + transferencia externa.

---

## 19. Roadmap técnico de implementación

### Fase 1 — Núcleo funcional

Implementar:
- tablas principales,
- create case,
- upload evidence,
- analyze case,
- scoring básico,
- result rendering,
- feedback.

### Fase 2 — Pattern engine

Implementar:
- patterns,
- pattern_versions,
- pattern matching,
- sync desde archivos.

### Fase 3 — Candidate patterns

Implementar:
- fingerprint builder,
- upsert candidate patterns,
- promoción manual.

### Fase 4 — Enrichment externo

Implementar:
- checkers externos prioritarios,
- mapper a señales,
- integración al scoring.

### Fase 5 — Cleanup, observabilidad y refino

Implementar:
- tareas de expiración,
- dashboards,
- métricas técnicas,
- mejora de prompts y reglas.

---