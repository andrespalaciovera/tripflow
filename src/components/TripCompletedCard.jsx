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
 * Tarjeta de solo lectura, sin interacción: un resumen estático del reporte de gastos
 * con el tratamiento visual "inactivo/apagado" del estado finalizado.
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.trip - Datos del viaje
 * @param {string} props.trip.destino - Nombre del destino (ej. "España")
 * @param {number} props.trip.presupuestoTotal - Presupuesto total del viaje en COP
 * @param {number} props.totalGastado - Suma final de gastos registrados
 */
export const TripCompletedCard = ({ trip, totalGastado }) => {
  const { destino, presupuestoTotal } = trip;

  return (
    <div className="bg-status-finalizado-bg rounded-lg shadow-soft p-6 w-full max-w-md">
      {/* Encabezado: título del reporte y destino, apilados verticalmente */}
      <div className="mb-6">
        <h2 className="text-h2 font-display text-ink-primary">Reporte de gastos</h2>
        <h2 className="text-h2 font-display text-ink-primary">{destino}</h2>
      </div>

      {/* Fila de resumen: presupuesto vs. gasto total */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-label font-body text-ink-muted">Presupuesto</p>
          <p className="text-body font-body text-ink-primary">{formatearMoneda(presupuestoTotal)}</p>
        </div>
        <div>
          <p className="text-label font-body text-ink-muted">Gasto total</p>
          <p className="text-body font-body text-ink-primary">{formatearMoneda(totalGastado)}</p>
        </div>
      </div>
    </div>
  );
};

export default TripCompletedCard;
