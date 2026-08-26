# Tripflow

Una webapp de control de presupuesto de viaje — planea el presupuesto de un viaje, registra gastos sobre la marcha (con autollenado por foto vía IA), y visualiza de un vistazo si vas bien encaminado. Construida para la prueba técnica de Product Design de Alegra.

**App en vivo:** https://tripflow-2yt.pages.dev/
**Repositorio:** https://github.com/andrespalaciovera/tripflow

---

## Stack técnico

- **Frontend:** Vite + React
- **Estilos:** Tailwind CSS (completamente tokenizado — ver `tailwind.config.js` y `AGENTS.md`)
- **Persistencia:** `localStorage`, accedido exclusivamente a través de `/src/lib/store.js` (ningún otro archivo llama a localStorage directamente)
- **Integraciones de IA/API:** Cloudflare Pages Functions actúan como proxy hacia dos servicios externos, para que las API keys nunca queden expuestas del lado del cliente:
  - `functions/api/extract-receipt.js` → OpenRouter (Google Gemini 2.5 Flash) para extracción automática de gastos a partir de una foto
  - `functions/api/exchange-rate.js` → ExchangeRate-API para conversión de moneda en vivo (con fallback a tasas fijas si no está disponible)
- **Despliegue:** Cloudflare Pages

Para el modelo de datos completo, las reglas de negocio, y la referencia de tokens de diseño, ver [`AGENTS.md`](./AGENTS.md) — es la fuente única de verdad con la que se construyó este proyecto.

**Archivo de Figma:** [Tripflow / Alegra Design System](https://www.figma.com/design/1WN7Nt01ngZpGjbvLDJ4Tq/Alegra)

---

## Probar el autollenado por foto (IA)

Para probar la extracción automática de datos de un recibo (sin salir a buscar una foto), hay fotos de recibos de ejemplo listas para usar en [`docs/assets/sample-receipts/`](./docs/assets/sample-receipts/). Descárgalas y súbelas directamente en el formulario "Agregar gastos" — no necesitas conseguir tus propias fotos para probar esta funcionalidad.

---

## Cómo correrlo localmente

### 1. Clonar e instalar

```bash
git clone https://github.com/andrespalaciovera/tripflow.git
cd tripflow
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Luego completa `.env` con tus propias API keys gratuitas:

| Variable | Dónde conseguirla |
|---|---|
| `OPENROUTER_API_KEY` | Cuenta gratuita en [openrouter.ai](https://openrouter.ai) → Settings → Keys |
| `EXCHANGE_RATE_API_KEY` | Cuenta gratuita en [exchangerate-api.com](https://www.exchangerate-api.com) → Dashboard |

Ambas son de nivel gratuito, sin necesidad de tarjeta de crédito. Sin estas keys, la app sigue funcionando igual — el autollenado por foto y la conversión de moneda en vivo simplemente caen a su comportamiento de respaldo diseñado (entrada manual / tasas fijas).

### 3. Correr el servidor de desarrollo

**Opción A — solo frontend** (más rápido, pero las rutas `/api/*` no van a funcionar):

```bash
npm run dev
```

**Opción B — app completa, incluyendo las Cloudflare Functions** (recomendado — necesario para probar la extracción por foto y las tasas de cambio en vivo):

```bash
npx wrangler pages dev --proxy <puerto-de-vite> -- npm run dev
```

Corre esto primero sin `--proxy` para ver qué puerto toma Vite (por defecto es `5173`, pero sube si ya está ocupado), y vuelve a correrlo con el puerto correcto. Wrangler va a imprimir `Ready on http://127.0.0.1:8788` — **usa esa URL** (no la de Vite) para acceder a la app con las rutas de API funcionando.

### 4. Compilar para producción

```bash
npm run build
```

El resultado queda en `/dist`.

---

## Estructura del proyecto

```
/src
  /components   → piezas de UI reutilizables (Button, Card, ExpenseRow, etc.)
  /pages        → Dashboard.jsx, la única vista principal de la app
  /lib
    store.js    → el único archivo autorizado a tocar localStorage
    budget.js   → toda la lógica de negocio de presupuesto/fechas/moneda (funciones puras)
    saludo.js   → lógica del saludo según la hora del día
/functions/api  → Cloudflare Pages Functions (lado del servidor, esconden las API keys)
AGENTS.md       → modelo de datos, reglas de negocio, tokens de diseño — leer esto primero
```

---

## Notas sobre el alcance

Este MVP usa `localStorage` de forma intencional en vez de un backend/autenticación real — ver `AGENTS.md` para el razonamiento y lo que agregaría una versión de producción. Una lista de funcionalidades deliberadamente pospuestas (registro de gastos con múltiples fotos, tasas de cambio en tiempo real como fuente única, etc.) está documentada en `AGENTS.md` §8.