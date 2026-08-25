import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from './Button';
import Input from './Input';
import { saveExpense } from '../lib/store';
import { convertirLocalACOP, derivarMonedaDesdePais, formatearMoneda } from '../lib/budget';

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

// Lista fija de mensajes lúdicos que rotan mientras /api/extract-receipt está
// en vuelo, en reemplazo del rótulo estático "Analizando recibo..."
// (AGENTS.md → "Receipt extraction UX states"). Si la extracción tarda más
// que el ciclo completo, simplemente vuelve a empezar desde el primero.
const MENSAJES_EXTRACCION = [
  'Leyendo tu factura...',
  'Equilibrando la luz...',
  'Poniéndome los anteojos...',
  'Descifrando jeroglíficos...',
  'Contando los ceros...',
  'Afinando la vista...',
  'Ya casi...',
];

/** Cada cuánto avanza el índice de MENSAJES_EXTRACCION (AGENTS.md: "~3 segundos") */
const INTERVALO_MENSAJE_EXTRACCION_MS = 3000;

// Tope observado en el spike: entre ~9 y ~40s según qué modelo gratuito eligió
// el auto-router de OpenRouter. Un poco por encima del peor caso, para que la
// extracción nunca deje al usuario esperando indefinidamente (ver punto 4 del task).
const TIMEOUT_EXTRACCION_MS = 45000;

/** Lee un File y lo devuelve como data URL en base64 (mismo método que test-receipt.html). */
const leerComoDataURL = (archivo) =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(archivo);
  });

/**
 * Llama a /api/extract-receipt con la misma forma de solicitud que
 * test-receipt.html ({ image: dataUrl }), con un timeout de cliente. Nunca
 * lanza: cualquier falla (red, timeout, status no-200, JSON inválido) se
 * resuelve como { monto: null, comercio: null } — la extracción es una
 * conveniencia opcional, jamás debe bloquear ni ensuciar la UI con un error.
 * @param {File} archivo
 * @returns {Promise<{ monto: number|null, comercio: string|null }>}
 */
const extraerDatosDeRecibo = async (archivo) => {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_EXTRACCION_MS);

  try {
    const dataUrl = await leerComoDataURL(archivo);

    console.log('extraerDatosDeRecibo: llamando a POST /api/extract-receipt...');
    const respuesta = await fetch('/api/extract-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
      signal: controlador.signal,
    });

    if (!respuesta.ok) {
      console.log('extraerDatosDeRecibo: respuesta no-OK, status', respuesta.status);
      console.error('extraerDatosDeRecibo: /api/extract-receipt respondió', respuesta.status);
      return { monto: null, comercio: null };
    }

    const cuerpo = await respuesta.json();
    console.log('extraerDatosDeRecibo: respuesta recibida ->', cuerpo);
    return {
      monto: typeof cuerpo?.monto === 'number' ? cuerpo.monto : null,
      comercio: typeof cuerpo?.comercio === 'string' ? cuerpo.comercio : null,
    };
  } catch (error) {
    // Incluye AbortError (timeout) y fallas de red: mismo resultado silencioso.
    console.log('extraerDatosDeRecibo: la solicitud falló (ver detalle abajo)');
    console.error('extraerDatosDeRecibo: extracción falló, se sigue con entrada manual.', error);
    return { monto: null, comercio: null };
  } finally {
    clearTimeout(temporizador);
  }
};

