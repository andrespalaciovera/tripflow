import React, { useState } from 'react';
import TopNavbar from '../components/TopNavbar';
import Button from '../components/Button';
import TripActiveCard from '../components/TripActiveCard';
import TripComingCard from '../components/TripComingCard';
import TripCompletedCard from '../components/TripCompletedCard';
import ExpenseRow from '../components/ExpenseRow';
import AddExpensesForm from '../components/AddExpensesForm';
import NewTripDrawer from '../components/NewTripDrawer';

/**
 * Formatea un número como moneda COP, sin decimales, seguido del código de moneda.
 * @param {number} valor - Monto a formatear
 * @returns {string} Monto formateado (ej. "$850.000 COP")
 */
const formatearMoneda = (valor) => {
  const monto = Number.isFinite(valor) ? valor : 0;
  return `${new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(monto)} COP`;
};

/**
 * Convierte una marca de tiempo ISO en un texto relativo corto ("hace 1h", "hace 2d").
 * @param {string} creadoEnIso - Timestamp ISO de creación del gasto
 * @returns {string} Texto relativo
 */
const formatearTiempoRelativo = (creadoEnIso) => {
  const horasTranscurridas = (Date.now() - new Date(creadoEnIso).getTime()) / (1000 * 60 * 60);
  if (horasTranscurridas < 1) return 'hace unos minutos';
  if (horasTranscurridas < 24) return `hace ${Math.round(horasTranscurridas)}h`;
  return `hace ${Math.round(horasTranscurridas / 24)}d`;
};

// --- Datos simulados (mock) --------------------------------------------------
// Paso de composición únicamente: aún no se conecta con /lib/store.js ni /lib/budget.js.
// Los objetos siguen exactamente el modelo Trip/Expense definido en AGENTS.md, sección 3.

/** Viaje "Activo" (Trip, AGENTS.md §3): inició ayer, dura 6 días → "Día 2 de 6" */
const viajeActivoMock = {
  id: 'trip-001',
  nombre: 'España',
  pais: 'España',
  moneda: 'EUR',
  motivo: 'vacaciones',
  fecha_inicio: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  fecha_fin: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  presupuesto_total: 6500000,
  finalizado_manualmente: false,
};

/** Viaje "Próximo" (Trip, AGENTS.md §3): comienza en 29 días */
const viajeProximoMock = {
  id: 'trip-002',
  nombre: 'México',
  pais: 'México',
  moneda: 'MXN',
  motivo: 'negocios',
  fecha_inicio: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
  fecha_fin: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000).toISOString(),
  presupuesto_total: 4000000,
  finalizado_manualmente: false,
};

/** Viaje "Finalizado" (Trip, AGENTS.md §3): terminó manualmente, por encima del presupuesto */
const viajeFinalizadoMock = {
  id: 'trip-003',
  nombre: 'Francia',
  pais: 'Francia',
  moneda: 'EUR',
  motivo: 'vacaciones',
  fecha_inicio: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  fecha_fin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  presupuesto_total: 5000000,
  finalizado_manualmente: true,
};
const totalGastadoFinalizadoMock = 5200000; // por encima del presupuesto, para variar el resultado

/**
 * Gastos recientes (Expense, AGENTS.md §3) del viaje "Activo".
 * Mismas descripciones y montos de ejemplo usados en el frame de Figma.
 */
