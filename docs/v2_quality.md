# Estafometro V2 Quality

V2 prioriza ayuda concreta al usuario final sin cambiar los invariantes del MVP:

- sin login,
- sin veredictos absolutos,
- LLM solo como extractor,
- scoring deterministico,
- privacidad primero.

## Que cambio

- Resultado con `actionPlan`: accion principal, pasos, cosas a evitar, verificacion y escalamiento.
- Feedback enriquecido con outcome, accion tomada, claridad y tags.
- Repreguntas minimas con reanalisis forzado.
- Suite `npm run test:quality` con casos sinteticos de regresion.
- Operacion interna de candidate patterns con listado, promocion y descarte.
- Motor de riesgo calibrado por factores: dinero, credenciales, suplantacion, amenaza de autoridad, bypass de proceso, presion temporal, links, riesgo asimetrico y atenuantes positivos.
- Normalizacion deterministica post-extraccion para que el LLM no pueda omitir senales criticas detectadas por reglas.
- `risk_trace` en `analysis_runs.subscores` con senales finales, factores, hard rules, reglas de calibracion, mitigaciones y razon corta del nivel final.

## Como iterar el motor

1. Agregar un escenario sintetico en `scripts/quality-fixtures.ts` con riesgo esperado, rangos aceptables, senales requeridas/prohibidas y notas.
2. Correr `npm run test:quality` antes de cambiar scoring.
3. Ajustar regex, factores o reglas de calibracion hasta eliminar falsos negativos y falsos positivos relevantes.
4. Agregar un unit test si el cambio introduce una variante nueva de lenguaje o una combinacion de factores.

## Verificacion

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run patterns:validate
npm run test:quality
```

La suite de calidad falla si un caso critico baja de su piso de riesgo, si faltan senales esperadas o si el plan de accion usa afirmaciones de certeza como "es seguro", "garantizado" o "definitivamente".

## Medicion

```bash
npm run analytics:v2
```

El reporte usa las views `funnel_daily`, `feedback_quality` y `risk_distribution` para revisar si V2 esta generando mas feedback util, pausas/verificaciones y resultados compartidos.

Tambien esta disponible `GET /api/internal/analytics/v2` con `x-internal-secret` para consumir el mismo resumen desde una herramienta interna.
