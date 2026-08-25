// Lógica de negocio y matemática de presupuesto (AGENTS.md, sección 3).
//
// Regla de separación (no negociable): los componentes son presentacionales;
// toda la lógica de negocio vive aquí. Estas funciones son puras — reciben
// datos por parámetro y devuelven valores, sin importar componentes ni
// llamar a /lib/store.js.

// --- Fechas y duración del viaje --------------------------------------------

/**
 * Convierte una fecha "YYYY-MM-DD" (como se guardan fecha_inicio/fecha_fin,
 * AGENTS.md §3) en un Date a medianoche LOCAL.
 *
 * `new Date("YYYY-MM-DD")` es una trampa clásica: el formato "date-only" de
 * ese constructor lo interpreta como medianoche UTC, no medianoche local. En
 * cualquier huso horario con offset negativo (ej. Colombia, UTC-5) eso cae en
 * las 7pm del día ANTERIOR en hora local — y un .setHours(0,0,0,0) posterior
 * fija esa fecha ya corrida al día equivocado, mientras que `new Date()` para
 * "hoy" sí se calcula en hora local sin ese desfase. Esa asimetría es la que
 * hacía que calcularDiaActual contara un día de más. Construir el Date con
 * los componentes numéricos (año, mes, día) evita el parseo de string por
 * completo: ese constructor SIEMPRE usa hora local.
 * @param {string} fechaStr - Fecha en formato "YYYY-MM-DD"
 * @returns {Date} Medianoche local de esa fecha
 */
