import React, { useEffect, useRef, useState } from 'react';

/**
 * Lista canónica de los 7 destinos disponibles en el MVP (AGENTS.md §7).
 * Idéntica a la de NewTripDrawer para que no haya discrepancias.
 */
export const DESTINOS = [
  'Estados Unidos',
  'México',
  'Colombia',
  'España',
  'Francia',
  'Alemania',
  'Italia',
];

const IconoChevron = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={`w-4 h-4 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const IconoCheck = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-4 h-4 text-ink-primary shrink-0"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

/**
 * CountrySelect — dropdown custom que reemplaza el <select> nativo del campo
 * "Lugar" en NewTripDrawer. Usa la misma paleta de tokens que los demás campos
 * del formulario (radius-md, stroke-form, bg-surface) sin ningún estilo nativo
 * del navegador que no se pueda personalizar.
 *
 * @param {string}   props.value     - País seleccionado actualmente ('' = sin selección)
 * @param {Function} props.onChange  - Callback (nuevoValor: string) => void
 */
const CountrySelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Cierre al hacer clic fuera del componente
  useEffect(() => {
    if (!open) return;
    const manejarClickFuera = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, [open]);

  const seleccionar = (pais) => {
    onChange(pais);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger: imita la apariencia de los inputs existentes */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          w-full h-14 flex items-center justify-between px-4
          bg-bg-surface border rounded-md text-body transition-colors
          ${open ? 'border-ink-primary' : 'border-stroke-form'}
          ${value ? 'text-ink-primary' : 'text-ink-muted'}
        `}
      >
        <span>{value || 'Selecciona un destino'}</span>
        <IconoChevron open={open} />
      </button>

      {/* Panel desplegable */}
      {open && (
        <ul
          role="listbox"
          className="
            absolute z-50 top-full mt-1 w-full
            bg-bg-surface border border-stroke-form rounded-md shadow-soft
            overflow-hidden py-1
          "
        >
          {DESTINOS.map((pais) => {
            const seleccionado = pais === value;
            return (
              <li
                key={pais}
                role="option"
                aria-selected={seleccionado}
                onClick={() => seleccionar(pais)}
                className={`
                  flex items-center justify-between px-4 py-3 cursor-pointer
                  text-body transition-colors
                  ${seleccionado
                    ? 'text-ink-primary font-semibold bg-bg-list-item'
                    : 'text-ink-primary hover:bg-bg-list-item'
                  }
                `}
              >
                <span>{pais}</span>
                {seleccionado && <IconoCheck />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CountrySelect;
