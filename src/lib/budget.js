// Lógica de negocio y matemática de presupuesto (AGENTS.md, sección 3).
//
// Regla de separación (no negociable): los componentes son presentacionales;
// toda la lógica de negocio vive aquí. Estas funciones son puras — reciben
// datos por parámetro y devuelven valores, sin importar componentes ni
// llamar a /lib/store.js.

// --- Fechas y duración del viaje --------------------------------------------

/**
 * Calcula el número de días completos entre dos fechas (inclusivo).
 * Se normalizan ambas fechas a medianoche para evitar desfases por horas.
 * @param {string|Date} fechaInicioStr
 * @param {string|Date} fechaFinStr
 * @returns {number} Total de días del viaje (mínimo 1)
 */
export const calcularDiasTotales = (fechaInicioStr, fechaFinStr) => {
  const inicio = new Date(fechaInicioStr);
  const fin = new Date(fechaFinStr);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  const diferenciaMilisegundos = fin.getTime() - inicio.getTime();
  const dias = Math.round(diferenciaMilisegundos / (1000 * 3600 * 24)) + 1;

  // Un viaje siempre dura al menos 1 día
  return Math.max(1, dias);
};

/**
 * Calcula el día actual del viaje (día 1 = fecha de inicio).
 * Se acota entre 1 y diasTotales para que nunca se salga del rango del viaje.
 * @param {string|Date} fechaInicioStr
 * @param {number} diasTotales
 * @returns {number} Día actual del viaje
 */
export const calcularDiaActual = (fechaInicioStr, diasTotales) => {
  const hoy = new Date();
  const inicio = new Date(fechaInicioStr);
  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);

  const diferenciaMilisegundos = hoy.getTime() - inicio.getTime();
  const diasTranscurridos = Math.floor(diferenciaMilisegundos / (1000 * 3600 * 24)) + 1;

  // Se acota entre el día 1 y el último día del viaje
  return Math.min(Math.max(1, diasTranscurridos), diasTotales);
};

/**
 * Días que faltan para que comience un viaje "Próximo" (0 si ya debería haber
 * comenzado). Usada por la cuenta regresiva de TripComingCard.jsx.
 * @param {string|Date} fechaInicioStr
 * @returns {number} Días faltantes (mínimo 0)
 */
export const calcularDiasFaltantes = (fechaInicioStr) => {
  const hoy = new Date();
  const inicio = new Date(fechaInicioStr);
  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);

  const diferenciaMilisegundos = inicio.getTime() - hoy.getTime();
  const dias = Math.ceil(diferenciaMilisegundos / (1000 * 3600 * 24));

  // Evita valores negativos si el viaje ya debería haber comenzado
  return Math.max(0, dias);
};

// --- Presupuesto --------------------------------------------------------

/**
 * Presupuesto diario "de referencia": el presupuesto total repartido en partes
 * iguales entre todos los días del viaje (no descuenta lo ya gastado).
 * @param {number} presupuestoTotal
 * @param {number} diasTotales
 * @returns {number}
 */
export const calcularPresupuestoDiario = (presupuestoTotal, diasTotales) =>
  diasTotales > 0 ? presupuestoTotal / diasTotales : 0;

/**
 * Presupuesto que queda del total, después de restar lo ya gastado.
 * @param {number} presupuestoTotal
 * @param {number} totalGastado
 * @returns {number}
 */
export const calcularPresupuestoRestante = (presupuestoTotal, totalGastado) =>
  presupuestoTotal - totalGastado;

/**
 * Presupuesto diario restante: lo que queda del presupuesto repartido entre los
 * días que faltan del viaje (incluyendo hoy). Es el valor mostrado en
 * "Cada día restante puedes gastar".
 * @param {number} presupuestoRestante
 * @param {number} diasRestantesConHoy
 * @returns {number}
 */
export const calcularPresupuestoDiarioRestante = (presupuestoRestante, diasRestantesConHoy) =>
  diasRestantesConHoy > 0 ? presupuestoRestante / diasRestantesConHoy : presupuestoRestante;

/**
 * Porcentaje del presupuesto total ya gastado, acotado a [0, 100] para no
 * desbordar el anillo SVG de progreso.
 * @param {number} presupuestoTotal
 * @param {number} totalGastado
 * @returns {number} Porcentaje entre 0 y 100
 */
export const calcularPorcentajeGastado = (presupuestoTotal, totalGastado) => {
  const porcentajeReal = presupuestoTotal > 0 ? (totalGastado / presupuestoTotal) * 100 : 0;
  return Math.min(100, Math.max(0, porcentajeReal));
};

// --- "¿Puedo pagar esto?" (Regla del 69%, AGENTS.md §3) --------------------

/** Umbral de la Regla del 69%: por encima de este % del presupuesto diario, el gasto es riesgoso */
const UMBRAL_GASTO_RIESGOSO = 69;

/**
 * Calcula el impacto de un gasto puntual sobre el presupuesto diario y total,
 * y si resulta riesgoso según la Regla del 69% (AGENTS.md §3): un gasto que
 * supere el 69% del presupuesto diario restante se considera riesgoso.
 * @param {number} presupuestoDiario - Presupuesto diario restante disponible
 * @param {number} presupuestoTotal
 * @param {number} valorEnCop - Monto del gasto a evaluar, ya convertido a COP
 * @returns {{ porcentajeDiario: number, porcentajeTotal: number, riesgoso: boolean }}
 */
