# Especificación funcional
## Producto: App web de evaluación y prevención de estafas digitales
## Versión: v0.1
## Estado: Draft inicial

---

## 1. Resumen ejecutivo

Este documento define la especificación funcional de una aplicación web gratuita, liviana y orientada a usuarios no técnicos para evaluar señales de riesgo en interacciones digitales sospechosas. El sistema permite que una persona describa libremente un caso potencial de estafa, adjunte evidencia opcional y reciba una recomendación prudente, explicada y accionable.

La aplicación no busca confirmar identidades ni determinar con certeza legal que un caso sea una estafa. Su objetivo es ayudar al usuario a evitar una acción riesgosa inmediata, especialmente transferencias, señas, entrega de códigos o validaciones precipitadas.

El producto está diseñado con foco en simplicidad, bajo costo operativo, mínima fricción de uso, fuerte legibilidad para personas poco técnicas y una arquitectura funcional compatible con una primera implementación por un solo builder o un equipo pequeño.

---

## 2. Objetivo del producto

### 2.1 Objetivo principal

Ayudar al usuario a decidir si debe frenar, verificar o evitar una acción riesgosa cuando recibe un pedido sospechoso de dinero, datos sensibles o validaciones urgentes en entornos digitales.

### 2.2 Resultado esperado para el usuario

Al finalizar el flujo, el usuario debe obtener:

- una evaluación de riesgo entendible,
- una explicación clara de las señales detectadas,
- una recomendación concreta sobre qué hacer a continuación,
- una advertencia sobre límites de la evaluación.

### 2.3 Objetivo de negocio / producto

Construir una herramienta gratuita, accesible y confiable que:

- entregue valor real desde la primera sesión,
- pueda operar con costo muy bajo,
- aprenda nuevos patrones de fraude con el tiempo,
- mantenga foco en prevención práctica y no en promesas excesivas.

---

## 3. Alcance del producto

### 3.1 Qué problema resuelve

La aplicación resuelve el problema de usuarios que reciben mensajes, llamadas resumidas, links, pedidos de pago o conversaciones sospechosas y no cuentan con criterios claros para detectar señales de fraude antes de actuar.

### 3.2 Qué no resuelve

La aplicación no:

- recupera dinero transferido,
- denuncia automáticamente ante autoridades,
- certifica que una persona o negocio sea legítimo,
- reemplaza asesoramiento legal o policial,
- verifica identidad de forma fehaciente,
- protege cuentas o dispositivos a nivel técnico,
- monitorea mensajes en tiempo real.

---

## 4. Usuarios objetivo

### 4.1 Usuario principal

Persona adulta no técnica que:

- usa WhatsApp, Instagram, SMS o plataformas de compra,
- puede sentirse presionada ante pedidos urgentes,
- realiza transferencias o pagos digitales,
- no sabe bien qué señales mirar,
- necesita una respuesta rápida, simple y concreta.

### 4.2 Usuario secundario

Familiar o persona más técnica que ayuda a terceros a revisar situaciones sospechosas.

### 4.3 Usuario ocasional

Cualquier persona que quiera verificar un caso puntual antes de pagar, compartir datos o responder a una supuesta entidad.

---

## 5. Casos de uso principales

### 5.1 Pedido de dinero por chat

Ejemplos:
- “soy tu hijo, cambié de número”
- “estoy en un problema, transferime ya”
- “necesito que me hagas una transferencia urgente”

### 5.2 Compra online sospechosa

Ejemplos:
- vendedor que pide seña o transferencia para reservar,
- compra iniciada en una plataforma y desviada a Instagram o WhatsApp,
- producto muy conveniente con apuro para cerrar la operación.

### 5.3 Suplantación de banco, soporte o entidad

Ejemplos:
- pedido de código de verificación,
- link para desbloquear cuenta,
- mensaje de soporte con urgencia.

### 5.4 Suplantación de autoridad o extorsión

Ejemplos:
- llamada supuestamente policial o judicial,
- amenaza con causa, allanamiento o denuncia,
- exigencia de pago urgente para “resolver” el problema.

### 5.5 Caso mixto o no clasificado

