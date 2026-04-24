# Estafómetro 🎯

Una herramienta gratuita y sin login que te ayuda a evaluar si una interacción digital (mensaje de WhatsApp, publicación de marketplace, llamada de "soporte bancario", etc.) es probablemente una estafa.

![Estafómetro Logo](./public/logo.svg)

## ¿Qué es Estafómetro?

Estafómetro no te dice "es seguro" ni "definitivamente es fraude". En cambio, te proporciona:

- **Evaluación de riesgo** en bandas: `bajo` / `medio` / `alto` / `muy alto`
- **Señales detectadas** que caracterizan la interacción
- **Recomendaciones concretas** sobre qué hacer a continuación ("no transfieras hasta verificar", "confirma por otro canal", etc.)

### Principios de diseño

✓ **Privacidad primero** — Sin login, sin tracking, sin guardar datos sensibles  
✓ **Accesible** — Diseñado para usuarios no técnicos  
✓ **Confiable** — Las decisiones se basan en reglas determinísticas y un catálogo de señales, no en IA  
✓ **Pragmático** — Una sola evidencia es suficiente para un análisis inicial  

## Características

### Análisis inteligente
- OCR automático para procesar capturas de pantalla
- Extracción estructurada de datos usando Gemini
- Detección de patrones de fraude conocidos
- Scoring basado en reglas duras y catálogo de señales

### Motor de señales
Detecta patrones como:
- Suplantación de autoridad
- Solicitudes de OTP o credenciales
- Presión de tiempo artificial
- Solicitudes de pago sin justificación
- Y muchas más...

### Biblioteca de patrones
Mantiene un registro versionado de patrones de fraude conocidos que se actualiza continuamente basado en nuevos casos.

## Tecnología

**Frontend & Backend:**
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS

**Persistencia:**
- Supabase (PostgreSQL + Storage)
- Patrones versionados en JSON/YAML

**ML & LLM:**
- Google Gemini (extracción de datos)
- Scoring determinístico (sin IA)

## Empezar localmente

### Requisitos
- Node.js 18+
- npm o pnpm
- Variables de entorno configuradas

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/franclarke/Estafometro.git
cd Estafometro

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Completa los valores en .env.local

# Ejecutar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del proyecto

```
Estafometro/
├── docs/                          # Especificaciones del proyecto
│   ├── especificacion_funcional.md
│   ├── especificacion_tecnica.md
│   └── plan_implementacion.md
├── src/
│   ├── app/                       # App Router de Next.js
│   ├── components/                # Componentes React
│   ├── lib/                       # Utilidades y helpers
│   └── types/                     # Tipos TypeScript
├── patterns/                      # Biblioteca de patrones de fraude
├── supabase/                      # Migraciones y configuración de BD
└── public/                        # Archivos estáticos
```

## Pipeline de análisis

Cada caso fluye a través de 8 módulos en orden:

1. **Ingesta** — Recibir entrada del usuario
2. **Preprocesamiento** — OCR, normalización
3. **Extracción** — Estructura con Gemini
4. **Motor de señales** — Regex + catálogo + reglas
5. **Enriquecimiento** — Validaciones externas opcionales
6. **Motor de patrones** — Coincidencia con biblioteca oficial
7. **Motor de riesgo** — Scoring → banda final
8. **Motor de explicación** — Resumen + recomendación

## API

### Endpoints principales

```
POST   /api/cases                      # Crear caso
POST   /api/cases/:id/evidence         # Agregar evidencia
POST   /api/cases/:id/analyze          # Analizar caso
GET    /api/cases/:id/result           # Obtener resultado
POST   /api/cases/:id/feedback         # Enviar feedback
```

Consulta la especificación técnica en `docs/especificacion_tecnica.md` para más detalles.

## Reglas de riesgo duro

Estas condiciones garantizan un nivel mínimo de riesgo:

- `solicita_otp` → Mínimo: **alto**
- `suplanta_autoridad + solicita_soborno` → Mínimo: **muy alto**
- `amenaza_arresto + solicita_transferencia` → Mínimo: **muy alto**

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Lee `CLAUDE.md` para entender la arquitectura
2. Consulta `docs/plan_implementacion.md` para el orden de implementación
3. Sigue las convenciones del proyecto (TypeScript, español para UX)
4. Abre un PR con descripción clara

## Licencia

MIT — Libre para usar y modificar

## Contacto

¿Preguntas? Abre un issue en GitHub o contacta al equipo.

---

**Hecho con ❤️ para proteger a usuarios hispanohablantes de estafas digitales**
