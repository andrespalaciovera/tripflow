import React, { useMemo, useState } from 'react';
import Button from './Button';
import Input from './Input';

/**
 * Lista fija de destinos disponibles para el MVP, cada uno asociado
 * a la moneda en la que normalmente se factura ese país.
 */
const DESTINOS = [
  { pais: 'USA', moneda: 'USD' },
  { pais: 'España', moneda: 'EUR' },
  { pais: 'Italia', moneda: 'EUR' },
  { pais: 'Francia', moneda: 'EUR' },
  { pais: 'Alemania', moneda: 'EUR' },
  { pais: 'México', moneda: 'MXN' },
  { pais: 'Colombia', moneda: 'COP' },
];

/**
 * Tasas de cambio fijas para el MVP: cuántos COP equivalen a 1 unidad
 * de cada moneda extranjera. Colombia no necesita tasa (ya está en COP).
 */
const TASAS_DE_CAMBIO_A_COP = {
  USD: 4000,
  EUR: 4300,
  MXN: 230,
};

/** Presupuestos sugeridos según el motivo del viaje (en COP) */
const PRESUPUESTO_SUGERIDO = {
  vacaciones: 7000000,
  negocios: 4000000,
};

/**
 * Icono de flecha para el <select> de destino (reemplaza la flecha nativa).
 */
const IconoFlecha = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4 text-ink-muted"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

/**
 * Icono de calendario usado como prefijo de los campos de fecha.
 */
const IconoCalendario = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="w-4 h-4 text-ink-muted"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
    />
  </svg>
);

/**
 * Icono de cierre 'X' para el botón del encabezado del drawer.
 */
const IconoCerrar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

/**
 * NewTripDrawer — Panel lateral "organismo" para crear un nuevo viaje.
 *
 * Reproduce el layout definido en Figma (nodo 27:7250): un drawer deslizante
 * anclado a la derecha, con selección de destino, motivo del viaje (toggle
 * segmentado), fechas y presupuesto con conversión automática de moneda.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla si el drawer está visible
 * @param {Function} props.onClose - Se dispara al cerrar el drawer (X o Cancelar)
 * @param {Function} props.onSave - Se dispara con los datos del nuevo viaje al crear
 */
