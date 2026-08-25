import React, { useRef, useState } from 'react';
import Button from './Button';
import Input from './Input';
import { saveExpense } from '../lib/store';

/**
 * Icono de "renombrar" (fluent:rename-16-regular) usado como prefijo
 * del campo "Nombre del gasto", reproducido en SVG para heredar currentColor.
 */
const IconoRenombrar = () => (
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
      d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.828 18.46a3 3 0 0 1-1.263.752l-3.06.918a.375.375 0 0 1-.465-.465l.918-3.06a3 3 0 0 1 .752-1.263l11.153-11.155Z"
    />
  </svg>
);

/**
 * Icono de cámara/foto para la zona de subida de recibos.
 */
const IconoFoto = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-10 h-10 text-ink-muted"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574v9.176c0 1.24 1.01 2.25 2.25 2.25h15c1.24 0 2.25-1.01 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.822 1.316Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
  </svg>
);

/** Fecha de hoy en formato nativo de <input type="date"> (YYYY-MM-DD) */
const obtenerFechaDeHoy = () => new Date().toISOString().slice(0, 10);

/**
 * AddExpensesForm — Formulario "organismo" para agregar un gasto del viaje Activo.
 *
 * Combina los componentes reutilizables <Button /> e <Input /> para reproducir
 * los estados "vacío" y "lleno" definidos en Figma (nodos 27:6610 y 27:6611).
 * Un único bloque de gasto (foto + Nombre/Monto/Fecha) por envío — registrar
 * varios gastos desde varias fotos en un mismo envío está fuera de alcance
 * del MVP (AGENTS.md §8), así que este formulario nunca genera más de un
 * bloque: si se adjunta una foto, por ahora solo se guarda como referencia
 * visual y el usuario sigue completando Título/Monto/Fecha a mano (la
 * extracción por IA es un trabajo aparte, todavía no implementado).
 *
 * Guarda el gasto directamente con saveExpense() de /lib/store.js — este
 * componente es el único responsable de persistirlo; el padre solo necesita
 * reaccionar a onGuardar para refrescar sus datos derivados (lista de gastos
 * recientes y números de presupuesto del viaje Activo).
 *
 * @param {Object} props
 * @param {string} props.tripId - Id del viaje Activo al que pertenece el gasto (AGENTS.md §6:
 *   este panel solo tiene sentido en el contexto del viaje Activo)
 * @param {Function} [props.onGuardar] - Se dispara con el gasto ya guardado (incluye id) al presionar "Guardar"
 * @param {Function} [props.onCancelar] - Se dispara al presionar "Cancelar"
 * @param {string} [props.className] - Clases adicionales para el contenedor raíz
 */
