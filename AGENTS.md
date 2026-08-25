# AGENTS.md — Tripflow

This file is the single source of truth for this project. Read it in full before generating any code. It applies to any agent (Claude Code, Antigravity, or any other AGENTS.md-compatible tool).

---

## 1. What Tripflow is

A travel budget tracking webapp. Three core features: expense dashboard, trip creation with a budget limit, and fast expense logging. Two differentiators: (1) an expense form with photo autofill via AI, (2) a Budget Card with a traffic-light indicator + clock + alert.

**No login, no data backend, no multi-user support.** All persistence is local to the browser.

---

## 2. Tech stack

- **Frontend:** Vite + React
- **Styling:** Tailwind CSS (full config in section 4)
- **API/AI:** Cloudflare Pages Functions — proxies calls to OpenRouter so the API key is never exposed client-side
- **Persistence:** `localStorage`, exclusively through a single data layer
- **Deploy:** Cloudflare Pages

### Persistence rule (non-negotiable)

All data reads/writes go through `/lib/store.ts`. No component calls `localStorage` directly. Expected functions: `getTrips()`, `getTrip(id)`, `saveTrip(trip)`, `deleteTrip(id)`, `getExpenses(tripId)`, `saveExpense(expense)`, `deleteExpense(id)`.

This exists so that if the project ever migrates to a real backend, only this file needs to be rewritten — nothing else.

---

## 3. Data model and business rules

### Trip
```ts
{
  id: string
  nombre: string           // = selected country (España, México, etc.)
  pais: string              // Estados Unidos | México | Colombia | España | Francia | Alemania | Italia
  moneda: string             // derived from country
  motivo: 'vacaciones' | 'negocios'
  fecha_inicio: string
  fecha_fin: string
  presupuesto_total: number  // in COP
  finalizado_manualmente: boolean // true if the "Finalizar viaje" button was used
}
```

### Expense
```ts
{
  id: string
  trip_id: string
  titulo: string
  monto: number
  fecha: string   // default: today
  origen: 'foto' | 'manual'
  creado_en: string // timestamp, for ordering and "Xh ago"
}
```

> **monto is stored in the trip's own local currency** (derived from `trip.pais` via `trip_id`), **NEVER in COP**. Any COP-denominated total or display must convert each expense via budget.js's `convertirLocalACOP()` before aggregating. The navbar currency switch ("Mostrar resultados en COP") governs both the TripActiveCard budget numbers AND the ExpenseRow amount display — not just the budget card.

### Trip status (always derived, never its own stored field)

```
if finalizado_manualmente === true → "Finalizado"
else if today < fecha_inicio → "Próximo"
else if fecha_inicio <= today <= fecha_fin → "Activo"
else (today > fecha_fin) → "Finalizado"
```

Product rule: **only one trip can be "Activo" at a time.** There is no button to start a trip early — moving to "Activo" is always automatic, driven by date.

**Finished trips are never deleted.** When a trip ends (by date or via the manual button), its card collapses into the compact "Finalizado" variant, keeping the trip and its expense history intact.

### Suggested budget based on trip purpose (on trip creation)

```
Vacaciones → $150,000 COP/day × trip duration
Negocios   → $250,000 COP/day × trip duration
```
The field stays editable — this only pre-fills an initial value.

### "Can I afford this?" threshold

```
entered_amount / remaining_daily_budget ≤ 69% → green result (alert-min)
> 69% → rose result (alert-max)
```
Referred to internally as **"la Regla del 69%"**.

No text verdict ("Yes you can" / "No you can't") — just two percentages (% of daily budget, % of total budget), with the banner color communicating the result.

### Expense risk coloring (ExpenseRow accent color)
Each saved expense is color-coded by comparing its amount (converted to COP) against the trip's FIXED daily budget (presupuesto_total / duración — the same stable value used in calcularPresupuestoDiario, NOT the fluctuating remaining daily budget). This means an expense's color is set once and never changes afterward, regardless of later spending on the same trip.

```
≤ 40% of the fixed daily budget → 'low' (alert-min, green)
> 40% and ≤ 70% → 'medium' (alert-medium, yellow)
> 70% → 'high' (alert-max, red)
```

This is a distinct rule from "Can I afford this?" above: that one is prospective (evaluated before spending, against the fluctuating remaining daily budget); this one is retroactive (colors already-saved expenses in "Recent expenses", against the fixed original daily budget).

### "Recent expenses"
Only shows expenses for the **Activo** trip. It is not a cross-trip feed.

### Time-of-day greeting
The header greeting ('Buenos días'/'Buenas tardes'/'Buenas noches') is always based on the current time in Bogotá (America/Bogota timezone), regardless of the user's device timezone — never use local device time for this.

05:00–11:59 → 'Buenos días' ☀️
12:00–18:59 → 'Buenas tardes' 🌤️
19:00–04:59 → 'Buenas noches' 🌙

---

