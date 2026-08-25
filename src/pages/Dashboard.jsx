import React, { useEffect, useState } from 'react';
import TopNavbar from '../components/TopNavbar';
import Button from '../components/Button';
import TripActiveCard from '../components/TripActiveCard';
import TripComingCard from '../components/TripComingCard';
import TripCompletedCard from '../components/TripCompletedCard';
import ExpenseRow from '../components/ExpenseRow';
import AddExpensesForm from '../components/AddExpensesForm';
import NewTripDrawer from '../components/NewTripDrawer';
import { getTrips, saveTrip, getExpenses, saveExpense } from '../lib/store';
import { calcularEstadoViaje } from '../lib/budget';

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

/**
 * Nivel de riesgo visual por gasto (color de acento de ExpenseRow, alert-min/medium/max).
 * No es parte del modelo Expense — es una etiqueta puramente presentacional. Los gastos
 * semilla de más abajo tienen un valor fijo asignado; cualquier gasto real (guardado más
 * adelante desde AddExpensesForm) usa 'low' por defecto hasta que exista una regla propia.
 */
const NIVEL_RIESGO_POR_GASTO = {
  'exp-001': 'high',
  'exp-002': 'low',
  'exp-003': 'low',
  'exp-004': 'medium',
};

// --- Datos semilla (solo si el store está vacío) ----------------------------
// Siguen exactamente el modelo Trip/Expense de AGENTS.md §3. Se guardan una única
// vez en /lib/store.js la primera vez que se abre el dashboard, para que la app
// no arranque totalmente vacía — a partir de ahí, "Tus viajes" y "Gastos recientes"
// se leen siempre del store, igual que cualquier viaje creado desde NewTripDrawer.

