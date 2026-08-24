import React from 'react';

/**
 * Mapeo de colores para la barra de acento del nivel de riesgo.
 */
const COLORES_RIESGO = {
  low: 'bg-alert-min',
  medium: 'bg-alert-medium',
  high: 'bg-alert-max',
};

/**
 * Componente reutilizable ExpenseRow para mostrar filas de gastos individuales.
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.description - Descripción o nombre del gasto (ej. "Almuerzo")
 * @param {string|number} props.amount - Monto formateado del gasto (ej. "$80.000 COP")
 * @param {string} props.relativeTime - Tiempo transcurrido (ej. "hace 1d")
 * @param {'low' | 'medium' | 'high'} [props.riskLevel='low'] - Nivel de riesgo del gasto en relación al presupuesto diario
 * @param {string} [props.className=''] - Clases CSS adicionales opcionales
 */
export const ExpenseRow = ({
  description,
  amount,
  relativeTime,
  riskLevel = 'low',
  className = '',
}) => {
  // Obtener color correspondiente al nivel de riesgo
  const colorBarraAcento = COLORES_RIESGO[riskLevel] || COLORES_RIESGO.low;

  return (
    <div
      className={`w-full flex justify-between items-center bg-list-item rounded-sm relative overflow-hidden py-3 pr-4 pl-6 ${className}`}
    >
      {/* Barra lateral de acento de riesgo absoluta en el extremo izquierdo */}
      <span className={`absolute left-0 top-0 bottom-0 w-2 ${colorBarraAcento}`} />

      {/* Contenido Izquierdo: Descripción del gasto */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-body text-body text-ink-primary truncate select-none">
          {description}
        </p>
      </div>

      {/* Contenido Derecho: Monto y tiempo relativo */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {/* Pastilla de Monto */}
        <span className="bg-surface rounded-full px-2.5 py-0.5 text-label font-body text-ink-primary font-semibold select-none shadow-soft">
          {amount}
        </span>
        {/* Tiempo transcurrido */}
        <span className="text-label font-body text-ink-muted select-none">
          {relativeTime}
        </span>
      </div>
    </div>
  );
};

export default ExpenseRow;