El usuario describe libremente una situación que no encaja perfectamente en una categoría inicial, pero el sistema igual debe procesarla.

---

## 6. Propuesta de valor funcional

El producto debe permitir que el usuario:

1. cuente qué pasó con sus palabras,
2. agregue evidencia opcional,
3. obtenga un análisis automático,
4. reciba una recomendación prudente y accionable,
5. entienda por qué el sistema llegó a esa conclusión.

La experiencia debe sentirse como una investigación asistida, no como un chatbot abierto ni como un formulario largo.

---

## 7. Principios de experiencia de usuario

### 7.1 Fricción mínima

El sistema debe funcionar incluso si el usuario aporta una sola pieza de evidencia.

### 7.2 Aporte incremental de contexto

Si el usuario agrega más información, el análisis mejora.

### 7.3 Lenguaje simple

El resultado debe usar lenguaje claro, sin jerga técnica innecesaria.

### 7.4 Prudencia

El sistema no debe afirmar “es seguro” ni “es definitivamente una estafa”. Debe hablar en términos de señales, riesgo y acciones recomendadas.

### 7.5 Recomendación accionable

Cada análisis debe terminar en una próxima acción concreta.

---

## 8. Flujo funcional principal

### 8.1 Entrada

El usuario ingresa a la landing y ve una propuesta clara:

- explicar que puede contar el caso,
- aclarar que no necesita registrarse,
- indicar que puede agregar capturas, links o nombres,
- enfatizar que el objetivo es revisar antes de transferir o compartir datos.

### 8.2 Inicio de caso

El usuario debe poder:

- escribir una narrativa libre,
- pegar mensajes,
- subir capturas,
- agregar links,
- agregar un nombre de usuario,
- agregar alias/CBU/teléfono si lo tiene.

No se debe obligar al usuario a completar todos esos campos.

### 8.3 Interpretación inicial

El sistema analiza la evidencia disponible y detecta:

- tipo probable de caso,
- acción solicitada al usuario,
- entidades relevantes,
- señales evidentes,
- si conviene hacer checks externos,
- si hace falta una repregunta breve.

### 8.4 Repreguntas mínimas

El sistema solo debe repreguntar si eso cambia materialmente la calidad del análisis. En ningún caso debe convertir el flujo en un cuestionario largo.

Ejemplos de repreguntas válidas:
- “¿Te pidieron pagar por fuera de la plataforma?”
- “¿Ya conocías ese número?”
- “¿Te pidieron un código?”

### 8.5 Investigación complementaria

Cuando haya datos suficientes, el sistema puede investigar automáticamente:

- desvío fuera de plataforma,
- presencia pública de negocio,
- consistencia entre nombre, dominio y links,
- señales visibles en perfiles o páginas aportadas por el usuario,
- otros checks externos permitidos por la arquitectura.

### 8.6 Resultado

El sistema devuelve:

- nivel de riesgo,
- resumen del caso,
- señales detectadas,
- hallazgos externos relevantes,
- faltantes o incertidumbres,
- recomendación concreta,
- aclaración de límites.

### 8.7 Cierre

El usuario puede:

- copiar la recomendación,
- compartir el resultado,
- iniciar otro caso,
- enviar feedback breve.

---

## 9. Inputs funcionales aceptados

### 9.1 Narrativa libre

Campo de texto grande donde el usuario explica qué pasó.

### 9.2 Texto pegado

Mensajes, conversaciones, links o transcripciones parciales.

### 9.3 Capturas de pantalla

Screenshots de chats, publicaciones, perfiles o mensajes.

### 9.4 Links

De perfiles, publicaciones, páginas o sitios sospechosos.

### 9.5 Identificadores

- nombre de negocio,
- username,
- alias,
- CBU,
- número de teléfono,
- nombre de plataforma.

### 9.6 Metadatos opcionales

- plataforma origen,
- si hubo pedido de transferencia,
- si el número era conocido,
- si el usuario ya pagó o no.

---

## 10. Outputs funcionales

### 10.1 Nivel de riesgo

Bandas funcionales:
- Bajo
- Medio
- Alto
- Muy alto

### 10.2 Resumen del caso

Explicación breve de cómo el sistema entendió la situación.

### 10.3 Señales detectadas

