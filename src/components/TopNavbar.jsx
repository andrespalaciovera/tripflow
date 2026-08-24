import React, { useState } from 'react';

/**
 * Componente local para el Interruptor (Switch) de Moneda.
 * Utiliza el patrón accesible estándar: botón externo (pill) + span interno (knob).
 *
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.activo - Si el modo COP está activo
 * @param {Function} props.alCambiar - Función callback al alternar el estado
 */
const SwitchMoneda = ({ activo, alCambiar }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Etiqueta de moneda */}
      <span className="text-body font-body text-ink-primary select-none">
        COP
      </span>

      {/* Botón exterior (Pill) — posicionamiento relativo para contener el knob */}
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={alCambiar}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          activo ? 'bg-ink-primary' : 'bg-btn-disable'
        }`}
      >
        {/* Círculo interior (Knob) — se desliza horizontalmente dentro del pill */}
        <span
          className={`inline-block h-4 w-4 rounded-full bg-bg-surface transition-transform duration-200 ease-in-out ${
            activo ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

/**
 * Componente de Barra de Navegación Superior (TopNavbar) para Tripflow.
 *
 * @param {Object} props - Propiedades del componente
 * @param {Function} [props.onCurrencyChange] - Callback ejecutado al cambiar de moneda. Recibe true si es COP.
 * @param {boolean} [props.defaultIsCop=true] - Estado por defecto del interruptor
 * @param {string} [props.className=''] - Clases de estilo adicionales opcionales
 */
export const TopNavbar = ({
  onCurrencyChange,
  defaultIsCop = true,
  className = '',
}) => {
  const [esCop, setEsCop] = useState(defaultIsCop);

  const manejarCambioMoneda = () => {
    const nuevoEstado = !esCop;
    setEsCop(nuevoEstado);
    if (onCurrencyChange) {
      onCurrencyChange(nuevoEstado);
    }
  };

  return (
    <nav
      className={`w-full flex justify-between items-center bg-bg-navbar-forms px-4 py-4 md:px-6 border-b border-stroke-form ${className}`}
    >
      {/* Logotipo de la aplicación */}
      <span className="font-display text-h2 text-ink-primary select-none">
        Tripflow
      </span>

      {/* Interruptor de conversión de moneda */}
      <SwitchMoneda activo={esCop} alCambiar={manejarCambioMoneda} />
    </nav>
  );
};

export default TopNavbar;