export const calcularImpactoGasto = (presupuestoDiario, presupuestoTotal, valorEnCop) => {
  const porcentajeDiario = presupuestoDiario > 0 ? Math.round((valorEnCop / presupuestoDiario) * 100) : 0;
  const porcentajeTotal = presupuestoTotal > 0 ? Math.round((valorEnCop / presupuestoTotal) * 100) : 0;
  const riesgoso = porcentajeDiario > UMBRAL_GASTO_RIESGOSO;

  return { porcentajeDiario, porcentajeTotal, riesgoso };
};

// --- Estado del viaje y presupuesto sugerido (AGENTS.md §3) -----------------

/**
 * Deriva el estado de un viaje. Nunca es un campo propio guardado: siempre se
 * calcula a partir de finalizado_manualmente y las fechas del viaje.
 * @param {Object} trip - Modelo Trip (AGENTS.md §3): usa fecha_inicio, fecha_fin
 *   y finalizado_manualmente
 * @returns {'proximo' | 'activo' | 'finalizado'}
 */
export const calcularEstadoViaje = (trip) => {
  if (trip.finalizado_manualmente) return 'finalizado';

  const hoy = new Date();
  const inicio = new Date(trip.fecha_inicio);
  const fin = new Date(trip.fecha_fin);
  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  if (hoy < inicio) return 'proximo';
  if (hoy > fin) return 'finalizado';
  return 'activo';
};

/**
 * Presupuesto sugerido al crear un viaje, según su motivo (AGENTS.md §3).
 * El campo sigue siendo editable — esto solo pre-llena un valor inicial.
 * @param {'vacaciones' | 'negocios'} motivo
 * @param {number} diasTotales
 * @returns {number} Presupuesto sugerido en COP
 */
export const obtenerPresupuestoSugerido = (motivo, diasTotales) =>
  diasTotales * (motivo === 'negocios' ? 250000 : 150000);

// --- Conversión de moneda (MVP, tasas fijas) --------------------------------

/**
 * Tasas de conversión fijas (MVP): cuántos COP equivalen a 1 unidad de la
 * moneda local de cada país, usando exactamente los 7 nombres de país del
 * modelo de datos real (AGENTS.md §7). Colombia ya está en COP (tasa 1).
 */
export const TASAS_CONVERSION_COP = {
  'Estados Unidos': 4000,
  México: 230,
  Colombia: 1,
  España: 4300,
  Francia: 4300,
  Alemania: 4300,
  Italia: 4300,
};

/**
 * Convierte un monto en la moneda local de un país a COP, usando tasas fijas
 * (MVP). Si el país no está en la tabla, se asume tasa 1 y se registra un
 * console.warn para que un país mal escrito o faltante no pase inadvertido
 * en desarrollo.
 *
 * Nota de nombre: pese a llamarse "convertirAMonedaLocal", esta función
 * reproduce el comportamiento ya existente en TripActiveCard.jsx antes del
 * refactor: recibe un monto en moneda LOCAL y devuelve su equivalente en COP
 * (no al revés). Se conserva el nombre pedido; la conversión real por API
 * queda fuera de alcance de este cambio.
 *
 * @param {number} monto - Monto en la moneda local del país
 * @param {string} pais - Nombre exacto del país (ver TASAS_CONVERSION_COP)
 * @param {Record<string, number>} [tasas=TASAS_CONVERSION_COP] - Tabla de tasas a usar
 * @returns {number} Monto equivalente en COP
 */
export const convertirAMonedaLocal = (monto, pais, tasas = TASAS_CONVERSION_COP) => {
  const tasa = tasas[pais];

  if (tasa === undefined) {
    console.warn(`convertirAMonedaLocal: país "${pais}" no encontrado en la tabla de tasas, usando tasa 1.`);
    return Number(monto) * 1;
  }

  return Number(monto) * tasa;
};

// --- Formato ----------------------------------------------------------------

/**
 * Formatea un número como moneda COP, sin decimales.
 * @param {number} valor - Monto a formatear
 * @returns {string} Monto formateado (ej. "$1.495.000")
 */
export const formatearMoneda = (valor) => {
  const monto = Number.isFinite(valor) ? valor : 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(monto);
};

// --- Validación (dev only) ---------------------------------------------------
// Ejemplo de España usado en el diseño original: presupuesto_total 6.500.000,
// gasto acumulado 1.495.000 → "Día 2 de 6" y ≈23% gastado.

const HOY_MS = 24 * 60 * 60 * 1000;
const _fechaInicioEjemplo = new Date(Date.now() - 1 * HOY_MS).toISOString();
const _fechaFinEjemplo = new Date(Date.now() + 4 * HOY_MS).toISOString();

const _diasTotalesEjemplo = calcularDiasTotales(_fechaInicioEjemplo, _fechaFinEjemplo);
const _diaActualEjemplo = calcularDiaActual(_fechaInicioEjemplo, _diasTotalesEjemplo);
const _porcentajeGastadoEjemplo = calcularPorcentajeGastado(6500000, 1495000);

console.assert(_diasTotalesEjemplo === 6, `calcularDiasTotales: se esperaban 6 días, se obtuvo ${_diasTotalesEjemplo}`);
console.assert(_diaActualEjemplo === 2, `calcularDiaActual: se esperaba el día 2, se obtuvo ${_diaActualEjemplo}`);
console.assert(
  Math.round(_porcentajeGastadoEjemplo) === 23,
  `calcularPorcentajeGastado: se esperaba ≈23%, se obtuvo ${_porcentajeGastadoEjemplo}%`
);
