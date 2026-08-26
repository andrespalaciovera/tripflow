import React, { useEffect, useRef, useState } from 'react';
import TopNavbar from '../components/TopNavbar';
import Button from '../components/Button';
import TripActiveCard from '../components/TripActiveCard';
import TripComingCard from '../components/TripComingCard';
import TripCompletedCard from '../components/TripCompletedCard';
import ExpenseRow from '../components/ExpenseRow';
import ResponsiveExpenseWrapper from '../components/ResponsiveExpenseWrapper';
import NewTripDrawer from '../components/NewTripDrawer';
import MobileBottomBar from '../components/MobileBottomBar';
import MobileSlider from '../components/MobileSlider';
import ConfirmationModal from '../components/ConfirmationModal';
import { getTrips, getExpenses, saveTrip, deleteTrip } from '../lib/store';
import {
  calcularEstadoViaje,
  calcularTotalGastadoEnCop,
  calcularDiasTotales,
  calcularPresupuestoDiario,
  calcularNivelRiesgoGasto,
  convertirLocalACOP,
  formatearMontoSegunModoMoneda,
} from '../lib/budget';
import { obtenerSaludo } from '../lib/saludo';

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
 * Dashboard — página principal de Tripflow (AGENTS.md §6: sitemap de 2 niveles).
 * Compone los organismos ya construidos (TopNavbar, TripActiveCard, TripComingCard,
 * TripCompletedCard, ExpenseRow, AddExpensesForm, NewTripDrawer) sobre datos reales
 * leídos de /lib/store.js. El estado de cada viaje (Activo/Próximo/Finalizado) siempre
 * se deriva con calcularEstadoViaje() de /lib/budget.js — nunca es un campo propio.
 */
