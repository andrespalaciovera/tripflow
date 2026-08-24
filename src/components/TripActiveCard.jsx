import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import Button from './Button';
import Input from './Input';
import TripCompletedCard from './TripCompletedCard';

/**
 * Tasas de conversión fijas (MVP) de moneda local a COP, según el destino del viaje.
 * Si el destino no está en la tabla, se usa 1 (asume que ya está en COP).
 */
const TASAS_CONVERSION_COP = {
  usa: 4000,
  españa: 4300,
  francia: 4300,
  alemania: 4300,
  italia: 4300,
  méxico: 230,
  mexico: 230,
  colombia: 1,
};

/**
 * Formatea un número como moneda COP, sin decimales.
 * @param {number} valor - Monto a formatear
 * @returns {string} Monto formateado (ej. "$1.495.000")
 */
const formatearMoneda = (valor) => {
  const monto = Number.isFinite(valor) ? valor : 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(monto);
};

/**
 * Calcula el número de días completos entre dos fechas (inclusivo).
 * Se normalizan ambas fechas a medianoche para evitar desfases por horas.
 * @param {string|Date} fechaInicioStr
 * @param {string|Date} fechaFinStr
 * @returns {number} Total de días del viaje (mínimo 1)
 */
const calcularDiasTotales = (fechaInicioStr, fechaFinStr) => {
  const inicio = new Date(fechaInicioStr);
  const fin = new Date(fechaFinStr);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  const diferenciaMilisegundos = fin.getTime() - inicio.getTime();
  const dias = Math.round(diferenciaMilisegundos / (1000 * 3600 * 24)) + 1;

  // Un viaje siempre dura al menos 1 día
  return Math.max(1, dias);
};

/**
 * Calcula el día actual del viaje (día 1 = fecha de inicio).
 * Se acota entre 1 y diasTotales para que nunca se salga del rango del viaje.
 * @param {string|Date} fechaInicioStr
 * @param {number} diasTotales
 * @returns {number} Día actual del viaje
 */
const calcularDiaActual = (fechaInicioStr, diasTotales) => {
  const hoy = new Date();
  const inicio = new Date(fechaInicioStr);
  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);

  const diferenciaMilisegundos = hoy.getTime() - inicio.getTime();
  const diasTranscurridos = Math.floor(diferenciaMilisegundos / (1000 * 3600 * 24)) + 1;

  // Se acota entre el día 1 y el último día del viaje
  return Math.min(Math.max(1, diasTranscurridos), diasTotales);
};

/**
 * Componente Organismo para mostrar un viaje en estado "Activo" (viaje en curso).
 * Iteración 1: estado por defecto con su lógica matemática universal (anillo de
 * progreso de presupuesto y barra lineal de días transcurridos).
 * Iteración 2: agrega el estado "Calculadora" para convertir un valor en moneda
 * local a COP usando tasas fijas (MVP), sin modificar la mitad superior de la tarjeta.
 * Iteración 3: agrega los estados de resultado "RESULT_GOOD" y "RESULT_BAD" (Regla del 69%),
 * que muestran el impacto del gasto sobre el presupuesto diario y total, y permiten reiniciar
 * la calculadora.
 * Iteración 4: agrega el overlay de confirmación "¿Ya ha terminado su viaje?", que se superpone
 * a la vista actual (sin alterarla) al presionar "Finalizar viaje".
 * Iteración 5: agrega los estados finales "REPORT_GOOD" y "REPORT_BAD", que reemplazan la
 * tarjeta por un resumen del viaje ya finalizado: título + destino, fila de presupuesto vs.
 * gasto total, anillo de porcentaje gastado con el monto restante o adeudado, subtarjeta de
 * alerta (felicitación o deuda) y botón "Continuar".
 * Iteración 6: al presionar "Continuar" en el reporte final, el componente se transforma
 * por completo en TripCompletedCard (viaje archivado en el historial).
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.trip - Datos del viaje
 * @param {string} props.trip.destino - Nombre del destino (ej. "España")
 * @param {string} props.trip.motivo - Motivo del viaje ("Negocios" o "Vacaciones")
 * @param {number} props.trip.presupuestoTotal - Presupuesto total del viaje en COP
 * @param {string} props.trip.fechaInicio - Fecha de inicio en formato ISO o YYYY-MM-DD
 * @param {string} props.trip.fechaFin - Fecha de fin en formato ISO o YYYY-MM-DD
 * @param {number} props.totalGastado - Suma total de gastos registrados (proviene del store)
 * @param {Function} [props.onFinalizar] - Callback al confirmar el fin del viaje en el overlay de confirmación
 * @param {Function} [props.onCalcularPago] - Callback al presionar "Calcula si puedes pagarlo"
 */
