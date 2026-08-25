import React, { useEffect, useMemo, useState } from 'react';
import Button from './Button';
import Input from './Input';
import CountrySelect from './CountrySelect';
import DatePicker from './DatePicker';
import { saveTrip } from '../lib/store';
import { calcularDiasTotales, obtenerPresupuestoSugerido, derivarMonedaDesdePais, convertirCOPaLocal } from '../lib/budget';

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
 * Al confirmar, construye el objeto Trip exacto del modelo de datos
 * (AGENTS.md §3) y lo persiste con saveTrip() de /lib/store.js — este
 * componente es el único responsable de guardar el nuevo viaje; el padre
 * solo necesita reaccionar a onSave para refrescar su lista.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla si el drawer está visible
 * @param {Function} props.onClose - Se dispara al cerrar el drawer (X, overlay o Cancelar)
 * @param {Function} [props.onSave] - Se dispara con el registro de Trip ya guardado (incluye id)
 */
export const NewTripDrawer = ({ isOpen, onClose, onSave }) => {
  // Destino elegido (nombre del país); vacío = "Selecciona un destino"
  const [destino, setDestino] = useState('');

  // Motivo del viaje: define además el presupuesto sugerido por defecto
  const [motivo, setMotivo] = useState('vacaciones');

  // Fechas del viaje (formato nativo de <input type="date">)
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Presupuesto en COP, como texto (tal como lo escribe el usuario en el input)
  const [presupuesto, setPresupuesto] = useState('');

  // true en cuanto el usuario edita el campo Presupuesto a mano: a partir de
  // ahí el auto-relleno sugerido deja de sobrescribirlo (regla de negocio: el
  // campo sigue siendo editable, la sugerencia solo pre-llena un valor inicial).
  const [presupuestoTocado, setPresupuestoTocado] = useState(false);

  // Mensajes de validación por campo; vacío = sin error
  const [errores, setErrores] = useState({ pais: '', fechas: '', presupuesto: '' });

  /**
   * Auto-relleno del presupuesto sugerido (AGENTS.md §3): en cuanto motivo y
   * ambas fechas están definidos, sugiere presupuesto_diario × diasTotales —
   * pero nunca si el usuario ya escribió un valor manualmente.
   */
  useEffect(() => {
    if (presupuestoTocado) return;
    if (!fechaInicio || !fechaFin) return;

    const diasTotales = calcularDiasTotales(fechaInicio, fechaFin);
    setPresupuesto(String(obtenerPresupuestoSugerido(motivo, diasTotales)));
  }, [motivo, fechaInicio, fechaFin, presupuestoTocado]);

  /** Marca el presupuesto como editado a mano y actualiza su valor */
  const manejarCambioDePresupuesto = (valor) => {
    setPresupuestoTocado(true);
    setPresupuesto(valor);
  };

  /**
   * Vista previa de conversión (AGENTS.md §7): muestra a cuánto equivale el
   * presupuesto (siempre en COP) en la moneda local del destino elegido.
   * Se oculta si no hay destino, el destino es Colombia (misma moneda) o el
   * presupuesto todavía no es un número válido. Solo es una vista — el valor
   * almacenado (presupuesto_total) siempre queda en COP.
   */
  const presupuestoConvertidoPreview = useMemo(() => {
    if (!destino || destino === 'Colombia') return null;

    const montoEnCop = Number(presupuesto);
    if (!montoEnCop || Number.isNaN(montoEnCop) || montoEnCop <= 0) return null;

    const montoConvertido = convertirCOPaLocal(montoEnCop, destino);
    const moneda = derivarMonedaDesdePais(destino);

    return `≈ $${montoConvertido.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${moneda}`;
  }, [destino, presupuesto]);

  /** Reinicia el formulario a sus valores por defecto */
  const reiniciarFormulario = () => {
    setDestino('');
    setMotivo('vacaciones');
    setFechaInicio('');
    setFechaFin('');
    setPresupuesto('');
    setPresupuestoTocado(false);
    setErrores({ pais: '', fechas: '', presupuesto: '' });
  };

  /**
   * Valida los campos del formulario (país seleccionado, ambas fechas con fin
   * no anterior a inicio, presupuesto positivo). Devuelve el mapa de errores;
   * vacío en todos los campos significa que el formulario es válido.
   */
  const validarFormulario = () => {
    const nuevosErrores = { pais: '', fechas: '', presupuesto: '' };

    if (!destino) {
      nuevosErrores.pais = 'Selecciona un destino.';
    }

    if (!fechaInicio || !fechaFin) {
      nuevosErrores.fechas = 'Selecciona la fecha de inicio y de fin.';
    } else if (new Date(fechaFin) < new Date(fechaInicio)) {
      nuevosErrores.fechas = 'La fecha de fin no puede ser anterior a la de inicio.';
    }

    const presupuestoNumerico = Number(presupuesto);
    if (!presupuesto || Number.isNaN(presupuestoNumerico) || presupuestoNumerico <= 0) {
      nuevosErrores.presupuesto = 'Ingresa un presupuesto válido, mayor a 0.';
    }

    return nuevosErrores;
  };

  /**
   * Valida, construye el Trip (AGENTS.md §3) y lo persiste con saveTrip().
   * Si hay errores, el drawer permanece abierto y se muestran junto a cada campo.
   */
  const manejarCrearViaje = () => {
    const nuevosErrores = validarFormulario();
    const hayErrores = Object.values(nuevosErrores).some(Boolean);

    if (hayErrores) {
      setErrores(nuevosErrores);
      return;
    }

    const trip = {
      nombre: destino, // AGENTS.md §3: el nombre del viaje es el propio país
      pais: destino,
      moneda: derivarMonedaDesdePais(destino),
      motivo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      presupuesto_total: Number(presupuesto),
      finalizado_manualmente: false,
    };

    const registroGuardado = saveTrip(trip);

    reiniciarFormulario();
    onSave?.(registroGuardado);
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
        <div className="flex-1 flex flex-col gap-4 px-5 py-5">
          {/* Campo 1: Lugar */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-label font-body text-ink-primary">Lugar</label>
            <CountrySelect
              value={destino}
              onChange={setDestino}
            />
            {errores.pais && <span className="text-label text-alert-max px-1">{errores.pais}</span>}
          </div>

          {/* Campo 2: Motivo de viaje (toggle segmentado) */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-label font-body text-ink-primary">Motivo de viaje</label>
            <div className="flex items-center bg-stroke-form rounded-full p-1 w-full">
              <button
                type="button"
                onClick={() => setMotivo('vacaciones')}
                className={`flex-1 py-3 rounded-full text-body text-center transition-colors ${
                  motivo === 'vacaciones' ? 'bg-ink-primary text-bg-surface' : 'text-ink-muted'
                }`}
              >
                Vacaciones
              </button>
              <button
                type="button"
                onClick={() => setMotivo('negocios')}
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
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="flex-1 min-w-0">
                <DatePicker
                  value={fechaInicio}
                  onChange={setFechaInicio}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DatePicker
                  value={fechaFin}
                  onChange={setFechaFin}
                />
              </div>
            </div>
            {errores.fechas && <span className="text-label text-alert-max px-1">{errores.fechas}</span>}
          </div>

          {/* Campo 4: Presupuesto */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-label font-body text-ink-primary">Presupuesto</label>
            <Input
              type="number"
              prefix="COP"
              placeholder="Ej. 5.000.000"
              value={presupuesto}
              onChange={(e) => manejarCambioDePresupuesto(e.target.value)}
            />
            {errores.presupuesto ? (
              <span className="text-label text-alert-max px-1">{errores.presupuesto}</span>
            ) : (
              /* Conversión dinámica: se oculta si el destino es Colombia o no hay destino */
              presupuestoConvertidoPreview && (
                <span className="text-label text-ink-muted px-1">{presupuestoConvertidoPreview}</span>
              )
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