const gastosRecientesMock = [
  {
    id: 'exp-001',
    trip_id: viajeActivoMock.id,
    titulo: 'Compra en boutique',
    monto: 850000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-002',
    trip_id: viajeActivoMock.id,
    titulo: 'Almuerzo',
    monto: 80000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-003',
    trip_id: viajeActivoMock.id,
    titulo: 'Taxi desde el aeropuerto',
    monto: 96000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-004',
    trip_id: viajeActivoMock.id,
    titulo: 'Depósito de hotel',
    monto: 493000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Nivel de riesgo visual por gasto (color de acento de ExpenseRow). No es parte del
 * modelo Expense — es una etiqueta puramente presentacional para este mock, igual que
 * el estado del viaje es siempre derivado y nunca un campo propio.
 */
const NIVEL_RIESGO_POR_GASTO = {
  'exp-001': 'high',
  'exp-002': 'low',
  'exp-003': 'low',
  'exp-004': 'medium',
};

// Total gastado del viaje activo: suma de sus gastos recientes (≈23% del presupuesto)
const totalGastadoActivoMock = gastosRecientesMock.reduce((suma, gasto) => suma + gasto.monto, 0);

/**
 * Dashboard — página principal de Tripflow (AGENTS.md §6: sitemap de 2 niveles).
 * Compone los organismos ya construidos (TopNavbar, TripActiveCard, TripComingCard,
 * TripCompletedCard, ExpenseRow, AddExpensesForm) sobre datos simulados. Paso de
 * ensamblaje de layout únicamente: sin conexión a /lib/store.js todavía.
 */
export const Dashboard = () => {
  // Controla la visibilidad del panel "Agregar gastos": oculto por defecto,
  // se revela al presionar el botón (a diferencia del frame de Figma, que lo
  // muestra expandido solo como referencia de diseño).
  const [mostrarFormularioGastos, setMostrarFormularioGastos] = useState(false);

  // Controla la visibilidad del drawer "Nuevo viaje": mismo patrón, oculto por defecto
  const [isNewTripDrawerOpen, setIsNewTripDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-bg-body font-body text-ink-primary flex flex-col">
      {/* Barra de navegación superior: logo + interruptor de moneda, sin enlaces de navegación */}
      <TopNavbar onCurrencyChange={(esCop) => console.log('Moneda es COP:', esCop)} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Encabezado: saludo + acción de nuevo viaje */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-h1 font-display text-ink-primary">Buenos días ☀️</h1>
          {/* TODO: conectar onSave a /lib/store.js en un paso posterior */}
          <Button variant="primary" onClick={() => setIsNewTripDrawerOpen(true)}>
            + Nuevo viaje
          </Button>
        </div>

        {/* Layout de dos columnas: viajes a la izquierda, gastos a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Columna izquierda: "Tus viajes" — un card por viaje (Activo/Próximo/Finalizado) */}
          <section className="flex flex-col gap-6">
            <h2 className="text-h3 font-display text-ink-primary">Tus viajes</h2>

            <TripActiveCard
              trip={{
                destino: viajeActivoMock.nombre,
                motivo: viajeActivoMock.motivo,
                presupuestoTotal: viajeActivoMock.presupuesto_total,
                fechaInicio: viajeActivoMock.fecha_inicio,
                fechaFin: viajeActivoMock.fecha_fin,
              }}
              totalGastado={totalGastadoActivoMock}
              onFinalizar={() => console.log('Viaje finalizado (pendiente de conectar a store.js)')}
              onCalcularPago={() => console.log('Calcula si puedes pagarlo')}
            />

            <TripComingCard
              trip={{
                id: viajeProximoMock.id,
                destino: viajeProximoMock.nombre,
                motivo: viajeProximoMock.motivo,
                presupuesto: viajeProximoMock.presupuesto_total,
                fechaInicio: viajeProximoMock.fecha_inicio,
              }}
              onDelete={(id) => console.log('Eliminar viaje (pendiente de conectar a store.js):', id)}
            />

            <TripCompletedCard
              trip={{
                destino: viajeFinalizadoMock.nombre,
                presupuestoTotal: viajeFinalizadoMock.presupuesto_total,
              }}
              totalGastado={totalGastadoFinalizadoMock}
            />
          </section>

          {/* Columna derecha: "Gastos recientes" del viaje Activo + panel para agregar */}
          <section className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-h3 font-display text-ink-primary">Gastos recientes</h2>
              {!mostrarFormularioGastos && (
                <Button variant="secondary" onClick={() => setMostrarFormularioGastos(true)}>
                  Agregar gastos
                </Button>
              )}
            </div>

            {/* Panel de "Agregar gastos": oculto por defecto, un solo bloque de gasto.
                Sin wiring a store.js todavía: onGuardar/onCancelar solo colapsan el panel. */}
            {mostrarFormularioGastos && (
              <AddExpensesForm
                onGuardar={(gastos) => {
                  console.log('Gastos a guardar (pendiente de conectar a store.js):', gastos);
                  setMostrarFormularioGastos(false);
                }}
                onCancelar={() => setMostrarFormularioGastos(false)}
              />
            )}

            {/* Lista de gastos recientes: solo del viaje Activo (AGENTS.md §3) */}
            <div className="flex flex-col gap-3">
              {gastosRecientesMock.map((gasto) => (
                <ExpenseRow
                  key={gasto.id}
                  description={gasto.titulo}
                  amount={formatearMoneda(gasto.monto)}
                  relativeTime={formatearTiempoRelativo(gasto.creado_en)}
                  riskLevel={NIVEL_RIESGO_POR_GASTO[gasto.id]}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="w-full bg-bg-navbar-forms border-t border-stroke-form mt-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-display text-h3 text-ink-primary select-none">Tripflow</span>
            <span className="text-label font-body text-ink-muted">
              © 2026 Tripflow. All rights reserved.
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#" className="text-label font-body text-ink-muted hover:text-ink-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-label font-body text-ink-muted hover:text-ink-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-label font-body text-ink-muted hover:text-ink-primary transition-colors">
              Help Center
            </a>
          </nav>
        </div>
      </footer>

      {/* Drawer "Nuevo viaje": oculto por defecto, se superpone sobre el dashboard atenuado.
          Sin wiring a store.js todavía: onSave solo registra el viaje y cierra el drawer. */}
      <NewTripDrawer
        isOpen={isNewTripDrawerOpen}
        onClose={() => setIsNewTripDrawerOpen(false)}
        onSave={(nuevoViaje) => {
          console.log('Nuevo viaje a guardar (pendiente de conectar a store.js):', nuevoViaje);
          setIsNewTripDrawerOpen(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