export const TripActiveCard = ({ trip, totalGastado, onFinalizar, onCalcularPago }) => {
  const { destino, motivo, presupuestoTotal, fechaInicio, fechaFin } = trip;

  // --- Estado de la vista (por defecto, calculadora o resultado) -----------
  const [vistaActual, setVistaActual] = useState('DEFAULT');
  const [valorIngresado, setValorIngresado] = useState('');
  // Porcentajes calculados para mostrar en el bloque de resultado
  const [porcentajesCalculados, setPorcentajesCalculados] = useState({ porcentajeDiario: 0, porcentajeTotal: 0 });

  // Controla la metamorfosis final: cuando es true, el componente se reemplaza por completo
  // por TripCompletedCard (viaje ya archivado en el historial).
  const [viajeFinalizado, setViajeFinalizado] = useState(false);

  // Controla el overlay de confirmación "¿Ya ha terminado su viaje?". Es independiente
  // de vistaActual: se superpone a la vista actual sin modificarla.
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // --- Metamorfosis: si el viaje ya fue archivado, la tarjeta completa se
  // reemplaza por TripCompletedCard (se evalúa antes que vistaActual, ya que
  // esta última se queda en REPORT_GOOD/REPORT_BAD y no debe volver a mostrarse).
  if (viajeFinalizado) {
    return <TripCompletedCard totalGastado={totalGastado} trip={trip} />;
  }

  // Umbral (Regla del 69%): por encima de este porcentaje del presupuesto diario,
  // el gasto se considera riesgoso (RESULT_BAD); por debajo o igual, es viable (RESULT_GOOD)
  const UMBRAL_GASTO_RIESGOSO = 69;

  /**
   * Convierte el valor ingresado en moneda local a COP según el destino del viaje,
   * usando tasas fijas (MVP), y determina si el gasto es viable o riesgoso comparándolo
   * contra el presupuesto diario y total (Regla del 69%).
   */
  const manejarCalculo = () => {
    const claveDestino = (destino || '').trim().toLowerCase();
    const tasa = TASAS_CONVERSION_COP[claveDestino] ?? 1;

    const valorEnCop = Number(valorIngresado) * tasa;

    // Porcentaje que representa el gasto sobre el presupuesto diario y total, sin decimales
    const porcentajeDiario = presupuestoDiario > 0 ? Math.round((valorEnCop / presupuestoDiario) * 100) : 0;
    const porcentajeTotal = presupuestoTotal > 0 ? Math.round((valorEnCop / presupuestoTotal) * 100) : 0;

    setPorcentajesCalculados({ porcentajeDiario, porcentajeTotal });
    setVistaActual(porcentajeDiario > UMBRAL_GASTO_RIESGOSO ? 'RESULT_BAD' : 'RESULT_GOOD');
  };

  /**
   * Reinicia la calculadora para un nuevo cálculo: limpia el valor ingresado
   * y los porcentajes calculados, y vuelve directamente a la vista "Calculadora"
   * (sin pasar de nuevo por el botón "Calcula si puedes pagarlo").
   */
  const reiniciarCalculadora = () => {
    setVistaActual('CALCULATOR');
    setValorIngresado('');
    setPorcentajesCalculados({ porcentajeDiario: 0, porcentajeTotal: 0 });
  };

  /**
   * Confirma el cierre del viaje desde el overlay de confirmación.
   * Notifica al padre, decide el reporte final (dentro o por encima del presupuesto
   * total) y cierra el overlay.
   */
  const manejarConfirmacionFinalizar = () => {
    setVistaActual(totalGastado <= presupuestoTotal ? 'REPORT_GOOD' : 'REPORT_BAD');
    onFinalizar?.();
    setMostrarConfirmacion(false);
  };

  // --- Funciones matemáticas universales -----------------------------------

  // Porcentaje gastado del presupuesto, acotado a 100 para no desbordar el SVG
  const porcentajeGastadoReal = presupuestoTotal > 0 ? (totalGastado / presupuestoTotal) * 100 : 0;
  const porcentajeGastado = Math.min(100, Math.max(0, porcentajeGastadoReal));

  // Duración total del viaje y día actual dentro de ese rango
  const diasTotales = calcularDiasTotales(fechaInicio, fechaFin);
  const diaActual = calcularDiaActual(fechaInicio, diasTotales);

  // Presupuesto restante y sugerencia de gasto diario
  const presupuestoRestante = presupuestoTotal - totalGastado;
  const diasRestantesConHoy = diasTotales - diaActual + 1;
  const presupuestoDiario = diasRestantesConHoy > 0 ? presupuestoRestante / diasRestantesConHoy : presupuestoRestante;

  // Progreso de la barra lineal de días transcurridos
  const porcentajeDias = diasTotales > 0 ? Math.min(100, (diaActual / diasTotales) * 100) : 0;

  // --- Geometría del anillo SVG de progreso ---------------------------------
  const radio = 32;
  const circunferencia = 2 * Math.PI * radio;
  const desplazamiento = circunferencia - (porcentajeGastado / 100) * circunferencia;

  // --- Vistas de reporte final: reemplazan toda la tarjeta -----------------
  if (vistaActual === 'REPORT_GOOD' || vistaActual === 'REPORT_BAD') {
    const esBueno = vistaActual === 'REPORT_GOOD';
    // "Te quedaron" (GOOD) o "Debes" (BAD): sobrante o deuda frente al presupuesto total
    const montoRestanteODeuda = esBueno ? presupuestoTotal - totalGastado : totalGastado - presupuestoTotal;

    return (
      <div className="relative overflow-hidden bg-status-activo-bg rounded-lg shadow-soft p-6 w-full max-w-md">
        {/* Encabezado: sin badges, solo el título del reporte y el destino */}
        <h2 className="text-h2 font-display text-ink-primary">Reporte de gastos</h2>
        <h2 className="text-h2 font-display text-ink-primary mb-6">{destino}</h2>

        {/* Fila de resumen: presupuesto vs. gasto total */}
        <div className="flex gap-8 mb-6">
          <div>
            <p className="text-label font-body text-ink-muted">Presupuesto</p>
            <p className="text-body font-body text-ink-primary">{formatearMoneda(presupuestoTotal)}</p>
          </div>
          <div>
            <p className="text-label font-body text-ink-muted">Gasto total</p>
            <p className="text-body font-body text-ink-primary">{formatearMoneda(totalGastado)}</p>
          </div>
        </div>

        {/* Fila del anillo de gasto + monto restante o deuda */}
        <div className="flex items-center gap-6 mb-6">
          {/* Izquierda: anillo de porcentaje gastado */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-label font-body text-ink-muted text-center">Gasto</p>
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                {/* Pista de fondo */}
                <circle cx="40" cy="40" r={radio} fill="none" strokeWidth="8" className="stroke-bg-surface" />
                {/* Progreso de gasto */}
                <circle
                  cx="40"
                  cy="40"
                  r={radio}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={esBueno ? 'stroke-status-activo-text' : 'stroke-alert-max'}
                  strokeDasharray={circunferencia}
                  strokeDashoffset={desplazamiento}
                />
              </svg>
              {/* Porcentaje centrado dentro del anillo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-h3 font-display text-ink-primary">
                  {Math.round(porcentajeGastado)}%
                </span>
              </div>
            </div>
          </div>

          {/* Derecha: monto restante (GOOD) o deuda (BAD) */}
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-label font-body text-ink-muted">{esBueno ? 'Te quedaron' : 'Debes'}</p>
            <p className="text-body font-body text-ink-primary">{formatearMoneda(montoRestanteODeuda)}</p>
          </div>
        </div>

        {/* Subtarjeta de alerta: felicitación (GOOD) o deuda a pagar (BAD) */}
        <div
          className={[
            'rounded-md p-4 mb-6 text-center border',
            esBueno
              ? 'bg-status-activo-text/10 border-status-activo-text'
              : 'bg-alert-max/15 border-alert-max',
          ].join(' ')}
        >
          <p className="text-body font-body text-ink-primary">
            {esBueno ? 'Quedaste dentro del presupuesto' : 'Quedaste fuera del presupuesto, debes:'}
          </p>
          <p className="text-h2 font-display text-ink-primary font-bold">
            {esBueno ? 'Felicidades' : formatearMoneda(montoRestanteODeuda)}
          </p>
        </div>

        {/* Nota: "verde outline" corresponde a la variante 'tertiary' de Button.jsx */}
        <Button
          variant="tertiary"
          className="w-full"
          onClick={() => {
            setViajeFinalizado(true);
            if (onFinalizar) onFinalizar();
          }}
        >
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-status-activo-bg rounded-lg shadow-soft p-6 w-full max-w-md">
      {/* Encabezado: Badge de estado y acción de finalizar */}
      <div className="flex justify-between items-center mb-5">
        <StatusBadge status="activo" />
        {/* Nota: "success-outline" corresponde a la variante 'tertiary' de Button.jsx */}
        <Button variant="tertiary" onClick={() => setMostrarConfirmacion(true)}>
          Finalizar viaje
        </Button>
      </div>

      {/* Título: Destino a la izquierda, Motivo alineado a la derecha */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-h2 font-display text-ink-primary">{destino}</h2>
        <div className="flex flex-col text-right">
          <span className="text-label font-body text-ink-muted">Motivo de viaje</span>
          <span className="text-body font-body text-status-activo-text capitalize">{motivo}</span>
        </div>
      </div>

      {/* Presupuesto inicial */}
      <div className="mb-6">
        <p className="text-label font-body text-ink-muted">Presupuesto inicial</p>
        <p className="text-body font-body text-ink-primary">{formatearMoneda(presupuestoTotal)}</p>
      </div>

      {/* Sección de medidores: anillo de progreso + barra de días */}
      <div className="flex items-center gap-6 mb-6">
        {/* Izquierda: Anillo de progreso de presupuesto gastado */}
        <div className="flex flex-col items-center">
          <p className="text-label font-body text-ink-muted mb-2">Gasto</p>
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
              {/* Pista de fondo */}
              <circle
                cx="40"
                cy="40"
                r={radio}
                fill="none"
                strokeWidth="8"
                className="stroke-bg-surface"
              />
              {/* Progreso de gasto */}
              <circle
                cx="40"
                cy="40"
                r={radio}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-status-activo-text transition-all duration-500 ease-in-out"
                strokeDasharray={circunferencia}
                strokeDashoffset={desplazamiento}
              />
            </svg>
            {/* Porcentaje centrado dentro del anillo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-h3 font-display text-ink-primary">
                {Math.round(porcentajeGastado)}%
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Presupuesto restante y barra lineal de días */}
        <div className="flex-1 flex flex-col gap-2">
          <div>
            <p className="text-label font-body text-ink-muted">Te quedan</p>
            <p className="text-body font-body text-ink-primary">{formatearMoneda(presupuestoRestante)}</p>
          </div>

          <p className="text-label font-body text-ink-muted">
            Día {diaActual} de {diasTotales}
          </p>

          {/* Barra de progreso lineal de días transcurridos */}
          <div className="bg-bg-surface h-2 rounded-full w-full overflow-hidden">
            <div
              className="bg-status-activo-text h-full rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${porcentajeDias}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sección inferior: gasto diario disponible (tarjeta blanca de solo texto) */}
      <div className="bg-bg-surface rounded-md p-4">
        <p className="text-body font-body text-ink-primary">Cada día restante puedes gastar</p>
        <p className="text-h3 font-display text-ink-primary mt-1">{formatearMoneda(presupuestoDiario)}</p>
      </div>

      {/* Acción principal: fuera y debajo de la tarjeta blanca */}
      {vistaActual === 'DEFAULT' && (
        <Button
          variant="tertiary"
          className="w-full mt-4"
          onClick={() => {
            setVistaActual('CALCULATOR');
            onCalcularPago?.();
          }}
        >
          Calcula si puedes pagarlo
        </Button>
      )}

      {vistaActual === 'CALCULATOR' && (
        <div className="mt-4">
          <p className="text-body font-body text-ink-primary mb-2">
            Ingresa el valor en la moneda local
          </p>

          <Input
            type="number"
            prefix="$"
            placeholder="Ej. $ 400"
            value={valorIngresado}
            onChange={(evento) => setValorIngresado(evento.target.value)}
          />

          <Button variant="primary" className="w-full mt-4" onClick={manejarCalculo}>
            Calcular
          </Button>
        </div>
      )}

      {/* Bloque de resultado: muestra el impacto del gasto sobre el presupuesto diario y total */}
      {(vistaActual === 'RESULT_GOOD' || vistaActual === 'RESULT_BAD') && (
        <>
          <div
            className={[
              'border rounded-md p-4 mt-4 mb-4',
              vistaActual === 'RESULT_BAD'
                ? 'border-alert-max bg-alert-max/20'
                : 'border-status-activo-text bg-status-activo-text/10',
            ].join(' ')}
          >
            <p className="text-body font-body text-ink-primary">El gasto representaría</p>

            <div className="flex justify-evenly gap-8 mt-2">
              {/* Columna 1: porcentaje sobre el presupuesto diario */}
              <div className="flex flex-col items-center text-center">
                <p className="text-h2 font-display text-ink-primary">
                  {porcentajesCalculados.porcentajeDiario}%
                </p>
                <p className="text-label font-body text-ink-muted">De tu presupuesto diario</p>
              </div>

              {/* Columna 2: porcentaje sobre el presupuesto total */}
              <div className="flex flex-col items-center text-center">
                <p className="text-h2 font-display text-ink-primary">
                  {porcentajesCalculados.porcentajeTotal}%
                </p>
                <p className="text-label font-body text-ink-muted">De tu presupuesto total</p>
              </div>
            </div>
          </div>

          {/* Nota: "outline" corresponde a la variante 'secondary' de Button.jsx */}
          <Button variant="secondary" className="w-full" onClick={reiniciarCalculadora}>
            Nuevo calculo
          </Button>
        </>
      )}

      {/* Overlay de confirmación: se superpone a la vista actual sin alterarla */}
      {mostrarConfirmacion && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center bg-status-activo-bg/40 backdrop-blur-md">
          <p className="text-h3 font-display text-ink-primary">¿Ya ha terminado su viaje?</p>

          <Button variant="primary" className="w-full mt-6" onClick={manejarConfirmacionFinalizar}>
            Sí, mostrar reporte de gastos
          </Button>

          <button
            type="button"
            className="text-body text-ink-primary mt-4 hover:opacity-70 transition-opacity"
            onClick={() => setMostrarConfirmacion(false)}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default TripActiveCard;
