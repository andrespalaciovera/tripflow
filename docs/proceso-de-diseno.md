# Tripflow — Proceso de Diseño

**Andrés Palacio Vera** · Prueba técnica de Product Design, Alegra · Agosto 2026

---

## Resumen ejecutivo

Tripflow es una webapp de control de presupuesto de viaje, construida en un sprint de ~5 días siguiendo un proceso completo de diseño: research secundario → definición de problema/hipótesis → ideación → diseño de interfaz → desarrollo con IA asistida → iteración sobre bugs reales → documentación.

Dos funcionalidades diferenciadoras nacen directamente del research, no de intuición: **registro de gastos con autollenado por foto** (resuelve la fricción de velocidad de registro) y una **Card de presupuesto con semáforo/reloj/alerta** (resuelve la pregunta central "¿puedo pagar esto?"). Todo el proceso —incluyendo dónde se corrigió a la IA, dónde se descartaron ideas por presupuesto de tiempo, y qué bugs reales se encontraron y arreglaron— está documentado en este archivo y en `colaboracion-con-ia.md`.

---

## 1. Research

### Preguntas de investigación
1. ¿Cómo gestionan actualmente los viajeros su presupuesto y gastos durante un viaje?
2. ¿Qué dificultades encuentran al registrar y monitorear sus gastos durante un viaje?
3. ¿En qué momentos necesitan consultar o registrar sus gastos?
4. ¿Qué información necesitan para saber si están dentro o fuera de presupuesto?

### Fuentes priorizadas
**Tier 1 — evidencia de comportamiento real:** reseñas de App Store/Google Play (TravelSpend, Trabee Pocket, Tripcoin), foros de viajeros (Rick Steves, Tripadvisor), blogs de viajeros de primera mano.
**Tier 2 — contexto:** publicaciones de viaje, artículos financieros sobre presupuesto.

El research completo está en [`Travelers' Budgets and Expenses.pdf`](./research/Travelers_Budgets_and_Expenses.pdf).

### Las 4 conclusiones que definieron el producto