export const AddExpensesForm = ({ tripId, onGuardar = () => {}, onCancelar = () => {}, className = '' }) => {
  // Controla si el formulario sigue montado en pantalla.
  // No es un "acordeón": el formulario lo monta un disparador externo,
  // y al cancelar desaparece por completo (no queda un encabezado colapsado).
  const [isVisible, setIsVisible] = useState(true);

  // Campos del único gasto que este formulario puede crear
  const [titulo, setTitulo] = useState('');
  const [monto, setMonto] = useState('');
  // Fecha por defecto: hoy (AGENTS.md §7), editable
  const [fecha, setFecha] = useState(obtenerFechaDeHoy);

  // Miniatura de la foto adjunta, si el usuario adjuntó una. Puramente visual
  // en este paso: no se envía ni se procesa (ver nota de alcance arriba).
  const [fotoUrl, setFotoUrl] = useState(null);

  // Mensajes de validación por campo; vacío = sin error
  const [errores, setErrores] = useState({ titulo: '', monto: '', fecha: '' });

  // Referencia al input de tipo archivo (oculto)
  const inputFotoRef = useRef(null);

  const abrirSelectorDeFoto = () => {
    inputFotoRef.current?.click();
  };

  /**
   * Guarda la miniatura de la primera foto seleccionada como referencia visual.
   * Si se seleccionan varias, el resto se ignora: un solo bloque de gasto por
   * envío (AGENTS.md §8).
   */
  const manejarSeleccionDeFoto = (evento) => {
    const [primeraFoto] = Array.from(evento.target.files || []);
    if (!primeraFoto) return;

    setFotoUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return URL.createObjectURL(primeraFoto);
    });

    // Limpia el input para permitir volver a seleccionar el mismo archivo
    evento.target.value = '';
  };

  /** Quita la foto adjunta (y libera su URL de miniatura) */
  const eliminarFoto = () => {
    setFotoUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return null;
    });
  };

  /** Valida título no vacío, monto positivo y fecha presente */
  const validarFormulario = () => {
    const nuevosErrores = { titulo: '', monto: '', fecha: '' };

    if (!titulo.trim()) {
      nuevosErrores.titulo = 'Ingresa un nombre para el gasto.';
    }

    const montoNumerico = Number(monto);
    if (!monto || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
      nuevosErrores.monto = 'Ingresa un monto válido, mayor a 0.';
    }

    if (!fecha) {
      nuevosErrores.fecha = 'Selecciona una fecha.';
    }

    return nuevosErrores;
  };

  /** Reinicia todos los campos a sus valores por defecto */
  const reiniciarFormulario = () => {
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    setTitulo('');
    setMonto('');
    setFecha(obtenerFechaDeHoy());
    setFotoUrl(null);
    setErrores({ titulo: '', monto: '', fecha: '' });
  };

  /**
   * Valida, construye el Expense (AGENTS.md §3) y lo persiste con saveExpense().
   * Si hay errores, el panel permanece abierto y se muestran junto a cada campo.
   */
  const manejarGuardar = () => {
    const nuevosErrores = validarFormulario();
    const hayErrores = Object.values(nuevosErrores).some(Boolean);

    if (hayErrores) {
      setErrores(nuevosErrores);
      return;
    }

    const gasto = {
      trip_id: tripId,
      titulo: titulo.trim(),
      monto: Number(monto),
      fecha,
      origen: 'manual',
      creado_en: new Date().toISOString(),
    };

    const registroGuardado = saveExpense(gasto);

    reiniciarFormulario();
    onGuardar(registroGuardado);
  };

  const manejarCancelar = () => {
    reiniciarFormulario();
    onCancelar();
    // El formulario desaparece por completo: no queda un encabezado colapsado
    setIsVisible(false);
  };

  // Si el formulario fue cancelado, no se renderiza nada.
  // (El componente padre también puede optar por desmontarlo directamente
  // en su propio manejador de onCancelar; esto es un respaldo interno.)
  if (!isVisible) return null;

  return (
    <div className={`bg-bg-navbar-forms rounded-lg shadow-soft p-6 ${className}`}>
      {/* Encabezado del formulario */}
      <div className="flex justify-between items-center">
        <h3 className="text-h3 font-display text-ink-primary">Agregar gastos</h3>
      </div>

      {/* Cuerpo del formulario */}
      <div className="flex flex-col gap-6 mt-6">
        {/* Input de archivo oculto para la zona de carga */}
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={manejarSeleccionDeFoto}
        />

        {/* Único bloque: foto + campos */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="relative shrink-0">
            {fotoUrl ? (
              /* Ya hay una foto asociada: se muestra la miniatura */
              <>
                <img
                  src={fotoUrl}
                  alt={`Recibo de ${titulo || 'gasto'}`}
                  className="w-28 h-28 rounded-md object-cover border border-stroke-form bg-surface"
                />
                <Button
                  variant="icon-delete"
                  aria-label="Eliminar recibo"
                  onClick={eliminarFoto}
                  className="!w-7 !h-7 absolute -top-2 -left-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </Button>
              </>
            ) : (
              /* Todavía no hay foto: se muestra la zona de carga */
              <button
                type="button"
                onClick={abrirSelectorDeFoto}
                className="flex flex-col items-center justify-center gap-1 min-h-[160px] w-full md:w-[219px] shrink-0 px-8 py-8 rounded-md border-2 border-dashed border-stroke-form bg-surface text-center transition-colors hover:border-ink-primary/30"
              >
                <IconoFoto />
                <span className="text-body text-ink-primary mt-2">
                  Toma una o varias fotos de tus recibos
                </span>
                <span className="text-label text-ink-muted">También puedes arrastrarlas aquí</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 flex-1 w-full">
            <div className="flex flex-col gap-1.5">
              <Input
                label="Nombre del gasto"
                prefix={<IconoRenombrar />}
                placeholder="Comida"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              {errores.titulo && <span className="text-label text-alert-max px-1">{errores.titulo}</span>}
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col gap-1.5 w-full">
                <Input
                  label="Monto"
                  type="number"
                  prefix="$"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
                {errores.monto && <span className="text-label text-alert-max px-1">{errores.monto}</span>}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <Input
                  label="Fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
                {errores.fecha && <span className="text-label text-alert-max px-1">{errores.fecha}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones del formulario */}
        <div className="flex flex-col gap-4 items-center pt-2">
          <Button variant="primary" className="w-full" onClick={manejarGuardar}>
            Guardar
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
    </div>
  );
};

export default AddExpensesForm;
