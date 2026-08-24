import React, { useRef, useState } from 'react';
import Button from './Button';
import Input from './Input';

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

/** Genera un identificador único y legible para cada bloque de gasto */
const generarId = () => `gasto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Crea un objeto de gasto vacío (sin foto ni datos capturados aún) */
const crearGastoVacio = () => ({
  id: generarId(),
  nombre: '',
  monto: '',
  fecha: '',
  fotoUrl: null,
});

/**
 * AddExpensesForm — Formulario "organismo" para agregar gastos de un viaje.
 *
 * Combina los componentes reutilizables <Button /> e <Input /> para reproducir
 * los estados "vacío" y "lleno" definidos en Figma (nodos 27:6610 y 27:6611).
 * Cada bloque de gasto es independiente: puede tener o no una foto de recibo
 * asociada, y todos viven en un único arreglo de estado.
 *
 * @param {Object} props
 * @param {Function} [props.onGuardar] - Se dispara con la lista de gastos al presionar "Guardar"
 * @param {Function} [props.onCancelar] - Se dispara al presionar "Cancelar"
 * @param {string} [props.className] - Clases adicionales para el contenedor raíz
 */
export const AddExpensesForm = ({ onGuardar = () => {}, onCancelar = () => {}, className = '' }) => {
  // Controla si el formulario sigue montado en pantalla.
  // No es un "acordeón": el formulario lo monta un disparador externo,
  // y al cancelar desaparece por completo (no queda un encabezado colapsado).
  const [isVisible, setIsVisible] = useState(true);

  // Arreglo único con todos los bloques de gasto. Arranca con un solo bloque vacío,
  // que se ve como la "zona de carga" + campos en blanco (estado vacío del diseño).
  const [gastos, setGastos] = useState(() => [crearGastoVacio()]);

  // Id del gasto que está solicitando una foto en este momento (el bloque que
  // disparó el selector de archivos), para saber a cuál de todos asignársela.
  const [idFotoObjetivo, setIdFotoObjetivo] = useState(null);

  // Referencia al input de tipo archivo (oculto), compartido por todos los bloques
  const inputFotoRef = useRef(null);

  /** Agrega un nuevo bloque de gasto vacío al final del arreglo */
  const agregarBloqueVacio = () => {
    setGastos((anteriores) => [...anteriores, crearGastoVacio()]);
  };

  /** Abre el selector de archivos para asociar una foto a un gasto puntual */
  const abrirSelectorDeFoto = (id) => {
    setIdFotoObjetivo(id);
    inputFotoRef.current?.click();
  };

  /**
   * Asocia la foto seleccionada al gasto que la solicitó (idFotoObjetivo).
   * Si se seleccionan varias fotos a la vez, la primera se asigna al bloque
   * que disparó la carga y el resto genera bloques nuevos, cada uno con su foto.
   */
  const manejarSeleccionDeFoto = (evento) => {
    const archivos = Array.from(evento.target.files || []);
    if (archivos.length === 0 || !idFotoObjetivo) return;

    const [primeraFoto, ...fotosRestantes] = archivos;

    setGastos((anteriores) => {
      const conFotoAsignada = anteriores.map((gasto) =>
        gasto.id === idFotoObjetivo
          ? { ...gasto, fotoUrl: URL.createObjectURL(primeraFoto) }
          : gasto
      );

      const bloquesAdicionales = fotosRestantes.map((archivo) => ({
        ...crearGastoVacio(),
        fotoUrl: URL.createObjectURL(archivo),
      }));

      return [...conFotoAsignada, ...bloquesAdicionales];
    });

    setIdFotoObjetivo(null);
    // Limpia el input para permitir volver a seleccionar el mismo archivo
    evento.target.value = '';
  };

  /** Elimina un bloque de gasto (y libera la URL de su miniatura, si tenía) */
  const eliminarGasto = (id) => {
    setGastos((anteriores) => {
      const gasto = anteriores.find((g) => g.id === id);
      if (gasto?.fotoUrl) URL.revokeObjectURL(gasto.fotoUrl);
      return anteriores.filter((g) => g.id !== id);
    });
  };

  /** Actualiza un campo (nombre, monto o fecha) de un gasto puntual por su id */
  const actualizarCampoDeGasto = (id, campo, valor) => {
    setGastos((anteriores) =>
      anteriores.map((g) => (g.id === id ? { ...g, [campo]: valor } : g))
    );
  };

  const manejarGuardar = () => {
    onGuardar(gastos);
  };

  const manejarCancelar = () => {
    gastos.forEach((g) => {
      if (g.fotoUrl) URL.revokeObjectURL(g.fotoUrl);
    });
    setGastos([crearGastoVacio()]);
    setIdFotoObjetivo(null);
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
        <Button variant="icon-add" aria-label="Agregar otro gasto" onClick={agregarBloqueVacio}>
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

      {/* Cuerpo del formulario */}
      <div className="flex flex-col gap-6 mt-6">
        {/* Input de archivo oculto, compartido por todas las zonas de carga */}
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={manejarSeleccionDeFoto}
        />

        {/* Un bloque completo (foto + campos) por cada gasto del arreglo */}
        {gastos.map((gasto) => (
          <div key={gasto.id} className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative shrink-0">
              {gasto.fotoUrl ? (
                /* El gasto ya tiene una foto asociada: se muestra la miniatura */
                <>
                  <img
                    src={gasto.fotoUrl}
                    alt={`Recibo de ${gasto.nombre || 'gasto'}`}
                    className="w-28 h-28 rounded-md object-cover border border-stroke-form bg-surface"
                  />
                  <Button
                    variant="icon-delete"
                    aria-label="Eliminar recibo"
                    onClick={() => eliminarGasto(gasto.id)}
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
                /* El gasto todavía no tiene foto: se muestra la zona de carga */
                <button
                  type="button"
                  onClick={() => abrirSelectorDeFoto(gasto.id)}
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
              <Input
                label="Nombre del gasto"
                prefix={<IconoRenombrar />}
                placeholder="Comida"
                value={gasto.nombre}
                onChange={(e) => actualizarCampoDeGasto(gasto.id, 'nombre', e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-6">
                <Input
                  label="Monto"
                  type="number"
                  prefix="$"
                  placeholder="0.00"
                  value={gasto.monto}
                  onChange={(e) => actualizarCampoDeGasto(gasto.id, 'monto', e.target.value)}
                />
                <Input
                  label="Fecha"
                  type="date"
                  value={gasto.fecha}
                  onChange={(e) => actualizarCampoDeGasto(gasto.id, 'fecha', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

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