Listado claro de red flags observadas.

### 10.4 Hallazgos externos

Si hubo checks externos, se muestran en lenguaje simple.

### 10.5 Incertidumbres

El sistema debe indicar qué no pudo confirmar.

### 10.6 Recomendación concreta

Ejemplos:
- No transfieras todavía.
- No compartas códigos.
- Verificá por otro canal independiente.
- No pagues por fuera de la plataforma.
- Guardá evidencia y cortá la comunicación.

### 10.7 Advertencia de límites

El resultado debe aclarar que es una evaluación orientativa basada en señales visibles y contexto disponible.

---

## 11. Funcionalidades principales

### 11.1 Creación de caso

El usuario puede iniciar un caso sin cuenta.

### 11.2 Carga de evidencia múltiple

El sistema acepta narrativa y evidencias complementarias.

### 11.3 Clasificación inicial del caso

El sistema asigna una categoría probable.

### 11.4 Extracción de entidades

El sistema extrae entidades relevantes del caso.

### 11.5 Detección de señales

El sistema detecta señales de riesgo mediante reglas y análisis semántico.

### 11.6 Enriquecimiento externo

El sistema realiza checks externos cuando hay información suficiente.

### 11.7 Matching con patrones conocidos

El caso se compara contra una biblioteca de patrones de fraude.

### 11.8 Generación de recomendación

Se construye una recomendación prudente y accionable.

### 11.9 Feedback posterior

El usuario puede indicar si el análisis le resultó útil o si el caso no correspondía.

### 11.10 Analíticas del producto

El sistema registra métricas agregadas para mejorar el servicio.

---

## 12. Biblioteca de patrones de fraude

### 12.1 Objetivo funcional

Permitir que el sistema reconozca patrones conocidos y variantes nuevas sin depender únicamente de interpretación libre del modelo.

### 12.2 Qué contiene

Cada patrón debe incluir:

- nombre,
- categoría,
- resumen,
- señales núcleo,
- señales de alto peso,
- ejemplos de variantes,
- recomendaciones asociadas,
- riesgo mínimo sugerido.

### 12.3 Uso funcional

Cuando un caso coincide con un patrón conocido, el sistema debe:

- reflejarlo internamente,
- usarlo para fortalecer la evaluación,
- adaptar la recomendación,
- eventualmente mencionarlo al usuario en forma comprensible.

### 12.4 Variantes emergentes

El sistema debe poder marcar internamente nuevas combinaciones sospechosas para futura revisión sin necesidad de introducir complejidad excesiva en la experiencia del usuario.

---

## 13. Reglas funcionales de decisión

### 13.1 Regla de prudencia

Si aparece una combinación de señales críticas, el sistema debe escalar el nivel de riesgo aunque falte contexto externo.

### 13.2 Regla de no certeza absoluta

Nunca debe afirmarse seguridad total ni fraude confirmado.

### 13.3 Regla de acciones recomendadas

Toda evaluación debe concluir con una sugerencia operativa clara.

### 13.4 Regla de no sobrecargar al usuario

El sistema debe preferir analizar antes que repreguntar.

### 13.5 Regla de contexto acumulativo

Más evidencia puede mejorar la conclusión, pero una sola fuente debe ser suficiente para una primera evaluación.

---

## 14. Requerimientos funcionales detallados

### RF-01 — Iniciar caso sin autenticación
El sistema debe permitir crear un caso sin registro ni login.

### RF-02 — Aceptar narrativa libre
El sistema debe permitir que el usuario describa el caso con texto libre.

### RF-03 — Aceptar múltiples evidencias
El sistema debe permitir adjuntar una o más evidencias opcionales.

### RF-04 — Procesar una sola evidencia mínima
El sistema debe funcionar aunque el usuario aporte una única fuente.

### RF-05 — Extraer entidades relevantes
El sistema debe detectar entidades relevantes a partir del input.

### RF-06 — Clasificar el tipo de caso
El sistema debe asignar una categoría probable al caso.

### RF-07 — Detectar señales de riesgo
El sistema debe identificar red flags observables en la interacción.

