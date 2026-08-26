import React, { useEffect, useState } from 'react';

/**
 * Tabs component — exclusivo para móvil.
 * En escritorio este componente no se renderiza; el padre lo oculta con `md:hidden`.
 *
 * Recibe como children las tarjetas de viaje ya renderizadas (TripActiveCard,
 * TripComingCard, TripCompletedCard) y las distribuye en tres pestañas usando
 * el nombre de función del tipo de elemento para categorizar cada hijo.
 *
 * @param {Object}          props          - Propiedades del componente
 * @param {React.ReactNode} props.children - Tarjetas de viaje ya renderizadas
 */
const MobileSlider = ({ children, onTabChange }) => {
  // ─── Categorización de hijos ──────────────────────────────────────────────
  // Usamos el nombre de la función del tipo (`child.type.name`) para distinguir
  // las tres tarjetas sin añadir props extra ni modificar Dashboard.jsx.
  const allChildren = React.Children.toArray(children);

  const activeTrips    = allChildren.filter(c => c.type?.name === 'TripActiveCard');
  const comingTrips    = allChildren.filter(c => c.type?.name === 'TripComingCard');
  const endedTrips     = allChildren.filter(
    c => c.type?.name === 'TripCompletedCard' || c.type?.name === 'TripCompletedCardComponent'
  );

  // ─── Estado de la pestaña activa ──────────────────────────────────────────
  // Regla de selección inicial: si hay viaje activo, arranca en 'activo';
  // de lo contrario arranca en 'proximos'.
  const [activeTab, setActiveTab] = useState(
    activeTrips.length > 0 ? 'activo' : 'proximos'
  );

  // Notifica al padre (Dashboard) cada vez que la pestaña activa cambia,
  // incluido el montaje inicial, para que pueda reaccionar en la UI.
  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  // ─── Configuración de pestañas ────────────────────────────────────────────
  const tabs = [
    {
      key:   'activo',
      label: 'Activo',
      cards: activeTrips,
      empty: 'No hay ningún viaje activo.',
    },
    {
      key:   'proximos',
      label: 'Próximos',
      cards: comingTrips,
      empty: 'No hay viajes próximos.',
    },
    {
      key:   'finalizados',
      label: 'Finalizados',
      cards: endedTrips,
      empty: 'No hay viajes finalizados.',
    },
  ];

  const currentCards = tabs.find(t => t.key === activeTab)?.cards ?? [];
  const emptyMessage = tabs.find(t => t.key === activeTab)?.empty ?? '';

  return (
    <div className="w-full flex flex-col gap-3">

      {/* ── Barra de pestañas ─────────────────────────────────────────────── */}
      <nav
        className="flex items-end border-b border-stroke-form"
        role="tablist"
        aria-label="Filtrar viajes"
      >
        {tabs.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'flex-1 pb-2 text-body font-body transition-colors duration-200',
                isActive
                  ? 'text-ink-primary font-semibold border-b-2 border-ink-primary -mb-px'
                  : 'text-ink-muted hover:text-ink-primary',
              ].join(' ')}
            >
              {tab.label}
              {/* Contador de tarjetas junto al label — sólo cuando hay ítems */}
              {tab.cards.length > 0 && (
                <span
                  className={[
                    'ml-1 text-label',
                    isActive ? 'text-ink-primary' : 'text-ink-muted',
                  ].join(' ')}
                >
                  ({tab.cards.length})
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Contenido de la pestaña activa ───────────────────────────────── */}
      <div
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className={[
          'overflow-y-auto max-h-[80vh] min-h-[60vh] flex flex-col gap-4',
          currentCards.length === 0 ? 'justify-center' : '',
        ].join(' ')}
      >
        {currentCards.length > 0 ? (
          currentCards
        ) : (
          <p className="text-body font-body text-ink-muted text-center">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default MobileSlider;