export const Dashboard = () => {
  // Saludo dinámico según la hora en Bogotá
  const { texto: saludoTexto, emoji: saludoEmoji } = obtenerSaludo();

  // Lista de viajes leída del store; única fuente de verdad para "Tus viajes"
  const [viajes, setViajes] = useState([]);

  // Controla la visibilidad del panel "Agregar gastos": oculto por defecto,
  // se revela al presionar el botón (a diferencia del frame de Figma, que lo
  // muestra expandido solo como referencia de diseño).
  const [mostrarFormularioGastos, setMostrarFormularioGastos] = useState(false);

  // Controla la visibilidad del drawer "Nuevo viaje": mismo patrón, oculto por defecto
  const [isNewTripDrawerOpen, setIsNewTripDrawerOpen] = useState(false);

  // Gastos del viaje Activo: única fuente de verdad tanto para "Gastos recientes"
  // como para el totalGastado que recibe TripActiveCard — nunca dos lecturas
  // separadas que "coincidan por casualidad".
  const [activeTripExpenses, setActiveTripExpenses] = useState([]);

  // Interruptor "Mostrar resultados en COP" de TopNavbar (AGENTS.md §3): gobierna
  // tanto los números de TripActiveCard como el monto mostrado en cada ExpenseRow.
  // Arranca en true, igual que el valor por defecto de TopNavbar.
  const [mostrarEnCop, setMostrarEnCop] = useState(true);

  // Ref hacia el botón móvil "+ Nuevo viaje" del final de la página.
  // Cuando ese botón entra en el viewport (el usuario ha llegado al fondo),
  // la MobileBottomBar se oculta deslizándose hacia abajo para no solaparse.
  const bottomButtonRef = useRef(null);
  const [isBottomButtonVisible, setIsBottomButtonVisible] = useState(false);

  // Estado para controlar qué viaje está seleccionado para eliminarse.
  // Si es null, el modal de confirmación está cerrado.
  const [tripToDelete, setTripToDelete] = useState(null);

  // Pestaña activa del MobileSlider: levantada aquí para poder ocultar
  // "Gastos recientes" en móvil cuando el usuario no está viendo el Activo.
  const [activeMobileTab, setActiveMobileTab] = useState('activo');

  /** Vuelve a leer la lista de viajes desde el store (fuente de verdad) */
  const recargarViajes = () => setViajes(getTrips());

  /** Vuelve a leer los gastos del viaje Activo desde el store (fuente de verdad) */
  const recargarGastosDelViajeActivo = (tripId) => {
    setActiveTripExpenses(tripId ? getExpenses(tripId) : []);
  };

  /**
   * Abre el modal de confirmación fijando el ID del viaje objetivo.
   */
  const promptDeleteTrip = (tripId) => {
    setTripToDelete(tripId);
  };

  /**
   * Ejecuta la eliminación real del viaje, habiendo sido confirmada
   * por el usuario a través del modal.
   */
  const confirmDeleteTrip = () => {
    if (tripToDelete) {
      deleteTrip(tripToDelete);
      recargarViajes();
      setTripToDelete(null);
    }
  };

  // El viaje "Activo" (AGENTS.md §3: solo puede haber uno) determina qué
  // gastos recientes se muestran — esa sección nunca es un feed cruzado.
  // Se deriva ANTES de los useEffect para que su valor esté disponible en
  // sus dependency arrays sin caer en la Zona Muerta Temporal (TDZ).
  const viajeActivo = viajes.find((viaje) => calcularEstadoViaje(viaje) === 'activo');

  // Presupuesto diario FIJO del viaje Activo (presupuesto_total / duración): no
  // fluctúa con nuevos gastos. Fuente única para el color de riesgo de cada
  // ExpenseRow (AGENTS.md §3: "Expense risk coloring") — una vez calculado el
  // color de un gasto, no cambia después aunque se agreguen más gastos.
  const presupuestoDiarioFijoDelActivo = viajeActivo
    ? calcularPresupuestoDiario(
      viajeActivo.presupuesto_total,
      calcularDiasTotales(viajeActivo.fecha_inicio, viajeActivo.fecha_fin)
    )
    : 0;

  // Al montar: leemos la lista real desde el store. Sin datos de ejemplo — un
  // store vacío (p. ej. tras limpiar localStorage) debe mostrar el estado vacío
  // real, nunca viajes falsos.
  useEffect(() => {
    recargarViajes();
  }, []);

  // Cada vez que cambia CUÁL es el viaje Activo (montaje inicial, siembra,
  // un viaje que pasa a estar activo, etc.), recargamos sus gastos.
  useEffect(() => {
    recargarGastosDelViajeActivo(viajeActivo?.id);
  }, [viajeActivo?.id]);

  // IntersectionObserver: detecta cuándo el botón móvil "+ Nuevo viaje" entra
  // o sale del viewport y actualiza isBottomButtonVisible en consecuencia.
  // Solo se activa cuando existe un viajeActivo (el botón solo se renderiza entonces).
  // Se limpia al desmontar o cuando viajeActivo cambia para evitar memory leaks.
  useEffect(() => {
    const el = bottomButtonRef.current;
    if (!el) return;

    const observador = new IntersectionObserver(
      ([entrada]) => setIsBottomButtonVisible(entrada.isIntersecting),
      { threshold: 0.1 }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, [viajeActivo?.id]);

  // Ordenamiento de viajes por prioridad (AGENTS.md §3 + requisito de producto):
  //   1. Activo primero (solo puede haber uno, pero se ordena igual por consistencia).
  //   2. Próximos: ascendente por fecha_inicio — el más cercano al top.
  //   3. Finalizados: descendente por fecha_fin — el más reciente al top.
  // Se hace sobre una copia (.slice()) para no mutar el array original del estado.
  const PRIORIDAD_ESTADO = { activo: 0, proximo: 1, finalizado: 2 };
  const viajesOrdenados = viajes.slice().sort((a, b) => {
    const estadoA = calcularEstadoViaje(a);
    const estadoB = calcularEstadoViaje(b);
    const prioridadA = PRIORIDAD_ESTADO[estadoA];
    const prioridadB = PRIORIDAD_ESTADO[estadoB];

    // Primero ordenar por grupo de estado
    if (prioridadA !== prioridadB) return prioridadA - prioridadB;

    // Dentro de "proximo": ascendente por fecha_inicio (el más próximo primero)
    if (estadoA === 'proximo') {
      return a.fecha_inicio.localeCompare(b.fecha_inicio);
    }

    // Dentro de "finalizado": descendente por fecha_fin (el más reciente primero)
    if (estadoA === 'finalizado') {
      return b.fecha_fin.localeCompare(a.fecha_fin);
    }

    return 0;
  });

  // Tarjetas de viaje ordenadas por prioridad, listas para renderizar.
  // Se computan aquí (fuera del return) para poder reutilizarlas tanto en
  // el MobileSlider (móvil) como en la columna vertical (escritorio) sin
  // duplicar la lógica de mapeo ni llamar a calcularEstadoViaje dos veces.
  const tarjetasDeViajes = viajesOrdenados.map((viaje) => {
    const estado = calcularEstadoViaje(viaje);

    if (estado === 'activo') {
      // Misma fuente que "Gastos recientes" (activeTripExpenses): nunca una
      // segunda lectura aparte que solo "coincida por casualidad". Cada
      // gasto está en su propia moneda local (AGENTS.md §3) — se convierte
      // a COP antes de sumar, nunca se suman los "monto" crudos.
      const totalGastadoViaje = calcularTotalGastadoEnCop(activeTripExpenses, viaje.pais);
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
          mostrarEnCop={mostrarEnCop}
          // Se dispara al presionar "Continuar" en el reporte final (ver TripActiveCard.jsx):
          // persiste finalizado_manualmente: true sobre el registro completo del store (para
          // no perder ningún campo) y refresca la lista, para que el estado sobreviva a un reload.
          onFinalizar={() => {
            saveTrip({ ...viaje, finalizado_manualmente: true });
            recargarViajes();
          }}
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
          onDelete={promptDeleteTrip}
        />
      );
    }

    // estado === 'finalizado' — mismo cuidado: convertir a COP antes de sumar
    const totalGastadoViaje = calcularTotalGastadoEnCop(getExpenses(viaje.id), viaje.pais);
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
  });

  return (
    <div className="min-h-screen w-full bg-bg-body font-body text-ink-primary flex flex-col">
      {/* Barra de navegación superior y encabezado (pegajoso en escritorio para vista con viajes) */}
      {viajes.length > 0 ? (
        <div className="lg:sticky lg:top-0 lg:z-30">
          <TopNavbar
            onCurrencyChange={setMostrarEnCop}
            onNewTrip={() => setIsNewTripDrawerOpen(true)}
            hasTrips={true}
          />
          <div className="bg-bg-body border-b border-stroke-form px-4 md:px-6 py-6 md:py-8">
            <div className="w-full max-w-6xl mx-auto">
              <h1 className="text-h1 font-display text-ink-primary">{saludoTexto} {saludoEmoji}</h1>
            </div>
          </div>
        </div>
      ) : (
        <TopNavbar
          onCurrencyChange={setMostrarEnCop}
          onNewTrip={() => setIsNewTripDrawerOpen(true)}
          hasTrips={false}
        />
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {viajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 h-full min-h-[60vh] text-center px-4">
            <h1 className="text-h1 font-display text-ink-primary mb-4">{saludoTexto} {saludoEmoji}</h1>
            <h2 className="text-h2 font-display text-ink-primary mb-2">Aun no tienes viajes planeados</h2>
            <p className="text-body font-body text-ink-muted max-w-md mb-4">Crea tu primer viaje para empezar a controlar tu presupuesto y organizar tus gastos de forma sencilla.</p>
            <Button variant="primary" onClick={() => setIsNewTripDrawerOpen(true)}>
              Programar viaje
            </Button>
          </div>
        ) : (
          <>
            {/* Layout de dos columnas: viajes a la izquierda, gastos a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Columna izquierda: "Tus viajes".
               * El título vive fuera de cualquier contenedor de scroll.
               * Móvil: MobileSlider (1 a 1 con puntos de paginación).
               * Escritorio (md:): columna vertical clásica. */}
              <section className="flex flex-col gap-4 md:gap-6 min-h-[50vh] md:min-h-[400px]">
                <h2 className="text-h3 font-display text-ink-primary">Tus viajes</h2>

                {viajes.length === 0 ? (
                  /* Estado vacío: se muestra cuando aún no existe ningún viaje en el store */
                  <div className="flex flex-col items-center justify-center flex-1 h-full border-2 border-dashed border-stroke-form rounded-lg p-6 mt-4">
                    <p className="text-body font-body text-ink-muted text-center">
                      No has creado ningún viaje aún.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* MÓVIL: slider estricto 1 a 1 con puntos de paginación */}
                    <div className="w-full md:hidden">
                      <MobileSlider onTabChange={setActiveMobileTab}>
                        {tarjetasDeViajes}
                      </MobileSlider>
                    </div>

                    {/* ESCRITORIO: columna vertical con separación entre tarjetas */}
                    <div className="hidden md:flex md:flex-col md:gap-6 [&>*]:w-full [&>*]:!max-w-full">
                      {tarjetasDeViajes}
                    </div>
                  </>
                )}
              </section>

              {/* Columna derecha: "Gastos recientes" del viaje Activo + panel para agregar.
               * En móvil, se oculta si no hay viaje activo O si el usuario está en otra pestaña. */}
              {/* hideGastosOnMobile: true cuando no hay viaje activo o la tab no es 'activo' */}
              <section className={`${!viajeActivo || activeMobileTab !== 'activo' ? 'hidden' : 'flex'} md:flex flex-col gap-6 min-h-[50vh] md:min-h-[400px]`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-h3 font-display text-ink-primary">Gastos recientes</h2>
                  {/* AGENTS.md §6: este panel solo tiene sentido para el viaje Activo.
                  Se oculta en móvil porque MobileBottomBar (Caso 1) activa el mismo panel. */}
                  {!mostrarFormularioGastos && viajeActivo && (
                    <Button variant="secondary" className="hidden md:block" onClick={() => setMostrarFormularioGastos(true)}>
                      Agregar gastos
                    </Button>
                  )}
                </div>

                {/* Panel de "Agregar gastos": usa un wrapper responsivo.
                En móvil es un bottom sheet (modal), en escritorio es en línea.
                Guarda el gasto por su cuenta (saveExpense); onGuardar dispara justo lo que
                cambió (los gastos del viaje Activo) — no la lista de viajes completa. */}
                {viajeActivo && (
                  <ResponsiveExpenseWrapper
                    isOpen={mostrarFormularioGastos}
                    onClose={() => setMostrarFormularioGastos(false)}
                    trip={viajeActivo}
                    onGuardar={() => {
                      recargarGastosDelViajeActivo(viajeActivo.id);
                      setMostrarFormularioGastos(false);
                    }}
                  />
                )}

                {/* Lista de gastos recientes: solo del viaje Activo (AGENTS.md §3).
                Misma fuente (activeTripExpenses) que totalGastado en TripActiveCard.
                gasto.monto está en la moneda local del viaje: se convierte a COP
                primero y formatearMontoSegunModoMoneda decide, según el interruptor,
                si se muestra así o se vuelve a convertir a la moneda local para mostrar.
                Nota: el guard `viajeActivo &&` es necesario para evitar un crash por estado
                obsoleto — hay un ciclo de render donde viajeActivo ya es undefined pero
                activeTripExpenses todavía contiene los datos del viaje finalizado, antes
                de que el useEffect los limpie. Sin el guard, el map intentaría leer
                viajeActivo.pais y provocaría un TypeError. */}
                {viajeActivo && (activeTripExpenses.length === 0 ? (
                  /* Estado vacío: sin gastos registrados para el viaje Activo */
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-stroke-form rounded-lg p-6">
                    <p className="text-body font-body text-ink-muted text-center">
                      No se ha agregado ningún gasto.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeTripExpenses.map((gasto) => (
                      <ExpenseRow
                        key={gasto.id}
                        description={gasto.titulo}
                        amount={formatearMontoSegunModoMoneda(
                          convertirLocalACOP(gasto.monto, viajeActivo.pais),
                          viajeActivo.pais,
                          mostrarEnCop
                        )}
                        relativeTime={formatearTiempoRelativo(gasto.creado_en)}
                        riskLevel={calcularNivelRiesgoGasto(
                          gasto.monto,
                          viajeActivo.pais,
                          presupuestoDiarioFijoDelActivo
                        )}
                      />
                    ))}
                  </div>
                ))}
              </section>
            </div>
            {/* Botón móvil "+ Nuevo viaje" — solo cuando hay un viaje Activo.
            En ese caso MobileBottomBar (Caso 1) ocupa el espacio inferior con
            "Agregar gastos", así que este botón secundario ofrece la alternativa
            de crear un nuevo viaje. El ref dispara el IntersectionObserver que
            oculta la MobileBottomBar cuando este botón entra en el viewport. */}
            {viajeActivo && (
              <div ref={bottomButtonRef} className="mt-8 md:hidden">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setIsNewTripDrawerOpen(true)}
                >
                  + Nuevo viaje
                </Button>
              </div>
            )}
          </>
        )}
      </main>


      {/* Barra de acciones fija en la parte inferior — solo móvil (md:hidden).
          Caso 1 (viajeActivo): botón "Agregar gastos" + interruptor de moneda.
          Caso 2 (sin viajeActivo): botón "Agregar nuevo viaje" a ancho completo.
          hideBar: se oculta deslizándose cuando el botón móvil inferior entra en el viewport. */}
      <MobileBottomBar
        hasAnyTrips={viajes.length > 0}
        hasActiveTrip={!!viajeActivo}
        hideBar={isBottomButtonVisible}
        onAddExpense={() => setMostrarFormularioGastos(true)}
        onNewTrip={() => setIsNewTripDrawerOpen(true)}
        isCop={mostrarEnCop}
        onCurrencyChange={() => setMostrarEnCop((prev) => !prev)}
      />

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

      {/* Modal de confirmación para eliminar viaje */}
      <ConfirmationModal
        isOpen={!!tripToDelete}
        onClose={() => setTripToDelete(null)}
        onConfirm={confirmDeleteTrip}
      />
    </div>
  );
};

export default Dashboard;
