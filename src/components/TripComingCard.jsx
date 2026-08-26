import React from 'react';
import StatusBadge from './StatusBadge';
import { calcularDiasFaltantes } from '../lib/budget';

/**
 * Componente Organismo para mostrar un viaje en estado "Próximo".
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.trip - Datos del viaje
 * @param {string} props.trip.id - Identificador único del viaje
 * @param {string} props.trip.destino - Nombre del destino (ej. "México")
 * @param {string} props.trip.motivo - Motivo del viaje ("Negocios" o "Vacaciones")
 * @param {number} props.trip.presupuesto - Presupuesto total en COP
 * @param {string} props.trip.fechaInicio - Fecha de inicio en formato ISO o YYYY-MM-DD
 * @param {Function} props.onDelete - Función callback al presionar el botón "Eliminar"
 */
export const TripComingCard = ({ trip, onDelete }) => {
  // Días faltantes: lógica de negocio compartida, ver /lib/budget.js
  const diasFaltantes = calcularDiasFaltantes(trip.fechaInicio);

  // Calcular el progreso visual asumiendo una ventana de 30 días
  // 30+ días = 0% de progreso (barra vacía)
  // 0 días = 100% de progreso (barra llena)
  const VENTANA_DIAS = 30;
  let progreso = 0;
  
  if (diasFaltantes <= 0) {
    progreso = 100;
  } else if (diasFaltantes < VENTANA_DIAS) {
    progreso = ((VENTANA_DIAS - diasFaltantes) / VENTANA_DIAS) * 100;
  }

  // Formatear el presupuesto a moneda COP
  const presupuestoFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(trip.presupuesto);

  return (
    <div className="bg-status-proximo-bg rounded-lg shadow-soft p-5 w-full max-w-md">
      {/* Encabezado: Estado y Motivo */}
      <div className="flex justify-between items-start">
        <StatusBadge status="proximo" />
        
        <div className="flex flex-col items-end text-right">
          <span className="text-label font-body text-ink-muted">
            Motivo de viaje
          </span>
          <span className="text-body font-body text-status-proximo-text capitalize">
            {trip.motivo}
          </span>
        </div>
      </div>

      {/* Divisor */}
      <hr className="border-t border-status-proximo-text opacity-20 my-5" />

      {/* Cuerpo principal: Destino, Presupuesto, Botón y Countdown */}
      <div className="flex justify-between items-end">
        
        {/* Columna Izquierda: Información del destino */}
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-h3 text-ink-primary">
            {trip.destino}
          </h3>
          <p className="text-body font-body text-ink-muted mb-3">
            {presupuestoFormateado} COP
          </p>
          
          <button 
            type="button"
            onClick={() => onDelete(trip.id)}
            className="flex items-center gap-1.5 text-alert-max text-label font-body font-semibold transition-opacity hover:opacity-80 focus:outline-none"
          >
            {/* Icono de Papelera (Trash) */}
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

        {/* Columna Derecha: Barra de progreso (Countdown) */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-label font-body text-ink-primary">
            Faltan {diasFaltantes} días
          </span>
          
          {/* Contenedor de la barra de progreso */}
          <div className="w-32 h-3 rounded-full bg-overlay-w overflow-hidden">
            <div 
              className="h-full bg-status-proximo-text rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default TripComingCard;