/**
 * AddExpensesForm — Formulario "organismo" para agregar un gasto del viaje Activo.
 *
 * Combina los componentes reutilizables <Button /> e <Input /> para reproducir
 * los estados "vacío" y "lleno" definidos en Figma (nodos 27:6610 y 27:6611).
 * Un único bloque de gasto (foto + Nombre/Monto/Fecha) por envío — registrar
 * varios gastos desde varias fotos en un mismo envío está fuera de alcance
 * del MVP (AGENTS.md §8), así que este formulario nunca genera más de un
 * bloque. Al adjuntar una foto, además de la miniatura, se llama en segundo
 * plano a /api/extract-receipt para pre-llenar Monto/Título si el modelo
 * logra leerlos — nunca bloquea el formulario ni sobrescribe lo que el
 * usuario ya haya escrito a mano ("capturar ahora, corregir después",
 * AGENTS.md §1). Mientras espera, un mensaje lúdico rota cada ~3s en vez del
 * antiguo rótulo estático; si la extracción falla del todo (red/timeout, o
 * ambos campos null) se lo comunica con un banner amistoso, no silencioso, y
 * si solo se extrajo uno de los dos campos avisa cuál falta completar a mano
 * (AGENTS.md → "Receipt extraction UX states").
 *
 * Guarda el gasto directamente con saveExpense() de /lib/store.js — este
 * componente es el único responsable de persistirlo; el padre solo necesita
 * reaccionar a onGuardar para refrescar sus datos derivados (lista de gastos
 * recientes y números de presupuesto del viaje Activo).
 *
 * @param {Object} props
 * @param {Object} props.trip - Viaje Activo al que pertenece el gasto (AGENTS.md §6: este panel
 *   solo tiene sentido en el contexto del viaje Activo). Se usa trip.id para el trip_id del
 *   Expense y trip.pais para saber en qué moneda local se está registrando el monto
 *   (AGENTS.md §3: Expense.monto siempre está en la moneda local del viaje, nunca en COP)
 * @param {Function} [props.onGuardar] - Se dispara con el gasto ya guardado (incluye id) al presionar "Guardar"
 * @param {Function} [props.onCancelar] - Se dispara al presionar "Cancelar"
 * @param {string} [props.className] - Clases adicionales para el contenedor raíz
 */