## 4. Tokens — `tailwind.config.js`

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Public Sans', 'sans-serif'],
      },
      fontSize: {
        h1: ['48px', { lineHeight: '50px', letterSpacing: '-1.92px', fontWeight: '800' }],
        h2: ['32px', { lineHeight: '36px', fontWeight: '700' }],
        h3: ['24px', { lineHeight: '28px', fontWeight: '700' }],
        body: ['16px', { lineHeight: '20px', fontWeight: '400' }],
        label: ['12px', { lineHeight: '20px', fontWeight: '600' }],
      },
      colors: {
        'bg-body': '#F6F4ED',
        'bg-navbar-forms': '#FBF9F2',
        'bg-surface': '#FFFFFF',
        'bg-list-item': '#EEE9DC',
        'ink-primary': '#000000',
        'ink-muted': '#45464D',
        'stroke-form': '#EBE7DC',
        'btn-disable': '#C7C7C7',

        'status-activo-bg': '#E2F7CE',
        'status-activo-text': '#386A00',
        'status-proximo-bg': '#FDF5C7',
        'status-proximo-text': '#6C5E00',
        'status-finalizado-bg': '#E8E6DE',
        'status-finalizado-text': '#A19E95',

        'alert-min': '#A8E56F',
        'alert-medium': '#ECCD7F',
        'alert-max': '#E29683',
      },
      borderRadius: {
        'xs': '8px',
        'sm': '16px',
        'md': '20px',
        'lg': '28px',
        'full': '9999px',
      },
      boxShadow: {
        soft: '0 10px 30px 0px rgba(0,0,0,0.03)',
      },
    },
  },
}
```

### Quick guide to where each radius is used (extracted from the actual Figma components)

| Token | Value | Used in |
|---|---|---|
| `radius-xs` | 8px | Small inner boxes (e.g. "You can still spend this much per remaining day") |
| `radius-sm` | 16px | "Recent expenses" rows, risk badges |
| `radius-md` | 20px | Inputs, photo upload zone, drawer (inner corners) |
| `radius-lg` | 28px | Large cards (trip card, form card) |
| `radius-full` | 9999px | Buttons, pills, status badges, switch, progress bars |

### Spacing

**Not tokenized as a custom variable.** Use Tailwind's default scale exclusively (multiples of 4px: `gap-1`...`gap-12`, `p-1`...`p-12`, etc.). Never arbitrary syntax (`gap-[30px]`, `p-[23px]`). If a design value isn't a clean multiple of 4, round to the nearest scale value.

---

## 5. Base components — build once, compose everything else from them

Do not rewrite similar markup across screens. These 8 components are the foundation:

1. **Button** — variants: primary (fill `ink-primary`, white text), outline/secondary
2. **Card** — base shell: background + `radius-lg` + `shadow-soft`
3. **StatusBadge** — pill colored by status (`status-activo`, `status-proximo`, `status-finalizado`)
4. **ProgressBar** — thin bar, two variants: filled (Activo trip) and outline/empty (Próximo trip, countdown)
5. **Input** — labeled field wrapper, used across the 3 forms
6. **AmountPill** — amount shown in a small pill, used in expense rows
7. **ExpenseRow** — full row: colored side accent + description + `AmountPill` + relative time
8. **SegmentedToggle** — two options (e.g. Vacaciones/Negocios), selected = `ink-primary` fill

Do not force TripCard and the Budget Card into a single generic component with many props — they're different enough; build them separately by composing the pieces above.

---

## 6. Sitemap (2 levels, no drill-in)

```
Dashboard (= Trip list)
 ├── One card per trip (Próximo / Activo / Finalizado)
 ├── "+ New trip" button → side drawer (New trip form)
 │
 └── Active trip card (expanded, in the same dashboard, no navigation to another screen):
      ├── Budget card: % ring + "Remaining" + Day X of Y + "You can spend this much per remaining day"
      ├── "Can I afford this?" (inline expansion within the same card)
      ├── "End trip" button → confirmation (inline blur layer) → Final report (same slot)
      └── "Recent expenses" (Activo trip only) + "Add expenses" button → inline panel with the Add expense form
```

There are no separate pages for trip detail or for the forms — everything lives as an expansion/inline panel inside the Dashboard, except "New trip" which is a side drawer.

---

## 7. Forms — exact content

### New trip (drawer)
Country (7 options: United States, Mexico, Colombia, Spain, France, Germany, Italy) · Trip purpose (toggle) · Start date · End date · Budget (COP, with a suggested conversion shown unless Country = Colombia)

### Add expense (inline panel)
Photo upload zone (copy: "Take one or several photos of your receipts" — note: the MVP currently only processes one photo/expense at a time; the copy is intentionally left this way to not block a future multi-expense version) · Title · Amount · Date (default: today)

No categories — dropped due to friction.

### Receipt extraction UX states
While /api/extract-receipt is in flight, a rotating playful loading message replaces the plain 'Analizando recibo...' label, cycling every ~3 seconds through a fixed list of messages (see AddExpensesForm.jsx for the exact list).

On total failure (both monto and comercio null, or a network/timeout error): show a friendly, non-scary message acknowledging the failure, then fall back to manual entry — this REPLACES the previous fully-silent-fallback behavior with a visible but lighthearted one.

On partial success: if only monto was extracted, tell the user so and prompt them to fill in the título manually. If only comercio was extracted, tell the user so and prompt them to fill in the monto manually. If both were extracted, no message is shown — fields are simply pre-filled as before.

### Final report (inside the card, after "End trip")
Budget vs. total spent · corresponding % · message based on outcome (within/over budget) · full expense history for the trip (reusing `ExpenseRow`) · "Continue" button → collapses into the compact "Finalizado" card (the trip is never deleted)

---

## 8. Out of scope for the MVP (explicit backlog — do not build)

- Login / authentication
- Logging expenses from multiple simultaneous photos (multiple editable rows saved in one submission)
- Expense categories
- Editing/deleting an already-saved expense
- Real-time exchange rates (use fixed, hardcoded rates)
- Real-time price scanning via camera ("Can I afford this?" with OCR) — the current "Can I afford this?" feature uses **manual amount entry**, not the camera