const parsearFechaLocal = (fechaStr) => {
  const [year, month, day] = fechaStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Calcula el número de días completos entre dos fechas (inclusivo).
 * Se normalizan ambas fechas a medianoche para evitar desfases por horas.
 * @param {string} fechaInicioStr - "YYYY-MM-DD"
 * @param {string} fechaFinStr - "YYYY-MM-DD"
 * @returns {number} Total de días del viaje (mínimo 1)
 */
export const calcularDiasTotales = (fechaInicioStr, fechaFinStr) => {
  const inicio = parsearFechaLocal(fechaInicioStr);
  const fin = parsearFechaLocal(fechaFinStr);
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
 * @param {string} fechaInicioStr - "YYYY-MM-DD"
 * @param {number} diasTotales
 * @returns {number} Día actual del viaje
 */
export const calcularDiaActual = (fechaInicioStr, diasTotales) => {
  const hoy = new Date();
  const inicio = parsearFechaLocal(fechaInicioStr);
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
 * @param {string} fechaInicioStr - "YYYY-MM-DD"
 * @returns {number} Días faltantes (mínimo 0)
 */
export const calcularDiasFaltantes = (fechaInicioStr) => {
  const hoy = new Date();
  const inicio = parsearFechaLocal(fechaInicioStr);
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

// --- Coloreado de riesgo de gastos guardados (AGENTS.md §3) -----------------
// Distinta de calcularImpactoGasto/Regla del 69% de arriba: esta es retroactiva
// (colorea gastos ya guardados en "Gastos recientes") y se mide contra el
// presupuesto diario FIJO del viaje (calcularPresupuestoDiario), no contra el
// presupuesto diario restante que fluctúa con cada nuevo gasto. Por eso el
// color de un gasto, una vez calculado, nunca cambia después.

/**
 * Nivel de riesgo (color de acento de ExpenseRow) de un gasto ya guardado,
 * según qué tan grande es frente al presupuesto diario FIJO del viaje
 * (AGENTS.md §3: "Expense risk coloring").
 * @param {number} montoLocal - Monto del gasto en la moneda LOCAL del viaje
 * @param {string} pais - País del viaje, para convertir el monto a COP
 * @param {number} presupuestoDiarioFijo - Presupuesto diario fijo del viaje, en COP
 *   (ver calcularPresupuestoDiario: presupuesto_total / duración, no fluctúa)
 * @returns {'low' | 'medium' | 'high'}
 */
export const calcularNivelRiesgoGasto = (montoLocal, pais, presupuestoDiarioFijo) => {
  if (presupuestoDiarioFijo <= 0) return 'high';

  const montoEnCop = convertirLocalACOP(montoLocal, pais);
  const porcentaje = (montoEnCop / presupuestoDiarioFijo) * 100;

  if (porcentaje <= 40) return 'low';
  if (porcentaje <= 70) return 'medium';
  return 'high';
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
  const inicio = parsearFechaLocal(trip.fecha_inicio);
  const fin = parsearFechaLocal(trip.fecha_fin);
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

/**
 * Moneda en la que normalmente se factura cada uno de los 7 países del modelo
 * de datos real (AGENTS.md §7). Usada para derivar Trip.moneda a partir del
 * país elegido al crear un viaje.
 */
const MONEDA_POR_PAIS = {
  'Estados Unidos': 'USD',
  México: 'MXN',
  Colombia: 'COP',
  España: 'EUR',
  Francia: 'EUR',
  Alemania: 'EUR',
  Italia: 'EUR',
};

/**
 * Deriva la moneda de un viaje a partir del país seleccionado (AGENTS.md §3:
 * Trip.moneda "derived from country"). Si el país no está en la tabla, se
 * asume COP.
 * @param {string} pais - Nombre exacto del país (ver MONEDA_POR_PAIS)
 * @returns {string} Código de moneda (ej. "USD", "EUR", "COP")
 */
export const derivarMonedaDesdePais = (pais) => MONEDA_POR_PAIS[pais] ?? 'COP';

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
 * Convierte un monto en la moneda LOCAL de un país a COP (multiplica por la
 * tasa), usando tasas fijas (MVP). Si el país no está en la tabla, se asume
 * tasa 1 y se registra un console.warn para que un país mal escrito o
 * faltante no pase inadvertido en desarrollo.
 *
 * Dirección confirmada en TASAS_CONVERSION_COP: "1 unidad de moneda local =
 * tasa COP" (ej. 1 EUR = 4300 COP) — por eso esta conversión multiplica.
 * Antes se llamaba "convertirAMonedaLocal", un nombre que sugería la
 * dirección contraria a su propio comportamiento; se renombra aquí para que
 * el nombre coincida con la operación real.
 *
 * @param {number} montoLocal - Monto en la moneda local del país
 * @param {string} pais - Nombre exacto del país (ver TASAS_CONVERSION_COP)
 * @param {Record<string, number>} [tasas=TASAS_CONVERSION_COP] - Tabla de tasas a usar
 * @returns {number} Monto equivalente en COP
 */
export const convertirLocalACOP = (montoLocal, pais, tasas = TASAS_CONVERSION_COP) => {
  const tasa = tasas[pais];

  if (tasa === undefined) {
    console.warn(`convertirLocalACOP: país "${pais}" no encontrado en la tabla de tasas, usando tasa 1.`);
    return Number(montoLocal) * 1;
  }

  return Number(montoLocal) * tasa;
};

/**
 * Convierte un monto en COP a la moneda LOCAL de un país (divide por la
 * tasa) — la conversión inversa de convertirLocalACOP. Usada, por ejemplo,
 * para la vista previa de NewTripDrawer ("a cuánto equivale este presupuesto
 * en COP dentro de la moneda del destino").
 *
 * @param {number} montoCOP - Monto en COP
 * @param {string} pais - Nombre exacto del país (ver TASAS_CONVERSION_COP)
 * @param {Record<string, number>} [tasas=TASAS_CONVERSION_COP] - Tabla de tasas a usar
 * @returns {number} Monto equivalente en la moneda local del país
 */
export const convertirCOPaLocal = (montoCOP, pais, tasas = TASAS_CONVERSION_COP) => {
  const tasa = tasas[pais];

  if (tasa === undefined) {
    console.warn(`convertirCOPaLocal: país "${pais}" no encontrado en la tabla de tasas, usando tasa 1.`);
    return Number(montoCOP) * 1;
  }

  return Number(montoCOP) / tasa;
};

/**
 * Suma los gastos de un viaje, convirtiendo cada uno a COP antes de sumar
 * (Expense.monto siempre está en la moneda LOCAL del viaje — AGENTS.md §3 —
 * nunca en COP). Fuente única para cualquier totalGastado en COP: nunca sumar
 * los "monto" crudos directamente.
 * @param {Array<{monto: number}>} gastos - Gastos del viaje (Expense[], monto en moneda local)
 * @param {string} pais - País del viaje, para la tasa de conversión
 * @returns {number} Total gastado, en COP
 */
export const calcularTotalGastadoEnCop = (gastos, pais) =>
  gastos.reduce((suma, gasto) => suma + convertirLocalACOP(gasto.monto, pais), 0);

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

/**
 * Formatea un monto ya expresado en COP, respetando el interruptor "Mostrar
 * resultados en COP" de TopNavbar: si está activo, se muestra en COP; si no,
 * se convierte a la moneda local del país y se muestra con su código de
 * moneda (nunca un sufijo "COP" fijo). Fuente única para TripActiveCard y la
 * lista de "Gastos recientes" en Dashboard, para que ambos respeten siempre
 * el mismo interruptor de la misma manera.
 * @param {number} valorEnCop - Monto ya calculado en COP
 * @param {string} pais - País del viaje, para convertir si el interruptor está apagado
 * @param {boolean} mostrarEnCop - Estado del interruptor de moneda
 * @returns {string} Monto formateado (ej. "$1.495.000" o "$1,510 EUR")
 */
export const formatearMontoSegunModoMoneda = (valorEnCop, pais, mostrarEnCop) => {
  if (mostrarEnCop) return formatearMoneda(valorEnCop);

  const montoLocal = convertirCOPaLocal(valorEnCop, pais);
  const moneda = derivarMonedaDesdePais(pais);
  return `$${montoLocal.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${moneda}`;
};

// --- Validación (dev only) ---------------------------------------------------
// Ejemplo de España usado en el diseño original: presupuesto_total 6.500.000,
// gasto acumulado 1.495.000 → "Día 2 de 6" y ≈23% gastado.

// Formatea un Date como "YYYY-MM-DD" usando componentes LOCALES (no
// toISOString, que es UTC y podría correr la fecha un día cerca de
// medianoche) — mismo formato que fecha_inicio/fecha_fin realmente guardan.
const _formatearFechaLocal = (date) => {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const _hoyLocal = new Date();
const _fechaInicioEjemplo = _formatearFechaLocal(
  new Date(_hoyLocal.getFullYear(), _hoyLocal.getMonth(), _hoyLocal.getDate() - 1)
);
const _fechaFinEjemplo = _formatearFechaLocal(
  new Date(_hoyLocal.getFullYear(), _hoyLocal.getMonth(), _hoyLocal.getDate() + 4)
);

const _diasTotalesEjemplo = calcularDiasTotales(_fechaInicioEjemplo, _fechaFinEjemplo);
const _diaActualEjemplo = calcularDiaActual(_fechaInicioEjemplo, _diasTotalesEjemplo);
const _porcentajeGastadoEjemplo = calcularPorcentajeGastado(6500000, 1495000);

console.assert(_diasTotalesEjemplo === 6, `calcularDiasTotales: se esperaban 6 días, se obtuvo ${_diasTotalesEjemplo}`);
console.assert(_diaActualEjemplo === 2, `calcularDiaActual: se esperaba el día 2, se obtuvo ${_diaActualEjemplo}`);
console.assert(
  Math.round(_porcentajeGastadoEjemplo) === 23,
  `calcularPorcentajeGastado: se esperaba ≈23%, se obtuvo ${_porcentajeGastadoEjemplo}%`
);

// Regresión del bug de zona horaria: viaje de 2 días que empieza HOY debe
// mostrar "Día 1 de 2" en el primer día, no "Día 2 de 2" (ver parsearFechaLocal).
const _fechaInicioHoy = _formatearFechaLocal(_hoyLocal);
const _fechaFinManana = _formatearFechaLocal(
  new Date(_hoyLocal.getFullYear(), _hoyLocal.getMonth(), _hoyLocal.getDate() + 1)
);
const _diasTotalesViajeCorto = calcularDiasTotales(_fechaInicioHoy, _fechaFinManana);
const _diaActualViajeCorto = calcularDiaActual(_fechaInicioHoy, _diasTotalesViajeCorto);
console.assert(
  _diaActualViajeCorto === 1,
  `calcularDiaActual: viaje que empieza hoy debería estar en el día 1, se obtuvo ${_diaActualViajeCorto}`
);

// Dirección de conversión: 1 EUR = 4300 COP (tabla TASAS_CONVERSION_COP)
console.assert(
  convertirLocalACOP(1, 'España') === 4300,
  `convertirLocalACOP: se esperaba 4300, se obtuvo ${convertirLocalACOP(1, 'España')}`
);
console.assert(
  convertirCOPaLocal(4300, 'España') === 1,
  `convertirCOPaLocal: se esperaba 1, se obtuvo ${convertirCOPaLocal(4300, 'España')}`
);