export const AddExpensesForm = ({ trip, onGuardar = () => {}, onCancelar = () => {}, className = '' }) => {
  const moneda = derivarMonedaDesdePais(trip?.pais);
  // Controla si el formulario sigue montado en pantalla.
  // No es un "acordeón": el formulario lo monta un disparador externo,
  // y al cancelar desaparece por completo (no queda un encabezado colapsado).
  const [isVisible, setIsVisible] = useState(true);

  // Campos del único gasto que este formulario puede crear
  const [titulo, setTitulo] = useState('');
  const [monto, setMonto] = useState('');
  // Fecha por defecto: hoy (AGENTS.md §7), editable
  const [fecha, setFecha] = useState(obtenerFechaDeHoy);

  // true en cuanto el usuario edita Título/Monto a mano: a partir de ahí, un
  // resultado de extracción que llegue después nunca los sobrescribe (mismo
  // principio que presupuestoTocado en NewTripDrawer). Son refs, no useState:
  // el callback de extracción se crea al elegir la foto y puede resolver
  // varios segundos después — con useState leería el valor "tocado" tal como
  // estaba en ESE momento (closure obsoleto), no si el usuario escribió
  // mientras tanto. Un ref siempre se lee al instante en que se consulta.
  const tituloTocadoRef = useRef(false);
  const montoTocadoRef = useRef(false);

  // Miniatura de la foto adjunta, si el usuario adjuntó una.
  const [fotoUrl, setFotoUrl] = useState(null);

  // true mientras /api/extract-receipt está en vuelo para la foto adjunta.
  // Solo controla el spinner sobre la miniatura — nunca deshabilita los
  // campos: la entrada manual siempre está disponible en paralelo
  // ("capturar ahora, corregir después", AGENTS.md §1).
  const [extrayendo, setExtrayendo] = useState(false);

  // Índice del mensaje lúdico actual dentro de MENSAJES_EXTRACCION, mientras
  // "extrayendo" es true. Avanza cada ~3s vía setInterval (ver más abajo).
  const [indiceMensajeExtraccion, setIndiceMensajeExtraccion] = useState(0);
  const intervaloMensajeRef = useRef(null);

  // Banner amistoso (no de error) tras resolverse la extracción: null cuando
  // no hay nada que comunicar (éxito total, o todavía no se adjuntó foto).
  // AGENTS.md → "Receipt extraction UX states": falla total, o éxito
  // parcial (solo monto o solo comercio) — nunca para el caso "ambos".
  const [avisoExtraccion, setAvisoExtraccion] = useState(null);

  /** Detiene y limpia el intervalo del mensaje rotativo, si hay uno activo. */
  const detenerRotacionDeMensajes = () => {
    if (intervaloMensajeRef.current) {
      clearInterval(intervaloMensajeRef.current);
      intervaloMensajeRef.current = null;
    }
  };

  // Permite cancelar una extracción en curso si el usuario cambia o quita la
  // foto antes de que responda, para que un resultado viejo nunca llegue a
  // pisar lo que el usuario ya haya escrito para la foto nueva.
  const extraccionEnCursoRef = useRef(0);

  // Mensajes de validación por campo; vacío = sin error
  const [errores, setErrores] = useState({ titulo: '', monto: '', fecha: '' });

  // Referencia al input de tipo archivo (oculto)
  const inputFotoRef = useRef(null);

  /**
   * Vista previa en vivo: a cuánto equivale en COP el monto que el usuario está
   * escribiendo (en la moneda local del viaje). Mismo patrón que la vista previa
   * de presupuesto en NewTripDrawer, para que el usuario nunca quede confundido
   * sobre en qué moneda está registrando el gasto.
   */
  const montoConvertidoPreview = useMemo(() => {
    if (!trip?.pais || trip.pais === 'Colombia') return null;

    const montoNumerico = Number(monto);
    if (!monto || Number.isNaN(montoNumerico) || montoNumerico <= 0) return null;

    const montoEnCop = convertirLocalACOP(montoNumerico, trip.pais);
    return `≈ ${formatearMoneda(montoEnCop)} COP`;
  }, [monto, trip?.pais]);

  // Limpia el intervalo del mensaje rotativo si el formulario se desmonta
  // mientras una extracción sigue en vuelo (evita setState tras desmontar).
  useEffect(() => () => detenerRotacionDeMensajes(), []);

  const abrirSelectorDeFoto = () => {
    inputFotoRef.current?.click();
  };

  /**
   * Guarda la miniatura de la primera foto seleccionada como referencia visual.
   * Si se seleccionan varias, el resto se ignora: un solo bloque de gasto por
   * envío (AGENTS.md §8). Además, dispara la extracción por IA en segundo
   * plano (sin bloquear el formulario) para pre-llenar Monto y Título.
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

    // Token de esta extracción: si el usuario cambia o quita la foto antes de
    // que responda, un resultado que llegue tarde se descarta silenciosamente.
    const tokenDeEstaExtraccion = extraccionEnCursoRef.current + 1;
    extraccionEnCursoRef.current = tokenDeEstaExtraccion;

    console.log('manejarSeleccionDeFoto: foto adjuntada, iniciando extracción en segundo plano...');
    setAvisoExtraccion(null); // limpia el banner de una extracción anterior, si quedaba alguno
    setExtrayendo(true);

    // Rótulo lúdico rotativo (AGENTS.md → "Receipt extraction UX states"):
    // arranca en el primer mensaje y avanza cada ~3s, dando la vuelta si la
    // extracción tarda más que la lista completa.
    detenerRotacionDeMensajes();
    setIndiceMensajeExtraccion(0);
    intervaloMensajeRef.current = setInterval(() => {
      setIndiceMensajeExtraccion((indiceAnterior) => (indiceAnterior + 1) % MENSAJES_EXTRACCION.length);
    }, INTERVALO_MENSAJE_EXTRACCION_MS);

    extraerDatosDeRecibo(primeraFoto)
      .then(({ monto: montoExtraido, comercio }) => {
        // Una foto más reciente (u otra cancelación) ya invalidó esta extracción
        if (extraccionEnCursoRef.current !== tokenDeEstaExtraccion) {
          console.log('manejarSeleccionDeFoto: resultado descartado (foto cambió/se quitó antes de resolver)');
          return;
        }

        console.log('manejarSeleccionDeFoto: extracción resuelta ->', { montoExtraido, comercio });

        // Nunca sobrescribe lo que el usuario ya haya escrito a mano (incluso
        // si lo escribió mientras la extracción seguía en vuelo), y un
        // resultado null simplemente deja el campo para completar manualmente.
        if (montoExtraido !== null && !montoTocadoRef.current) {
          setMonto(String(montoExtraido));
          console.log('manejarSeleccionDeFoto: Monto pre-llenado con', montoExtraido);
        }
        if (comercio !== null && !tituloTocadoRef.current) {
          setTitulo(comercio);
          console.log('manejarSeleccionDeFoto: Título pre-llenado con', comercio);
        }

        // Banner amistoso según el resultado (AGENTS.md → "Receipt extraction
        // UX states"): silencioso solo cuando se extrajeron ambos campos.
        if (montoExtraido === null && comercio === null) {
          setAvisoExtraccion(
            'Se me rompieron los lentes 👓💔 No pude leer este recibo — completa los datos a mano.'
          );
        } else if (montoExtraido !== null && comercio === null) {
          const montoFormateado = `$${montoExtraido.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${moneda}`;
          setAvisoExtraccion(`Leí que gastaste ${montoFormateado} — pero no vi en qué. Completa el nombre.`);
        } else if (comercio !== null && montoExtraido === null) {
          setAvisoExtraccion(`Leí que fue en ${comercio} — pero no vi cuánto. Ingresa el monto.`);
        } else {
          setAvisoExtraccion(null);
        }
      })
      .finally(() => {
        // Solo detiene EL intervalo si sigue siendo el de esta extracción: si
        // ya se adjuntó una foto más nueva, ese intervalo es el vigente y no
        // debe cortarse por la resolución tardía de esta.
        if (extraccionEnCursoRef.current === tokenDeEstaExtraccion) {
          detenerRotacionDeMensajes();
          setExtrayendo(false);
          console.log('manejarSeleccionDeFoto: extracción finalizada, mensaje rotativo ocultado');
        }
      });
  };

  /** Quita la foto adjunta (y libera su URL de miniatura); cancela cualquier extracción en curso */
  const eliminarFoto = () => {
    extraccionEnCursoRef.current += 1; // invalida cualquier extracción pendiente
    detenerRotacionDeMensajes();
    setExtrayendo(false);
    setAvisoExtraccion(null);

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
    extraccionEnCursoRef.current += 1; // invalida cualquier extracción pendiente
    detenerRotacionDeMensajes();
    if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    setTitulo('');
    setMonto('');
    setFecha(obtenerFechaDeHoy());
    setFotoUrl(null);
    setExtrayendo(false);
    setAvisoExtraccion(null);
    setErrores({ titulo: '', monto: '', fecha: '' });
    tituloTocadoRef.current = false;
    montoTocadoRef.current = false;
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
      trip_id: trip.id,
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

                {/* Overlay no bloqueante mientras se extrae monto/comercio: solo cubre la
                    miniatura, nunca los campos — la entrada manual sigue disponible en paralelo. */}
                {extrayendo && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-md bg-ink-primary/40 text-center px-1"
                    role="status"
                    aria-live="polite"
                  >
                    <svg
                      className="w-6 h-6 animate-spin text-bg-surface"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                      />
                    </svg>
                    <span className="text-label font-body text-bg-surface leading-tight">
                      {MENSAJES_EXTRACCION[indiceMensajeExtraccion]}
                    </span>
                  </div>
                )}
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
                onChange={(e) => {
                  tituloTocadoRef.current = true;
                  setTitulo(e.target.value);
                  setAvisoExtraccion(null);
                }}
              />
              {errores.titulo && <span className="text-label text-alert-max px-1">{errores.titulo}</span>}
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 w-full">
                <Input
                  label="Monto"
                  type="number"
                  prefix={moneda}
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => {
                    montoTocadoRef.current = true;
                    setMonto(e.target.value);
                    setAvisoExtraccion(null);
                  }}
                />
                {errores.monto ? (
                  <span className="text-label text-alert-max px-1">{errores.monto}</span>
                ) : (
                  /* Vista previa de conversión a COP mientras el usuario escribe */
                  montoConvertidoPreview && (
                    <span className="text-label text-ink-muted px-1">{montoConvertidoPreview}</span>
                  )
                )}
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

        {/* Banner amistoso post-extracción (falla total o éxito parcial): tono
            neutral/suave, nunca alert-max — no es un error, es informativo
            (AGENTS.md → "Receipt extraction UX states"). Se oculta solo al
            escribir en Título/Monto, o manualmente con el botón "×". */}
        {avisoExtraccion && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-md bg-bg-list-item px-4 py-3"
          >
            <p className="text-label font-body text-ink-muted">{avisoExtraccion}</p>
            <button
              type="button"
              aria-label="Descartar aviso"
              onClick={() => setAvisoExtraccion(null)}
              className="shrink-0 text-ink-muted hover:text-ink-primary transition-colors leading-none"
            >
              ×
            </button>
          </div>
        )}

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
