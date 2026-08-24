import React from 'react';

/**
 * Mapeo de estilos y etiquetas por defecto para los distintos estados.
 */
const ESTADOS = {
  activo: {
    clases: 'bg-pills text-status-activo-text',
    etiquetaDefecto: 'Activo',
    tienePunto: true,
  },
  proximo: {
    clases: 'bg-pills text-status-proximo-text',
    etiquetaDefecto: 'Próximo',
    tienePunto: false,
  },
  finalizado: {
    clases: 'bg-pills text-status-finalizado-text',
    etiquetaDefecto: 'Finalizado',
    tienePunto: false,
  },
};

/**
 * Componente reutilizable StatusBadge para la aplicación Tripflow.
 *
 * @param {Object} props - Propiedades del componente
 * @param {'activo' | 'proximo' | 'finalizado'} props.status - Estado actual del viaje
 * @param {string} [props.label] - Etiqueta de texto opcional para sobrescribir el valor por defecto
 * @param {string} [props.className=''] - Clases CSS opcionales para extender estilos
 */
export const StatusBadge = ({
  status,
  label,
  className = '',
}) => {
  // Obtener la configuración del estado correspondiente (por defecto usa 'activo' si no coincide)
  const configuracion = ESTADOS[status] || ESTADOS.activo;
  const textoAMostrar = label || configuracion.etiquetaDefecto;

  // Clases compuestas para el badge
  const clasesCompuestas = [
    'inline-flex items-center justify-center rounded-full px-3 py-1 text-label font-body font-semibold select-none gap-2',
    configuracion.clases,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={clasesCompuestas}>
      {/* Indicador de punto sólido solo para el estado activo */}
      {configuracion.tienePunto && (
        <span className="w-2 h-2 rounded-full bg-status-activo-text" />
      )}
      {textoAMostrar}
    </span>
  );
};

export default StatusBadge;