export const NewTripDrawer = ({ isOpen, onClose, onSave }) => {
  // Destino elegido (nombre del país); vacío = "Selecciona un destino"
  const [destino, setDestino] = useState('');

  // Motivo del viaje: define además el presupuesto sugerido por defecto
  const [motivo, setMotivo] = useState('vacaciones');

  // Fechas del viaje (formato nativo de <input type="date">)
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Presupuesto en COP; arranca en el valor sugerido para "vacaciones"
  const [presupuesto, setPresupuesto] = useState(PRESUPUESTO_SUGERIDO.vacaciones);

  // Destino completo (país + moneda) según lo seleccionado
  const destinoSeleccionado = useMemo(
    () => DESTINOS.find((d) => d.pais === destino),
    [destino]
  );

  /**
   * Cambia el motivo del viaje y autocompleta el presupuesto sugerido
   * correspondiente (Regla de negocio 1).
   */
  const manejarCambioDeMotivo = (nuevoMotivo) => {
    setMotivo(nuevoMotivo);
    setPresupuesto(PRESUPUESTO_SUGERIDO[nuevoMotivo]);
  };

  /**
   * Calcula el presupuesto convertido a la moneda del destino elegido
   * (Regla de negocio 2). Devuelve null si no aplica (sin destino,
   * destino en Colombia, o presupuesto vacío/ inválido).
   */
  const presupuestoConvertido = useMemo(() => {
    if (!destinoSeleccionado || destinoSeleccionado.moneda === 'COP') return null;

    const montoEnCop = Number(presupuesto);
    if (!montoEnCop || Number.isNaN(montoEnCop)) return null;

    const tasa = TASAS_DE_CAMBIO_A_COP[destinoSeleccionado.moneda];
    const montoConvertido = montoEnCop / tasa;

    return `≈ ${montoConvertido.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })} ${destinoSeleccionado.moneda}`;
  }, [destinoSeleccionado, presupuesto]);

  /** Reinicia el formulario a sus valores por defecto */
  const reiniciarFormulario = () => {
    setDestino('');
    setMotivo('vacaciones');
    setFechaInicio('');
    setFechaFin('');
    setPresupuesto(PRESUPUESTO_SUGERIDO.vacaciones);
  };

  /** Envía los datos del nuevo viaje al componente padre */
  const manejarCrearViaje = () => {
    onSave({
      destino,
      moneda: destinoSeleccionado?.moneda ?? 'COP',
      motivo,
      fechaInicio,
      fechaFin,
      presupuesto: Number(presupuesto) || 0,
    });
    reiniciarFormulario();
  };

  /** Cierra el drawer sin guardar cambios */
  const manejarCancelar = () => {
    reiniciarFormulario();
    onClose();
  };

  // El drawer no se renderiza en absoluto si está cerrado
  if (!isOpen) return null;

  return (
    <>
      {/* Fondo oscuro semitransparente que cubre toda la pantalla */}
      <div className="fixed inset-0 bg-ink-primary/40 z-40" onClick={manejarCancelar} />

      {/* Panel deslizante anclado al borde derecho */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-navbar-forms shadow-soft z-50 overflow-y-auto flex flex-col">
        {/* Encabezado del drawer */}
        <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-stroke-form shrink-0">
          <h3 className="text-h3 font-display text-ink-primary">Nuevo viaje</h3>
          <button
            type="button"
            onClick={manejarCancelar}
            aria-label="Cerrar"
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink-primary hover:bg-bg-list-item transition-colors"
          >
            <IconoCerrar />
          </button>
        </div>

        {/* Cuerpo del formulario */}
        <div className="flex-1 flex flex-col gap-6 px-6 py-6">
          {/* Campo 1: Lugar */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-label font-body text-ink-primary">Lugar</label>
            <div className="relative w-full">
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full h-14 appearance-none bg-surface border border-stroke-form rounded-md px-4 pr-10 text-body text-ink-primary outline-none focus:border-ink-primary transition-colors"
              >
                <option value="" disabled>
                  Selecciona un destino
                </option>
                {DESTINOS.map((d) => (
                  <option key={d.pais} value={d.pais}>
                    {d.pais}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <IconoFlecha />
              </span>
            </div>
          </div>

          {/* Campo 2: Motivo de viaje (toggle segmentado) */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-label font-body text-ink-primary">Motivo de viaje</label>
            <div className="flex items-center bg-stroke-form rounded-full p-1 w-full">
              <button
                type="button"
                onClick={() => manejarCambioDeMotivo('vacaciones')}
                className={`flex-1 py-3 rounded-full text-body text-center transition-colors ${
                  motivo === 'vacaciones' ? 'bg-ink-primary text-bg-surface' : 'text-ink-muted'
                }`}
              >
                Vacaciones
              </button>
              <button
                type="button"
                onClick={() => manejarCambioDeMotivo('negocios')}
                className={`flex-1 py-3 rounded-full text-body text-center transition-colors ${
                  motivo === 'negocios' ? 'bg-ink-primary text-bg-surface' : 'text-ink-muted'
                }`}
              >
                Negocios
              </button>
            </div>
          </div>

          {/* Campo 3: Fechas del viaje */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-label font-body text-ink-primary">Fechas del viaje</label>
            <div className="flex gap-4 w-full">
              <Input
                type="date"
                prefix={<IconoCalendario />}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
              <Input
                type="date"
                prefix={<IconoCalendario />}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          {/* Campo 4: Presupuesto */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-label font-body text-ink-primary">Presupuesto</label>
            <Input
              type="number"
              prefix="COP"
              placeholder="Ej. 5.000.000"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
            />
            {/* Conversión dinámica: se oculta si el destino es Colombia o no hay destino */}
            {presupuestoConvertido && (
              <span className="text-label text-ink-muted px-1">{presupuestoConvertido}</span>
            )}
          </div>
        </div>

        {/* Acciones del drawer */}
        <div className="flex flex-col gap-4 px-6 pt-6 pb-6 border-t border-stroke-form shrink-0">
          <Button variant="primary" className="w-full" onClick={manejarCrearViaje}>
            Crear viaje
          </Button>
          <button
            type="button"
            onClick={manejarCancelar}
            className="text-body text-ink-primary text-center hover:opacity-70 transition-opacity"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
};

export default NewTripDrawer;
