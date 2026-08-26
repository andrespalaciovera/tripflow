import React, { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';

/**
 * Formatea una fecha YYYY-MM-DD como una cadena legible para el trigger.
 * Usa el calendario gregoriano local del navegador (solo para mostrar —
 * el valor guardado siempre sigue siendo YYYY-MM-DD, como define AGENTS.md §3).
 */
const formatearParaMostrar = (valorYYYYMMDD) => {
  if (!valorYYYYMMDD) return '';
  // Parsear manualmente para evitar el desplazamiento de zona horaria de `new Date(string)`
  const [anio, mes, dia] = valorYYYYMMDD.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Convierte un objeto Date del navegador al formato YYYY-MM-DD que usa el
 * modelo de datos de Tripflow (AGENTS.md §3: fecha_inicio / fecha_fin / fecha).
 */
const dateToYYYYMMDD = (date) => {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Convierte un string YYYY-MM-DD a un objeto Date sin desplazamiento de zona.
 */
const yyyymmddToDate = (str) => {
  if (!str) return undefined;
  const [anio, mes, dia] = str.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

const IconoCalendario = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="w-4 h-4 text-ink-muted shrink-0"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
    />
  </svg>
);

const IconoChevronIzq = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const IconoChevronDer = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

/**
 * DatePicker — selector de fecha custom con calendario react-day-picker,
 * completamente estilizado con tokens de Tripflow. Reemplaza los <input type="date">
 * nativos en NewTripDrawer y AddExpensesForm.
 *
 * La interfaz es drop-in compatible: value (YYYY-MM-DD | '') y onChange((string) => void).
 *
 * @param {string}   props.value     - Fecha seleccionada en formato YYYY-MM-DD ('' = sin selección)
 * @param {Function} props.onChange  - Callback (nuevoValor: string) => void — siempre YYYY-MM-DD
 * @param {string}   [props.label]   - Etiqueta opcional renderizada encima del trigger
 * @param {Date}     [props.defaultMonth] - Mes inicial opcional al abrir el calendario
 */
const DatePicker = ({ value, onChange, label, defaultMonth }) => {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef(null);

  const selectedDate = yyyymmddToDate(value);

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

  // Ajuste dinámico de alineación del popover
  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverEstimatedWidth = 320; // Ancho típico del calendario renderizado + padding
      if (rect.left + popoverEstimatedWidth > window.innerWidth) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [open]);

  const manejarSeleccion = (date) => {
    if (!date) return;
    onChange(dateToYYYYMMDD(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-label font-body text-ink-primary mb-1.5">{label}</label>
      )}

      {/* Trigger: imita la apariencia del Input existente */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          w-full h-14 flex items-center justify-between gap-3 px-4
          bg-bg-surface border rounded-md text-body transition-colors
          ${open ? 'border-ink-primary' : 'border-stroke-form'}
          ${value ? 'text-ink-primary' : 'text-ink-muted'}
        `}
      >
        <IconoCalendario />
        <span className="flex-1 text-left">
          {value ? formatearParaMostrar(value) : 'DD/MM/AAAA'}
        </span>
      </button>

      {/* Popover del calendario */}
      {open && (
        <div className={`absolute z-50 top-full mt-1 bg-bg-surface border border-stroke-form rounded-md shadow-soft p-3 ${alignRight ? 'right-0' : 'left-0'}`}>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={manejarSeleccion}
            defaultMonth={defaultMonth || selectedDate}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? <IconoChevronIzq /> : <IconoChevronDer />,
            }}
            classNames={{
              // Contenedor raíz
              root: 'font-body text-body',
              // Cabecera del mes (mes + año + flechas)
              month_caption: 'flex items-center justify-center mb-3 relative',
              caption_label: 'text-body font-semibold text-ink-primary',
              // Botones de navegación (prev/next)
              nav: 'flex items-center gap-1',
              button_previous: 'absolute left-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-bg-list-item transition-colors text-ink-muted',
              button_next: 'absolute right-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-bg-list-item transition-colors text-ink-muted',
              // Tabla de días
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'flex-1 text-center text-label text-ink-muted pb-2',
              week: 'flex',
              // Celda de día individual
              day: 'flex-1 flex items-center justify-center',
              day_button: `
                w-8 h-8 rounded-full text-label flex items-center justify-center
                transition-colors cursor-pointer
                hover:bg-bg-list-item
              `,
              // Día seleccionado
              selected: '[&>button]:bg-ink-primary [&>button]:text-bg-surface [&>button]:hover:bg-ink-primary',
              // Hoy (si no está seleccionado)
              today: '[&>button]:ring-1 [&>button]:ring-ink-primary [&>button]:ring-offset-1',
              // Días fuera del mes visible
              outside: 'opacity-30',
              // Día deshabilitado
              disabled: 'opacity-25 cursor-not-allowed',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;
