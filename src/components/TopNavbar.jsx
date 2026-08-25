import React, { useState } from 'react';
import CurrencySwitch from './CurrencySwitch';
import Button from './Button';

/**
 * Componente de Barra de Navegación Superior (TopNavbar) para Tripflow.
 * El interruptor de moneda se oculta en móvil (hidden md:flex) porque en
 * pantallas pequeñas lo gestiona MobileBottomBar.
 *
 * @param {Object}   props                    - Propiedades del componente
 * @param {Function} [props.onCurrencyChange] - Callback al cambiar de moneda. Recibe true si es COP.
 * @param {boolean}  [props.hasTrips=true]     - Si no hay ningún viaje, el botón "+ Nuevo viaje" no se
 *                                                renderiza en ningún viewport (el estado vacío tiene su
 *                                                propio CTA centrado). El interruptor de moneda sigue
 *                                                visible siempre, según el Figma de referencia.
 * @param {boolean}  [props.defaultIsCop=true] - Estado inicial del interruptor
 * @param {string}   [props.className='']      - Clases adicionales opcionales
 */
export const TopNavbar = ({
  onCurrencyChange,
  onNewTrip,
  hasTrips = true,
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

      {/* Acciones derechas: solo visibles en escritorio.
          En móvil, MobileBottomBar asume ambas funciones. */}
      <div className="hidden md:flex items-center gap-4">
        <CurrencySwitch activo={esCop} alCambiar={manejarCambioMoneda} />
        {hasTrips && (
          <Button variant="primary" onClick={onNewTrip}>
            + Nuevo viaje
          </Button>
        )}
      </div>
    </nav>
  );
};

export default TopNavbar;
