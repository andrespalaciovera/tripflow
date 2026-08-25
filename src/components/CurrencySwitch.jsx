import React from 'react';

/**
 * Átomo reutilizable: Interruptor (Switch) de Moneda.
 * Extraído de TopNavbar para poder compartirse con MobileBottomBar.
 * Utiliza el patrón accesible estándar: botón exterior (pill) + span interior (knob).
 *
 * @param {Object}   props           - Propiedades del componente
 * @param {boolean}  props.activo    - Si el modo COP está activo
 * @param {Function} props.alCambiar - Callback al alternar el estado
 */
const CurrencySwitch = ({ activo, alCambiar }) => {
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

export default CurrencySwitch;