### RF-08 — Ejecutar checks externos condicionales
El sistema debe investigar fuentes externas solo si hay contexto suficiente y si eso mejora la evaluación.

### RF-09 — Realizar repreguntas mínimas
El sistema debe formular como máximo una cantidad acotada de preguntas adicionales solo cuando aporten valor real.

### RF-10 — Calcular un nivel de riesgo
El sistema debe generar un nivel de riesgo interpretable.

### RF-11 — Explicar el porqué
El sistema debe mostrar al usuario por qué detectó ese nivel de riesgo.

### RF-12 — Recomendar acción siguiente
El sistema debe sugerir una acción práctica y prudente.

### RF-13 — Indicar incertidumbres
El sistema debe aclarar qué cosas no pudo confirmar.

### RF-14 — Registrar patrones y matches
El sistema debe relacionar casos con patrones conocidos cuando corresponda.

### RF-15 — Registrar señales estructuradas
El sistema debe almacenar señales detectadas en forma reutilizable.

### RF-16 — Permitir feedback
El sistema debe aceptar feedback del usuario sobre la utilidad del resultado.

### RF-17 — Registrar analíticas de uso
El sistema debe guardar eventos de producto y métricas agregadas.

### RF-18 — Respetar política de privacidad mínima
El sistema debe minimizar persistencia de datos sensibles y aplicar expiración cuando corresponda.

---

## 15. Requerimientos no funcionales

### RNF-01 — Bajo costo operativo
La arquitectura debe poder funcionar con costos bajos y uso eficiente de recursos.

### RNF-02 — Alta claridad de UX
La aplicación debe ser usable por personas poco técnicas.

### RNF-03 — Respuesta rápida
El tiempo de respuesta debe ser razonablemente corto para no frustrar al usuario.

### RNF-04 — Explicabilidad
Las conclusiones deben poder justificarse con señales detectadas.

### RNF-05 — Privacidad por defecto
La retención de datos debe ser mínima y controlada.

### RNF-06 — Escalabilidad moderada
El sistema debe permitir agregar nuevos patrones y nuevas categorías sin rediseño total.

### RNF-07 — Trazabilidad
Debe ser posible auditar cómo se llegó a una conclusión a nivel interno.

---

## 16. Pantallas funcionales

### 16.1 Landing / Home
Objetivos:
- comunicar propuesta de valor,
- permitir iniciar análisis,
- explicar que no requiere registro,
- dar confianza básica.

### 16.2 Pantalla de creación de caso
Objetivos:
- recibir narrativa,
- recibir adjuntos opcionales,
- iniciar análisis.

### 16.3 Pantalla de análisis en progreso
Objetivos:
- informar que el sistema está revisando el caso,
- evitar sensación de error o abandono.

### 16.4 Pantalla de resultado
Objetivos:
- mostrar nivel de riesgo,
- señales detectadas,
- hallazgos externos,
- recomendación,
- límites.

### 16.5 Pantalla de feedback
Objetivos:
- saber si fue útil,
- medir calidad percibida,
- aprender patrones.

### 16.6 Pantalla de información y límites
Objetivos:
- explicar qué hace la herramienta,
- qué no hace,
- cómo se tratan los datos,
- cuándo usar canales oficiales.

---

## 17. Estados funcionales del caso

- recibido,
- procesando,
- requiere contexto adicional,
- analizado,
- análisis parcial,
- error,
- expirado / archivado.

---

## 18. Reglas de contenido y seguridad funcional

### 18.1 No incentivar acciones riesgosas
El sistema no debe sugerir formas de “probar” una estafa que pongan en riesgo al usuario.

### 18.2 No amplificar chantaje o coerción
La recomendación debe orientar a cortar, verificar y preservar evidencia, no a negociar bajo presión.

### 18.3 No exponer datos innecesarios
La interfaz no debe pedir información que no aporte valor al análisis.

### 18.4 No almacenar más de lo necesario
La persistencia debe limitarse a lo estrictamente útil para operación, mejora y analítica.

---

## 19. Métricas funcionales de éxito

### 19.1 Métricas de uso
- casos iniciados,
- casos finalizados,
- tasa de abandono,
- cantidad promedio de evidencias por caso.

