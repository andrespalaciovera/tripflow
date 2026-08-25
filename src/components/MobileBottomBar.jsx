  import React from 'react';
  import Button from './Button';
  import CurrencySwitch from './CurrencySwitch';

  /**
   * Barra de acciones fija en la parte inferior de la pantalla — solo visible en móvil.
   * En escritorio queda completamente oculta (md:hidden).
   *
   * Caso 1 — hasActiveTrip = true:
   *   Botón "Agregar gastos" (flex-1) + CurrencySwitch con etiqueta "COP".
   *
   * Caso 2 — hasActiveTrip = false:
   *   Un único botón "Agregar nuevo viaje" a ancho completo.
   *
   * @param {Object}   props                  - Propiedades del componente
   * @param {boolean}  props.hasAnyTrips      - Indica si el usuario tiene algún viaje
   * @param {boolean}  props.hasActiveTrip    - Indica si existe un viaje Activo
   * @param {boolean}  props.hideBar          - Cuando true, la barra se desliza fuera del viewport
   * @param {Function} props.onAddExpense     - Abre el formulario de agregar gastos
   * @param {Function} props.onNewTrip        - Abre el drawer de nuevo viaje
   * @param {boolean}  props.isCop            - Estado actual del interruptor de moneda
   * @param {Function} props.onCurrencyChange - Callback al alternar el interruptor
   */
  const MobileBottomBar = ({
    hasAnyTrips,
    hasActiveTrip,
    hideBar = false,
    onAddExpense,
    onNewTrip,
    isCop,
    onCurrencyChange,
  }) => {
    // Sin viajes: la barra no existe en absoluto (el onboarding tiene su propio CTA)
    if (!hasAnyTrips) return null;

    return (
      // pb-safe usa padding-bottom seguro en dispositivos con home bar (iOS/Android).
      // z-40 para quedar por encima del contenido normal pero debajo del drawer (z-50).
      // translate-y-full desliza la barra completamente fuera del viewport hacia abajo;
      // translate-y-0 la devuelve a su posición normal. La transición es suave (300 ms).
      <div
        className={`fixed bottom-0 left-0 w-full z-40 bg-bg-body border-t border-stroke-form p-4 md:hidden pb-safe
          transition-transform duration-300 ease-in-out
          ${hideBar ? 'translate-y-full' : 'translate-y-0'}`}
      >
        {hasActiveTrip ? (
          /* ─── Caso 1: Viaje Activo ─── */
          <div className="flex justify-between items-center gap-4">
            {/* Botón principal de acción — ocupa todo el espacio disponible */}
            <Button
              variant="primary"
              className="flex-1"
              onClick={onAddExpense}
            >
              Agregar gastos
            </Button>

            {/* Interruptor de moneda: "COP" + toggle — compacto a la derecha */}
            <CurrencySwitch activo={isCop} alCambiar={onCurrencyChange} />
          </div>
        ) : (
          /* ─── Caso 2: Sin viaje Activo ─── */
          <Button
            variant="primary"
            className="w-full"
            onClick={onNewTrip}
          >
            Agregar nuevo viaje
          </Button>
        )}
      </div>
    );
  };

  export default MobileBottomBar;

