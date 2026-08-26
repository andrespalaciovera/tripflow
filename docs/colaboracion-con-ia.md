# Tripflow — Colaboración con IA

**Andrés Palacio Vera** · Prueba técnica de Product Design, Alegra · Agosto 2026

---

## Cómo se usó IA en cada etapa

| Etapa | Herramienta | Rol |
|---|---|---|
| Research y research secundario | Claude (con búsqueda web) | Recopilación y síntesis de evidencia de comportamiento real de viajeros |
| Definición, ideación, planeación de producto | Claude | Sparring de decisiones — personas, HMW, features, alcance |
| Exploración visual | Google Stitch | Generación de variantes de UI a partir de prompts iterativos |
| Tokenización de diseño | Claude (con MCP de Figma) | Extracción y aplicación de tokens reales desde el archivo de Figma de Alegra |
| Construcción de código | Claude (VS Code) + Antigravity (Gemini) | Implementación a partir de prompts detallados, alternando herramienta según disponibilidad de créditos |

En ningún punto se aceptó un output de IA sin revisión — este documento existe para mostrar exactamente dónde y por qué se corrigió, rechazó, o ajustó lo que la IA propuso.

---

## Casos concretos: qué propuso la IA vs. qué decidí yo

### 1. Validar la necesidad del producto
**La IA propuso:** empezar el research preguntando qué tan frecuente es el problema y validando si realmente existe la necesidad, antes de diseñar la solución.
**Yo corregí:** "No estoy de acuerdo, al ser un assessment para una entrevista no hay que validar la necesidad, solo hay que ejecutarla." El brief ya define el problema y el alcance del producto — investigar si el problema "existe" habría sido repetir trabajo que el assessment ya da por hecho.
**Por qué importa:** entender el contexto real de la tarea (assessment vs. producto real) y no seguir un proceso genérico "por defecto".

### 2. La Hypothesis Statement de Sofía
**La IA propuso** (primera versión): *"sabremos que esto es cierto cuando pueda registrar un gasto típico en menos de 5 segundos y mantenga el registro de sus gastos durante el viaje."*
**Yo corregí:** *"sabremos que esto es cierto cuando aumente la tasa de registro exitoso de gastos y disminuya la tasa de abandono del flujo de registro."*
**Por qué importa:** la primera versión propone un número (5 segundos) sin ninguna forma real de medirlo en un MVP sin analítica de producción. Mi versión usa métricas de comportamiento (tasa de éxito, tasa de abandono) que sí son instrumentables con eventos simples, y que conectan directamente con lo que el research identificó como el problema real (abandono del registro, no solo su velocidad).

### 3. El umbral del 69% vs. un valor "razonable" por defecto
**La IA propuso** (como default razonable, sin confirmación explícita) un umbral de 80% para decidir si un gasto es "riesgoso" frente al presupuesto diario.
**La realidad del código:** el umbral real ya implementado era 69% ("la Regla del 69%").
**Mi decisión:** en vez de forzar el código a coincidir con lo que la IA había asumido, confirmé que 69% era intencional y pedí que se actualizara la documentación (`AGENTS.md`) para reflejar la realidad — no al revés.
**Por qué importa:** la documentación debe describir lo que el producto realmente hace, no lo que se planeó originalmente si esa decisión cambió conscientemente después.

### 4. Layout de altura fija (100vh) — decisión tomada, probada, y revertida
**Yo decidí**, después de pesar las opciones con la IA, adoptar un layout tipo "app" de altura fija (sin scroll de página) para el Dashboard, en vez de scroll normal.
**Lo que pasó al probarlo:** el formulario de "Agregar gastos", al expandirse, quedaba cortado sin poder llegar al botón "Guardar" — un problema funcional real, no solo estético.
**Mi decisión final:** revertir la arquitectura completa de vuelta a scroll de página normal, con navbar y saludo fijos arriba — más simple y sin ese riesgo.
**Por qué importa:** una decisión de diseño tomada con buena razón puede resultar mala en la práctica; la disposición a revertir una arquitectura completa en vez de parchar sus síntomas fue una decisión consciente de costo-beneficio.

### 5. Modelo de IA para la extracción de recibos
**Decisión inicial:** usar `openrouter/free`, el enrutador gratuito de modelos de OpenRouter, dado que el proyecto no tenía créditos pagos todavía.
**Lo que mostraron las pruebas reales:** latencia inconsistente (9 a 40 segundos) y resultados nulos en aproximadamente 1 de cada 3 llamadas — comportamiento esperado de un enrutador gratuito que rota entre modelos al azar.
**Mi decisión, una vez cargados créditos reales:** cambiar a un modelo específico y pago (`google/gemini-2.5-flash`), elegido por su desempeño confirmado en tareas de OCR/extracción de documentos.
**Por qué importa:** la decisión de actualizar el modelo se basó en datos reales de prueba (latencia y tasa de éxito medidas), no en preferencia o en la sugerencia inicial de la IA.

### 6. Usar IA para auditar el trabajo de otra sesión de IA
**El problema:** una parte del desarrollo (responsive, pulido de UI, deploy) se hizo con Antigravity mientras Claude no tenía visibilidad del proceso, por límite de créditos.
**Mi decisión:** antes de escribir documentación final, pedí una auditoría completa del estado real del proyecto contra lo documentado en `AGENTS.md`.
**Lo que reveló:** 6 divergencias reales entre la documentación y el código (ej. tasas de presupuesto sugerido, tipo de confirmación de "Finalizar viaje"), más un riesgo real de seguridad (archivos de prueba que podían seguir desplegándose en cada build). Cada divergencia se revisó una por una — algunas eran decisiones conscientes mías que solo faltaba documentar, otras eran drift real que se corrigió.
**Por qué importa:** verificar el trabajo de una herramienta de IA con otra, en vez de asumir que todo quedó como se planeó, fue lo que encontró el único riesgo real antes de la entrega (archivos de prueba potencialmente expuestos en producción).

### 7. El bug de zona horaria — encontrado por prueba humana, no por revisión de código
**Cómo se encontró:** yo mismo, creando manualmente un viaje de 2 días y notando que el contador mostraba "Día 2 de 2" en el primer día real del viaje — no lo detectó ninguna revisión automática de código.
**El rol de la IA:** una vez reportado el síntoma, diagnosticar la causa exacta (parseo de fechas interpretado como UTC en vez de hora local) y proponer el arreglo.
**Por qué importa:** ningún volumen de generación de código con IA reemplaza probar la app como usuario real — este bug era invisible leyendo el código, solo se manifestaba usando la funcionalidad de verdad.

---

## Lo que esto demuestra en conjunto

La IA fue una herramienta de ejecución rápida y de sparring de decisiones — nunca la autoridad final. Los casos de arriba muestran cuatro tipos de intervención humana distintos: **rechazar** una sugerencia, **corregir** un supuesto técnico, **revertir** una decisión propia después de probarla, y **verificar** el trabajo de una sesión de IA con otra. Ninguno de estos patrones es "usar IA para que haga el trabajo" — todos requirieron criterio de producto y disposición a decir que no.