### 19.2 Métricas de utilidad
- feedback positivo,
- porcentaje de usuarios que reportan haber evitado transferir,
- porcentaje de usuarios que verifican por otro canal.

### 19.3 Métricas de aprendizaje del sistema
- cantidad de matches con patrones oficiales,
- cantidad de variantes candidatas,
- patrones más frecuentes.

### 19.4 Métricas de calidad percibida
- porcentaje de resultados considerados útiles,
- casos marcados como falsa alarma,
- distribución por nivel de riesgo.

---

## 20. Supuestos funcionales

- El usuario no quiere ni necesita crear cuenta.
- El sistema debe servir principalmente en casos puntuales y urgentes.
- La mayoría de los usuarios no va a completar formularios largos.
- El texto libre es el input más natural.
- El valor aumenta si el sistema puede investigar un poco más allá de lo que el usuario ve.
- La memoria de patrones de fraude puede mejorar la calidad del sistema con el tiempo.

---

## 21. Riesgos funcionales

### 21.1 Riesgo de falsa certeza
Si la interfaz comunica demasiada seguridad, el producto puede volverse peligroso.

### 21.2 Riesgo de ruido
Si el sistema detecta demasiadas señales irrelevantes, el usuario perderá confianza.

### 21.3 Riesgo de fricción
Si el flujo se parece demasiado a un formulario o interrogatorio, caerá el uso.

### 21.4 Riesgo de dependencia de fuentes externas
Si el producto depende demasiado de un único check externo, puede volverse frágil.

### 21.5 Riesgo de sobre-retención de datos
Guardar demasiado contenido puede elevar sensibilidad legal y operativa.

---

## 22. Fuera de alcance para la primera versión

- login y perfiles de usuario,
- historial extenso por usuario,
- integración con WhatsApp como bot,
- monitoreo en tiempo real,
- denuncias automáticas,
- verificación legal de identidad,
- reputación pública de teléfonos o alias,
- moderación social de denuncias,
- aplicación nativa.

---

## 23. Criterios de aceptación de alto nivel

El MVP cumple su objetivo si:

1. una persona puede contar un caso sin registrarse,
2. el sistema procesa una sola evidencia o un caso compuesto,
3. devuelve un resultado claro y prudente,
4. explica señales detectadas,
5. recomienda una acción concreta,
6. puede almacenar estructura suficiente para aprender patrones con el tiempo,
7. mantiene bajo costo y simplicidad operacional.

---

## 24. Próximos artefactos derivados

A partir de esta especificación funcional deberían generarse luego:

1. especificación técnica,
2. modelo de datos definitivo,
3. contratos API,
4. tipos TypeScript,
5. plan de implementación por módulos,
6. prompts de implementación para agente.


---

# Especificación técnica y arquitectura
## Producto: App web de evaluación y prevención de estafas digitales
## Versión: v0.1
## Estado: Draft técnico inicial

---

## 25. Objetivo técnico

Este documento define la arquitectura técnica inicial del sistema, los componentes de software, el flujo de datos, el modelo operativo y las decisiones de diseño necesarias para construir el MVP de forma robusta, económica y extensible.

La meta de esta arquitectura es permitir:

- ingestión de casos compuestos,
- análisis estructurado con IA + reglas,
- checks externos acotados,
- scoring explicable,
- persistencia mínima en Supabase,
- memoria incremental de patrones,
- analíticas de producto,
- privacidad por defecto.

---

## 26. Stack técnico propuesto

### 26.1 Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Deploy en Vercel

### 26.2 Backend ligero

- Serverless functions en Vercel y/o Supabase Edge Functions
- Lógica de orquestación del análisis del lado servidor
- Endpoints HTTP simples, síncronos al inicio

### 26.3 Persistencia

- Supabase Postgres
- Supabase Storage para evidencia temporal

### 26.4 IA

- Gemini API para extracción semántica, estructuración del caso y explicación de resultados

### 26.5 Procesamiento auxiliar

- OCR para screenshots cuando aplique
- parsing y normalización de links, alias, teléfonos y entidades
- catálogo de señales y reglas determinísticas propias

### 26.6 Analítica

- tabla propia de analytics events
- dashboards SQL simples o vistas agregadas

---

