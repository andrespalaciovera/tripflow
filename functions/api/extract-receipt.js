// Cloudflare Pages Function — proxia la extracción de datos de recibos a
// OpenRouter para que la API key nunca se exponga al cliente (AGENTS.md,
// sección 2). El único trabajo de esta función es: recibir una foto en
// base64, pedirle a un modelo con visión que extraiga monto y comercio, y
// devolver ese resultado como JSON — nunca guarda nada ni conoce el modelo
// Trip/Expense.
//
// Contrato con el cliente (elegido explícitamente sobre multipart/form-data:
// más simple de armar en el navegador — FileReader.readAsDataURL() entrega
// exactamente el string que este endpoint espera, sin ningún ensamblaje
// manual de FormData):
//   POST /api/extract-receipt
//   Body JSON: { "image": "data:image/jpeg;base64,...." }
//   Respuesta 200: { "monto": number | null, "comercio": string | null }

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Modelo de visión específico vía OpenRouter. Reemplazó al auto-router gratuito
// (openrouter/free) el 2026-08-25 por inconsistencias de latencia (9-40s)
// y extracciones nulas frecuentes durante las pruebas. El costo por llamada
// es insignificante dado el tamaño típico de un recibo. El gasto se controla
// con un límite de saldo por llave en la cuenta de OpenRouter.
const MODEL = 'google/gemini-2.5-flash';

const PROMPT = `Analiza esta foto de un recibo o factura y extrae exactamente dos datos:
1. monto: el monto TOTAL de la compra, como número (sin símbolos de moneda ni separadores de miles). Si no se ve con certeza, usa null.
2. comercio: el nombre del comercio o negocio, si es visible. Si no se ve, usa null.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin explicaciones, sin bloques de código markdown. Formato exacto:
{"monto": number o null, "comercio": string o null}`;

const RESPUESTA_VACIA = { monto: null, comercio: null };

const respuestaJSON = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * El contenido de un mensaje de chat completions puede venir como string o,
 * en algunos modelos de visión, como un arreglo de partes ({ type: 'text', text }).
 * Normaliza ambos casos a un único string de texto.
 */
const extraerTexto = (contenido) => {
  if (typeof contenido === 'string') return contenido;
  if (Array.isArray(contenido)) {
    return contenido
      .filter((parte) => parte?.type === 'text')
      .map((parte) => parte.text)
      .join('\n');
  }
  return '';
};

/**
 * Limpia el texto de salida del modelo (quita posibles fences de markdown
 * ```json ... ```) e intenta parsearlo como JSON. Si falla, devuelve
 * { monto: null, comercio: null } en lugar de lanzar — nunca debe tumbar
 * la función por una respuesta mal formada del modelo.
 */
const parsearRespuestaModelo = (textoCrudo) => {
  const texto = (textoCrudo || '').trim();
  if (!texto) return RESPUESTA_VACIA;

  const sinFences = texto
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parseado = JSON.parse(sinFences);
    const monto = typeof parseado.monto === 'number' && Number.isFinite(parseado.monto) ? parseado.monto : null;
    const comercio = typeof parseado.comercio === 'string' ? parseado.comercio : null;
    return { monto, comercio };
  } catch {
    return RESPUESTA_VACIA;
  }
};

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return respuestaJSON({ error: 'Body inválido: se esperaba JSON.' }, 400);
  }

  const image = body?.image;
  if (!image || typeof image !== 'string') {
    return respuestaJSON({ error: 'Falta el campo "image" (data URL en base64).' }, 400);
  }

  const apiKey = env?.OPENROUTER_API_KEY;
  if (!apiKey) {
    return respuestaJSON({ error: 'OPENROUTER_API_KEY no está configurada en el entorno.' }, 500);
  }

  let respuestaOpenRouter;
  try {
    respuestaOpenRouter = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    return respuestaJSON({ error: `No se pudo contactar a OpenRouter: ${error.message}` }, 502);
  }

  if (!respuestaOpenRouter.ok) {
    const detalle = await respuestaOpenRouter.text().catch(() => '');
    return respuestaJSON(
      { error: `OpenRouter respondió ${respuestaOpenRouter.status}`, detalle },
      502
    );
  }

  const datos = await respuestaOpenRouter.json();
  const contenido = datos?.choices?.[0]?.message?.content;
  const resultado = parsearRespuestaModelo(extraerTexto(contenido));

  return respuestaJSON(resultado);
}

// Cualquier otro método: no soportado por este endpoint
export async function onRequestGet() {
  return respuestaJSON({ error: 'Usa POST con { image } (data URL en base64) en el body.' }, 405);
}