/** Viaje "Activo" semilla: inició ayer, dura 6 días → "Día 2 de 6" */
const viajeActivoSemilla = {
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

/** Viaje "Próximo" semilla: comienza en 29 días */
const viajeProximoSemilla = {
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

/** Viaje "Finalizado" semilla: terminó manualmente, por encima del presupuesto */
const viajeFinalizadoSemilla = {
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

/** Gastos semilla del viaje "Activo" (mismos ejemplos usados en el frame de Figma) */
const gastosActivoSemilla = [
  {
    id: 'exp-001',
    trip_id: viajeActivoSemilla.id,
    titulo: 'Compra en boutique',
    monto: 850000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-002',
    trip_id: viajeActivoSemilla.id,
    titulo: 'Almuerzo',
    monto: 80000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-003',
    trip_id: viajeActivoSemilla.id,
    titulo: 'Taxi desde el aeropuerto',
    monto: 96000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-004',
    trip_id: viajeActivoSemilla.id,
    titulo: 'Depósito de hotel',
    monto: 493000,
    fecha: new Date().toISOString(),
    origen: 'manual',
    creado_en: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
];

/** Gastos semilla del viaje "Finalizado" (suman 5.200.000: por encima del presupuesto) */
const gastosFinalizadoSemilla = [
  {
    id: 'exp-005',
    trip_id: viajeFinalizadoSemilla.id,
    titulo: 'Hospedaje',
    monto: 3200000,
    fecha: viajeFinalizadoSemilla.fecha_inicio,
    origen: 'manual',
    creado_en: viajeFinalizadoSemilla.fecha_inicio,
  },
  {
    id: 'exp-006',
    trip_id: viajeFinalizadoSemilla.id,
    titulo: 'Vuelos y traslados',
    monto: 2000000,
    fecha: viajeFinalizadoSemilla.fecha_inicio,
    origen: 'manual',
    creado_en: viajeFinalizadoSemilla.fecha_inicio,
  },
];

/**
 * Dashboard — página principal de Tripflow (AGENTS.md §6: sitemap de 2 niveles).
 * Compone los organismos ya construidos (TopNavbar, TripActiveCard, TripComingCard,
 * TripCompletedCard, ExpenseRow, AddExpensesForm, NewTripDrawer) sobre datos reales
 * leídos de /lib/store.js. El estado de cada viaje (Activo/Próximo/Finalizado) siempre
 * se deriva con calcularEstadoViaje() de /lib/budget.js — nunca es un campo propio.
 */
export const Dashboard = () => {
  // Lista de viajes leída del store; única fuente de verdad para "Tus viajes"
  const [viajes, setViajes] = useState([]);

  // Controla la visibilidad del panel "Agregar gastos": oculto por defecto,
  // se revela al presionar el botón (a diferencia del frame de Figma, que lo
  // muestra expandido solo como referencia de diseño).
  const [mostrarFormularioGastos, setMostrarFormularioGastos] = useState(false);

  // Controla la visibilidad del drawer "Nuevo viaje": mismo patrón, oculto por defecto
  const [isNewTripDrawerOpen, setIsNewTripDrawerOpen] = useState(false);

  /** Vuelve a leer la lista de viajes desde el store (fuente de verdad) */
  const recargarViajes = () => setViajes(getTrips());

  // Al montar: si el store está vacío (primera visita), lo sembramos con datos
  // de ejemplo; luego, en cualquier caso, leemos la lista real desde el store.
  useEffect(() => {
    if (getTrips().length === 0) {
      [viajeActivoSemilla, viajeProximoSemilla, viajeFinalizadoSemilla].forEach(saveTrip);
      [...gastosActivoSemilla, ...gastosFinalizadoSemilla].forEach(saveExpense);
    }
    recargarViajes();
  }, []);

  // El viaje "Activo" (AGENTS.md §3: solo puede haber uno) determina qué
  // gastos recientes se muestran — esa sección nunca es un feed cruzado.
  const viajeActivo = viajes.find((viaje) => calcularEstadoViaje(viaje) === 'activo');
  const gastosRecientes = viajeActivo ? getExpenses(viajeActivo.id) : [];

  return (
    <div className="min-h-screen w-full bg-bg-body font-body text-ink-primary flex flex-col">
      {/* Barra de navegación superior: logo + interruptor de moneda, sin enlaces de navegación */}
      <TopNavbar onCurrencyChange={(esCop) => console.log('Moneda es COP:', esCop)} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Encabezado: saludo + acción de nuevo viaje */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-h1 font-display text-ink-primary">Buenos días ☀️</h1>
          <Button variant="primary" onClick={() => setIsNewTripDrawerOpen(true)}>
            + Nuevo viaje
          </Button>
        </div>

        {/* Layout de dos columnas: viajes a la izquierda, gastos a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Columna izquierda: "Tus viajes" — un card por viaje, según su estado derivado */}
          <section className="flex flex-col gap-6">
            <h2 className="text-h3 font-display text-ink-primary">Tus viajes</h2>

            {viajes.map((viaje) => {
              const estado = calcularEstadoViaje(viaje);

              if (estado === 'activo') {
                const totalGastadoViaje = getExpenses(viaje.id).reduce((suma, g) => suma + g.monto, 0);
                return (
                  <TripActiveCard
                    key={viaje.id}
                    trip={{
                      destino: viaje.nombre,
                      motivo: viaje.motivo,
                      presupuestoTotal: viaje.presupuesto_total,
                      fechaInicio: viaje.fecha_inicio,
                      fechaFin: viaje.fecha_fin,
                    }}
                    totalGastado={totalGastadoViaje}
                    // TODO: persistir en store.js (finalizado_manualmente: true) en un paso posterior
                    onFinalizar={() => console.log('Viaje finalizado (pendiente de conectar a store.js):', viaje.id)}
                    onCalcularPago={() => console.log('Calcula si puedes pagarlo')}
                  />
                );
              }

              if (estado === 'proximo') {
                return (
                  <TripComingCard
                    key={viaje.id}
                    trip={{
                      id: viaje.id,
                      destino: viaje.nombre,
                      motivo: viaje.motivo,
                      presupuesto: viaje.presupuesto_total,
                      fechaInicio: viaje.fecha_inicio,
                    }}
                    // TODO: persistir el borrado en store.js (deleteTrip) en un paso posterior
                    onDelete={(id) => console.log('Eliminar viaje (pendiente de conectar a store.js):', id)}
                  />
                );
              }

              // estado === 'finalizado'
              const totalGastadoViaje = getExpenses(viaje.id).reduce((suma, g) => suma + g.monto, 0);
              return (
                <TripCompletedCard
                  key={viaje.id}
                  trip={{
                    destino: viaje.nombre,
                    presupuestoTotal: viaje.presupuesto_total,
                  }}
                  totalGastado={totalGastadoViaje}
                />
              );
            })}
          </section>

          {/* Columna derecha: "Gastos recientes" del viaje Activo + panel para agregar */}
          <section className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-h3 font-display text-ink-primary">Gastos recientes</h2>
              {/* AGENTS.md §6: este panel solo tiene sentido para el viaje Activo */}
              {!mostrarFormularioGastos && viajeActivo && (
                <Button variant="secondary" onClick={() => setMostrarFormularioGastos(true)}>
                  Agregar gastos
                </Button>
              )}
            </div>

            {/* Panel de "Agregar gastos": oculto por defecto, un solo bloque de gasto.
                Guarda el gasto por su cuenta (saveExpense); onGuardar solo nos avisa para
                refrescar los datos derivados (lista de gastos y presupuesto del viaje Activo). */}
            {mostrarFormularioGastos && viajeActivo && (
              <AddExpensesForm
                tripId={viajeActivo.id}
                onGuardar={() => {
                  recargarViajes();
                  setMostrarFormularioGastos(false);
                }}
                onCancelar={() => setMostrarFormularioGastos(false)}
              />
            )}

            {/* Lista de gastos recientes: solo del viaje Activo (AGENTS.md §3) */}
            <div className="flex flex-col gap-3">
              {gastosRecientes.map((gasto) => (
                <ExpenseRow
                  key={gasto.id}
                  description={gasto.titulo}
                  amount={formatearMoneda(gasto.monto)}
                  relativeTime={formatearTiempoRelativo(gasto.creado_en)}
                  riskLevel={NIVEL_RIESGO_POR_GASTO[gasto.id] || 'low'}
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
          NewTripDrawer ya guarda el viaje en store.js por su cuenta; onSave solo nos avisa
          para refrescar la lista y cerrar el panel. */}
      <NewTripDrawer
        isOpen={isNewTripDrawerOpen}
        onClose={() => setIsNewTripDrawerOpen(false)}
        onSave={() => {
          recargarViajes();
          setIsNewTripDrawerOpen(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
