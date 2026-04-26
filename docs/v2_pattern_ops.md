# Pattern Ops V2

Este proceso permite revisar patrones candidatos sin exponer texto crudo de casos.

## Revisar candidatos

```bash
npm run patterns:candidates
```

El reporte muestra:

- `id`
- `status`
- ocurrencias
- cantidad de casos vinculados
- `fingerprint`
- componentes estructurales de la firma

No muestra narrativa, OCR, capturas ni texto sensible.

## Promover un candidato

1. Crear o actualizar el pattern oficial en `patterns/`.
2. Ejecutar `npm run patterns:validate`.
3. Ejecutar `npm run patterns:sync`.
4. Llamar `POST /api/internal/candidate-patterns/promote` con `x-internal-secret`.

Payload:

```json
{
  "candidatePatternId": "uuid",
  "newPatternCode": "pattern_code"
}
```

## Descartar un candidato

Llamar `POST /api/internal/candidate-patterns/dismiss` con `x-internal-secret`.

Payload:

```json
{
  "candidatePatternId": "uuid"
}
```

Ambas acciones registran eventos en `analytics_events`.
