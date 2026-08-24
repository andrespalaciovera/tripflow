import React from 'react';
import Button from './Button';
import Input from './Input';
import StatusBadge from './StatusBadge';
import ExpenseRow from './ExpenseRow';
import TopNavbar from './TopNavbar';

/**
 * Sandbox de Componentes UI para Tripflow.
 * Actúa como un espacio aislado de pruebas (mini-Storybook) para visualizar y validar componentes.
 */
export const Sandbox = () => {
  return (
    <div className="min-h-screen w-full bg-bg-body font-body text-ink-primary p-8 md:p-12">
      {/* Encabezado principal del Sandbox */}
      <header className="mb-12">
        <h1 className="text-h1 font-display text-ink-primary">
          Tripflow UI Sandbox
        </h1>
        <p className="text-body text-ink-muted mt-2">
          Espacio de trabajo para validar y visualizar componentes de la interfaz de forma aislada.
        </p>
      </header>

      {/* Contenedor del Grid para diferentes secciones de componentes */}
      <main className="grid grid-cols-1 gap-8">
        
        {/* Sección: TopNavbar */}
        <section className="bg-surface rounded-lg shadow-soft p-6 border border-stroke-form">
          <h2 className="text-h2 font-display text-ink-primary mb-6">
            Barra de Navegación Superior (TopNavbar)
          </h2>
          <p className="text-label text-ink-muted uppercase tracking-wider mb-4">
            Demostración del componente TopNavbar.jsx con switch interactivo de moneda
          </p>

          <div className="rounded-md border border-stroke-form overflow-hidden">
            <TopNavbar onCurrencyChange={(isCop) => console.log('Moneda es COP:', isCop)} />
          </div>
        </section>

        {/* Sección: Botones */}
        <section className="bg-surface rounded-lg shadow-soft p-6 border border-stroke-form">
          <h2 className="text-h2 font-display text-ink-primary mb-6">
            Botones
          </h2>
          <p className="text-label text-ink-muted uppercase tracking-wider mb-4">
            Demostración de las 6 variantes implementadas en Button.jsx
          </p>
          
          <div className="flex flex-wrap gap-6 items-center p-4 bg-bg-navbar-forms rounded-md border border-stroke-form">
            {/* 1. Variante Primary */}
            <div className="flex flex-col gap-2 items-center">
              <span className="text-label text-ink-muted">Primary</span>
              <Button variant="primary">
                Guardar Viaje
              </Button>
            </div>

            {/* 2. Variante Secondary */}
            <div className="flex flex-col gap-2 items-center">
              <span className="text-label text-ink-muted">Secondary</span>
              <Button variant="secondary">
                Cancelar
              </Button>
            </div>

            {/* 3. Variante Disabled (deshabilitada mediante prop) */}
            <div className="flex flex-col gap-2 items-center">
              <span className="text-label text-ink-muted">Disabled</span>
              <Button variant="primary" disabled>
                Inactivo
              </Button>
            </div>

            {/* 4. Variante Tertiary */}
            <div className="flex flex-col gap-2 items-center">
              <span className="text-label text-ink-muted">Secondary</span>
              <Button variant="tertiary">
                Finalizar viaje
              </Button>
            </div>

            {/* 5. Variante Icon Add */}
            <div className="flex flex-col gap-2 items-center">
              <span className="text-label text-ink-muted">Icon Add</span>
              <Button variant="icon-add" aria-label="Agregar">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Button>
            </div>

            {/* 6. Variante Icon Delete */}
            <div className="flex flex-col gap-2 items-center">
              <span className="text-label text-ink-muted">Icon Delete</span>
              <Button variant="icon-delete" aria-label="Eliminar">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </section>

        {/* Sección: Inputs */}
        <section className="bg-surface rounded-lg shadow-soft p-6 border border-stroke-form">
          <h2 className="text-h2 font-display text-ink-primary mb-6">
            Inputs
          </h2>
          <p className="text-label text-ink-muted uppercase tracking-wider mb-4">
            Demostración del componente Input.jsx y sus estados
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-bg-navbar-forms rounded-md border border-stroke-form">
            {/* Input normal con Label */}
            <Input 
              label="Nombre del gasto" 
              placeholder="Comida" 
            />

            {/* Input de moneda con prefijo */}
            <Input 
              label="Monto" 
              type="number" 
              prefix="$" 
              placeholder="Ej. $ 400" 
            />

            {/* Input deshabilitado */}
            <Input 
              label="Campo Inactivo" 
              placeholder="No editable" 
              disabled={true} 
            />

            {/* Input de fecha */}
            <Input 
              label="Fecha del gasto" 
              type="date" 
            />
          </div>
        </section>

        {/* Sección: Status Badges */}
        <section className="bg-surface rounded-lg shadow-soft p-6 border border-stroke-form">
          <h2 className="text-h2 font-display text-ink-primary mb-6">
            Status Badges
          </h2>
          <p className="text-label text-ink-muted uppercase tracking-wider mb-4">
            Demostración del componente StatusBadge.jsx y sus 3 estados
          </p>

          <div className="flex flex-wrap gap-4 items-center p-4 bg-bg-navbar-forms rounded-md border border-stroke-form">
            <StatusBadge status="activo" />
            <StatusBadge status="proximo" />
            <StatusBadge status="finalizado" />
          </div>
        </section>

        {/* Sección: Expense Rows */}
        <section className="bg-surface rounded-lg shadow-soft p-6 border border-stroke-form">
          <h2 className="text-h2 font-display text-ink-primary mb-6">
            Filas de Gastos (Expense Rows)
          </h2>
          <p className="text-label text-ink-muted uppercase tracking-wider mb-4">
            Demostración del componente ExpenseRow.jsx y sus niveles de riesgo
          </p>

          <div className="flex flex-col gap-3 p-4 bg-bg-navbar-forms rounded-md border border-stroke-form">
            <ExpenseRow
              description="Compra en boutique"
              riskLevel="high"
              amount="$850.000 COP"
              relativeTime="hace 1d"
            />
            <ExpenseRow
              description="Almuerzo"
              riskLevel="low"
              amount="$80.000 COP"
              relativeTime="hace 1d"
            />
            <ExpenseRow
              description="Depósito de hotel"
              riskLevel="medium"
              amount="$493.000 COP"
              relativeTime="hace 2d"
            />
          </div>
        </section>

      </main>
    </div>
  );
};

export default Sandbox;


