// Cloudflare Pages Function — SPIKE: proxia una consulta de tasas de cambio a
// ExchangeRate-API (v6, free tier) para que la API key nunca se exponga al
// cliente (AGENTS.md, sección 2). Único trabajo de esta función: recibir una
// moneda base, pedirle a ExchangeRate-API sus tasas, y devolver solo las 3
// monedas que le importan al modelo de datos real (AGENTS.md §3/§7: USD, MXN
// y EUR — España/Francia/Alemania/Italia comparten EUR) como JSON limpio.
//
// Deliberadamente NO implementa fallback a tasas fijas aquí: si esta función
// falla, debe fallar visiblemente (status de error claro). El fallback a
// TASAS_CONVERSION_COP vive una capa arriba, en budget.js, para que sea
// testeable por separado del proxy en sí (ver tarea del spike).
//
// Contrato con el cliente:
//   GET /api/exchange-rate?base=COP
//   Respuesta 200: { "USD": 0.00025, "MXN": 0.0043, "EUR": 0.00023 }

const EXCHANGE_RATE_URL_BASE = 'https://v6.exchangerate-api.com/v6';

// Únicas monedas que le importan a Tripflow, más allá de la base (AGENTS.md §7).
const MONEDAS_RELEVANTES = ['USD', 'MXN', 'EUR'];

const respuestaJSON = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const base = url.searchParams.get('base');

  if (!base || typeof base !== 'string') {
    return respuestaJSON({ error: 'Falta el query param "base" (ej. ?base=COP).' }, 400);
  }

  const apiKey = env?.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    return respuestaJSON({ error: 'EXCHANGE_RATE_API_KEY no está configurada en el entorno.' }, 500);
  }

  let respuestaExchangeRate;
  try {
    respuestaExchangeRate = await fetch(
      `${EXCHANGE_RATE_URL_BASE}/${apiKey}/latest/${encodeURIComponent(base)}`
    );
  } catch (error) {
    return respuestaJSON({ error: `No se pudo contactar a ExchangeRate-API: ${error.message}` }, 502);
  }

  if (!respuestaExchangeRate.ok) {
    const detalle = await respuestaExchangeRate.text().catch(() => '');
    return respuestaJSON(
      { error: `ExchangeRate-API respondió ${respuestaExchangeRate.status}`, detalle },
      502
    );
  }

  const datos = await respuestaExchangeRate.json().catch(() => null);

  // La API responde 200 incluso en algunos casos de error (ej. rate limit,
  // moneda base inválida) con { result: "error", "error-type": "..." } —
  // hay que chequear "result" explícitamente, no solo el status HTTP.
  if (!datos || datos.result !== 'success' || !datos.conversion_rates) {
    return respuestaJSON(
      { error: `Respuesta inválida de ExchangeRate-API: ${datos?.['error-type'] ?? 'formato inesperado'}` },
      502
    );
  }

  const tasas = datos.conversion_rates;
  const resultado = {};
  for (const moneda of MONEDAS_RELEVANTES) {
    if (typeof tasas[moneda] === 'number') {
      resultado[moneda] = tasas[moneda];
    }
  }

  return respuestaJSON(resultado);
}

// Cualquier otro método: no soportado por este endpoint
export async function onRequestPost() {
  return respuestaJSON({ error: 'Usa GET con ?base=<MONEDA> (ej. ?base=COP).' }, 405);
}
