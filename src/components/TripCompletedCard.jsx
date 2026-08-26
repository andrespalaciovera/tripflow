import React from 'react';

/**
 * Formatea un número como moneda COP, sin decimales.
 * @param {number} valor - Monto a formatear
 * @returns {string} Monto formateado (ej. "$1.495.000")
 */
const formatearMoneda = (valor) => {
  const monto = Number.isFinite(valor) ? valor : 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(monto);
};

/**
 * Componente Organismo para mostrar un viaje ya finalizado (archivado) en el historial.
 * Tarjeta de solo lectura con opción de eliminar.
 *
 * @param {Object}   props                    - Propiedades del componente
 * @param {Object}   props.trip               - Datos del viaje
 * @param {string}   props.trip.id            - Identificador único del viaje
 * @param {string}   props.trip.destino       - Nombre del destino (ej. "España")
 * @param {number}   props.trip.presupuestoTotal - Presupuesto total del viaje en COP
 * @param {number}   props.totalGastado       - Suma final de gastos registrados
 * @param {Function} [props.onDelete]         - Callback al presionar "Eliminar" (recibe el id del viaje)
 */
export const TripCompletedCard = ({ trip, totalGastado, onDelete }) => {
  const { id, destino, presupuestoTotal } = trip;

  return (
    <div className="bg-status-finalizado-bg rounded-lg shadow-soft p-5 w-full max-w-md flex flex-col justify-between">
      {/* Encabezado: título del reporte y destino, apilados verticalmente */}
      <div className="mb-4">
        <h2 className="text-h2 font-display text-ink-primary">Reporte de gastos</h2>
        <h2 className="text-h2 font-display text-ink-primary">{destino}</h2>
      </div>

      {/* Fila de resumen: presupuesto vs. gasto total */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-label font-body text-ink-muted">Presupuesto</p>
          <p className="text-body font-body text-ink-primary">{formatearMoneda(presupuestoTotal)}</p>
        </div>
        <div>
          <p className="text-label font-body text-ink-muted">Gasto total</p>
          <p className="text-body font-body text-ink-primary">{formatearMoneda(totalGastado)}</p>
        </div>
      </div>

      {/* Botón de eliminar — mismo patrón visual que TripComingCard */}
      {onDelete && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="flex items-center gap-1.5 text-alert-max text-label font-body font-semibold transition-opacity hover:opacity-80 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default TripCompletedCard;