1. **La velocidad de registro es el mayor punto de fricción** — evidencia en reseñas reales de TravelSpend ([1](https://apps.apple.com/us/app/travelspend-travel-budget-app/id1434284824?see-all=reviews&platform=iphone), [2](https://apps.apple.com/us/app/travel-spend-trip-budget/id6761303975)). Esto define directamente el **Diferenciador 1** (autollenado por foto).
2. **La reconciliación al final del día es el patrón real, no el tracking en tiempo real** ([Her Packing List](https://herpackinglist.com/how-to-track-travel-expenses/), [FinancialAha](https://www.financialaha.com/articles/track-expenses-while-traveling/)).
3. **La pregunta que el producto realmente necesita responder es "¿puedo pagar esto?"** ([Trail Wallet](https://voyagetravelapps.com/trail-wallet/), [FinancialAha](https://www.financialaha.com/articles/track-expenses-while-traveling/)) — define el **Diferenciador 2** (Card de presupuesto).
4. **Efectivo y multimoneda son donde fallan las herramientas existentes** ([The World Trippers](https://www.theworldtrippers.com/travel-tips/travel-expenses-app/), [Rick Steves Forum](https://community.ricksteves.com/travel-forum/tech-tips/travelspend-app)) — define el manejo de moneda local por viaje en el modelo de datos.

---

## 2. Define

### User Personas

**Sofía, 29 años · Viajera independiente**
> "Quiero controlar mis gastos sin tener que interrumpir mi viaje para hacerlo."

Deseos: registrar gastos rápido y sin fricción, saber cuánto puede gastar sin calcular a mano.
Frustraciones: formularios largos, olvidar gastos pequeños en efectivo por posponer el registro.
**Pain points:** velocidad de registro & reconciliación al final del día.

**Daniel, 42 años · Viajero internacional frecuente**
> "Quiero saber en todo momento cómo estoy respecto a mi presupuesto, incluso cuando gasto en diferentes monedas y en efectivo."

Deseos: ver de inmediato cuánto presupuesto le queda, sin importar la moneda.
Frustraciones: convertir monedas a mano, perder visibilidad de gastos en efectivo.
**Pain points:** "¿puedo pagar esto?" & efectivo/multimoneda.

### Problem & Hypothesis Statements

**Sofía**
- **PS:** Sofía necesita registrar sus gastos de forma rápida y sencilla porque los métodos actuales requieren demasiado esfuerzo, lo que la lleva a posponer el registro y olvidar gastos pequeños.
- **HS:** Si Sofía puede registrar un gasto rápidamente, entonces será más propensa a registrarlo en el momento en que ocurre; sabremos que esto es cierto cuando aumente la tasa de registro exitoso de gastos y disminuya la tasa de abandono del flujo de registro.

**Daniel**
- **PS:** Daniel necesita saber rápidamente cuánto puede gastar porque el uso de efectivo y distintas monedas dificulta mantener una visión clara de su presupuesto.
- **HS:** Si Daniel puede visualizar de inmediato cuánto presupuesto le queda, en su moneda principal, entonces tomará decisiones de gasto con mayor confianza; sabremos que esto es cierto cuando la funcionalidad alcance adopción significativa y los usuarios completen correctamente la tarea en pruebas de usabilidad.

> **Nota de proceso:** la HS de Sofía pasó por 3 versiones antes de esta — la primera propuesta por IA, genérica ("registrar un gasto típico en menos de 5 segundos"), fue reemplazada por una versión mía centrada en comportamiento medible (tasa de éxito/abandono), no en un número de tiempo arbitrario sin forma de instrumentarlo realmente en un MVP. El detalle completo de esta iteración está en `colaboracion-con-ia.md`.

---

## 3. Ideate

### HMW Questions

**Sofía:**
1. ¿Cómo podríamos hacer que la app "adivinara" los gastos del día y Sofía solo tuviera que confirmar o corregir?
2. ¿Cómo podríamos hacer que registrar un gasto fuera tan satisfactorio que Sofía quisiera hacerlo?

**Daniel:**
1. ¿Cómo podríamos mostrarle a Daniel su presupuesto restante sin que tenga que hacer ningún clic?
2. ¿Cómo podríamos hacer que Daniel *sienta* si puede gastar o no, sin tener que leer números?

### Crazy 8's

32 ideas generadas (8 por cada HMW) — ver sketches en `/docs/assets/crazy8's/`. Ideas descartadas por alcance quedaron documentadas explícitamente (ej. mascota virtual, cupones, donación forzada del exceso de gasto) para no perder el rastro de por qué no se construyeron.

### Evaluación de viabilidad — las 2 ideas diferenciadoras

| Funcionalidad | PS que resuelve | Viabilidad | Métricas cuantitativas | Métricas cualitativas |
|---|---|---|---|---|
| **1. Formulario de gastos con autollenado por foto** | Sofía — registro rápido | Media-Alta: 1 llamada a OpenRouter (visión), fallback manual garantizado | Tiempo de registro, tasa de éxito, % foto vs. manual | Percepción de facilidad, confianza en el autollenado |
| **2. Card de presupuesto: Semáforo + Reloj + Alerta** | Daniel — decisión sin cálculo | Alta: cálculo directo, bajo riesgo | Frecuencia de apertura, tiempo hasta la decisión | Interpretación correcta sin ayuda |

*(El "Scan de precio" en tiempo real, evaluado inicialmente junto al Diferenciador 2, se descartó del MVP — ver sección 8, Decisiones de alcance.)*

---

## 4. Design

### Features definidas para el MVP

| # | Funcionalidad | Tipo |
|---|---|---|
| 1 | Lista de viajes (badges Próximo/Activo/Finalizado) | Core |
| 2 | Form: Programar viaje, con presupuesto sugerido automático | Core |
| 3 | Form: Añadir gasto | Core |
| 3a | Autollenado por foto (Diferenciador 1) | Diferenciador |
| 5 | Dashboard de gastos | Core |
| 5a | Card de presupuesto: Semáforo + Reloj + Alerta (Diferenciador 2) | Diferenciador |

*(Tabla completa de subfeatures y lógica de estado en `AGENTS.md`.)*

### Arquitectura de información
Sitemap de 2 niveles, sin drill-in: todo vive en un único Dashboard, incluida la expansión inline de "¿Puedo pagar esto?" y el reporte final al terminar un viaje — decisión tomada explícitamente para simplificar navegación y reducir superficie de desarrollo dado el presupuesto de tiempo.

Ver [`Site Map.png`](./assets/Site%20Map.png) y [`UserFlow.png`](./assets/UserFlow.png) en `/docs/assets/`.

### Evolución visual
La dirección visual se exploró primero con Stitch (3 estilos: Warm Alabaster, Organic Neo-Mint, Playful Pop Mood) antes de convergir en la paleta final, y luego se tokenizó completamente contra el archivo real de marca de Alegra en Figma (tipografía Sora + Public Sans, paleta de estados, radios) — el proceso completo de tokenización, incluyendo discrepancias encontradas y corregidas entre el código y el Figma real, está documentado en `colaboracion-con-ia.md`.

Capturas de esta evolución en `/docs/assets/stitch/`.

---

## 5. Development

### Stack técnico
Vite + React, Tailwind CSS (tokenizado, ver `tailwind.config.js`), `localStorage` como capa de persistencia única (vía `/src/lib/store.js`), Cloudflare Pages Functions como proxy para dos integraciones externas (OpenRouter para extracción por foto, ExchangeRate-API para conversión de moneda), desplegado en Cloudflare Pages.

Justificación completa de estas decisiones (por qué Vite y no Next.js, por qué `localStorage` y no una base de datos real, qué implicaría llevarlo a producción) en `AGENTS.md` §2 y en la conversación de planeación técnica.

### Fases de construcción
El desarrollo se organizó en fases explícitas para garantizar que siempre hubiera algo funcional de punta a punta, incluso si el tiempo se cortaba a mitad de camino:

0. Esqueleto del proyecto + capa de persistencia
1. Componentes base del sistema de diseño (Button, Card, StatusBadge, ProgressBar, Input, AmountPill, ExpenseRow, SegmentedToggle)
2. Lógica de negocio pura en `budget.js`, conectada a datos reales
3. Ensamblaje de pantallas completas
4. Integración de IA (con spike de validación antes de comprometer tiempo de integración completa)
5. Pasada de responsive
6. Pulido y casos borde
7. Documentación y despliegue

### Decisiones técnicas que vale la pena explicar

**Separación estricta de lógica y presentación.** Toda la matemática del dominio (conversión de moneda, nivel de riesgo de un gasto, presupuesto sugerido según motivo de viaje) vive en `budget.js` como funciones puras — nunca dentro de un componente. Esto permitió, por ejemplo, corregir un bug real de cálculo de fechas (ver sección 7) editando un solo archivo, sin tocar ningún componente visual.

**Integraciones de IA vía spike-first.** Antes de conectar OpenRouter o la API de conversión de moneda al flujo real de la app, cada integración se probó de forma aislada con una página descartable (`test-receipt.html`, `test-exchange-rate.html`, eliminadas antes de la entrega final) — confirmando que la conexión funcionaba antes de invertir tiempo en integrarla al formulario real. Esto redujo el riesgo de mezclar bugs de UI con bugs de integración externa.

**Fallback obligatorio en toda dependencia externa.** Tanto la extracción por foto como la conversión de moneda tienen un camino de respaldo garantizado si la API externa falla: entrada manual en el primer caso, tasas fijas capturadas en vivo una sola vez en el segundo. Ninguna funcionalidad del producto depende 100% de que un servicio de terceros esté disponible.

---

## 6. Iteración — bugs reales encontrados y corregidos

Documentar esto es intencional: parte del valor de este proceso es mostrar pensamiento crítico real, no solo un resultado final sin fricciones.

- **Bug de zona horaria en cálculo de días de viaje:** `new Date("YYYY-MM-DD")` se interpreta como medianoche UTC, no local — en Colombia (UTC-5) esto corría la fecha de inicio un día hacia atrás, haciendo que un viaje de 2 días mostrara "Día 2 de 2" en su primer día real. Corregido parseando la fecha por componentes locales en vez de por string.
- **Formulario de gastos cortado en layout de altura fija:** una iteración de diseño (dashboard sin scroll de página, 100vh fijo) causaba que el formulario expandido de "Agregar gastos" quedara recortado sin poder llegar al botón "Guardar". Se revirtió esa decisión de layout completa en favor de scroll de página normal con navbar+saludo fijos — más simple y sin ese riesgo.
- **Datos de ejemplo (mock) filtrándose al estado vacío real:** el dashboard mostraba viajes falsos incluso después de limpiar `localStorage`, porque había datos semilla hardcodeados como fallback en el componente — no un problema de almacenamiento, sino de código. Eliminados por completo; un store vacío ahora siempre muestra el estado vacío real.
- **Inconsistencia de moneda en el cálculo de gastos:** los montos de gasto se ingresan en la moneda local del destino, no en COP — un bug temprano sumaba montos de distintas monedas como si fueran la misma. Corregido con funciones explícitas de conversión direccional (`convertirLocalACOP` / `convertirCOPaLocal`).

---

## 7. Decisiones de alcance conscientes

Estas funcionalidades se evaluaron, se consideraron viables, y se descartaron **explícitamente** del MVP por presupuesto de tiempo — no por falta de valor:

- **Scan de precio en tiempo real vía cámara:** evaluado junto al Diferenciador 2, descartado por duplicar el riesgo de dependencia externa que ya asumía el autollenado por foto.
- **Registro de gastos con múltiples fotos simultáneas:** valioso (conecta con la conclusión de research sobre reconciliación al final del día), pero multiplica la superficie de fallo de la integración de IA sin cambiar el valor central del producto.
- **Categorías de gasto:** eliminadas del formulario por fricción de registro — directamente en línea con la conclusión #1 del research.
- **Tasas de cambio en tiempo real como fuente única:** se integraron como mejora (ver sección 5), pero con tasas fijas como respaldo obligatorio, nunca como dependencia única.

---

## 8. Resultados

Como este MVP se acaba de desplegar, **no existen todavía métricas reales de comportamiento de usuarios** — cualquier número de ese tipo sería inventado, así que esta sección separa deliberadamente dos cosas distintas: lo que sí se validó durante el desarrollo, y lo que el producto está instrumentado para medir una vez tenga uso real.

### Lo que se validó durante el desarrollo (real, verificado)
- **Extracción por foto:** en la prueba de validación inicial (spike), 2 de 3 llamadas produjeron una extracción correcta del monto y comercio; la tercera devolvió `null` de forma segura (sin error, sin dato inventado) — comportamiento esperado dado que se usa el router gratuito de modelos de OpenRouter. Tras conectar créditos reales y fijar un modelo específico (`google/gemini-2.5-flash`), se confirmó una mejora notable de consistencia y latencia.
- **Conversión de moneda en vivo:** latencia real medida de ~240-600ms por llamada.
- **Comportamiento de fallback:** verificado explícitamente simulando una desconexión de red (DevTools → Offline) — la app siguió funcionando con tasas fijas, sin ningún error visible al usuario.
- **Bug de zona horaria:** encontrado mediante prueba manual real (creando un viaje de 2 días y observando el conteo incorrecto), no detectado por revisión de código — evidencia de que la fase de pruebas manuales fue real, no solo formal.

### Lo que el producto está instrumentado para medir en producción
Directamente ligado a las Hypothesis Statements originales:
- **Para la HS de Sofía:** tasa de registro exitoso de gastos (completados vs. iniciados) y tasa de abandono del flujo — el diseño del formulario (foto opcional, nunca bloqueante, "capturar ahora, corregir después") existe específicamente para optimizar estos dos números.
- **Para la HS de Daniel:** frecuencia de apertura de la Card de presupuesto y tasa de finalización correcta de la tarea en pruebas de usabilidad — validable con observación directa de un usuario interpretando el semáforo/reloj sin ayuda.

---

## Índice de material de apoyo

- Research completo: `/docs/research/Travelers_Budgets_and_Expenses.pdf`
- Sketches de Crazy 8's: `/docs/assets/crazy8's/`
- Evolución visual (Stitch): `/docs/assets/stitch/`
- User Flow y Site Map: `/docs/assets/`
- Archivo de Figma (tokens, componentes): enlace en `AGENTS.md`
- Colaboración con IA (detalle qué se pidió / qué se ajustó): `colaboracion-con-ia.md`
- Modelo de datos, reglas de negocio, tokens de diseño: `AGENTS.md`
