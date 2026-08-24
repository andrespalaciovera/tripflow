import React from 'react';

/**
 * Componente reutilizable Input para la aplicación Tripflow.
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.label] - Etiqueta de texto opcional que aparece arriba del input
 * @param {React.ReactNode} [props.prefix] - Prefijo opcional a la izquierda (ej. "$", icono, etc.)
 * @param {string} [props.type='text'] - Tipo de entrada HTML (text, number, date, etc.)
 * @param {boolean} [props.disabled=false] - Indica si el input está deshabilitado
 * @param {string} [props.className=''] - Clases CSS adicionales para el contenedor principal
 * @param {string} [props.placeholder] - Texto provisional
 * @param {string|number} [props.value] - Valor del input
 * @param {Function} [props.onChange] - Manejador de cambio
 */
export const Input = ({
  label,
  prefix,
  type = 'text',
  disabled = false,
  className = '',
  placeholder = '',
  value,
  onChange,
  ...restoProps
}) => {
  // Clases para el contenedor visual (wrapper)
  const clasesWrapper = [
    'flex items-center gap-2 border bg-surface px-4 py-3 rounded-md transition-all duration-200',
    disabled
      ? 'border-stroke-form bg-bg-body cursor-not-allowed opacity-60'
      : 'border-stroke-form focus-within:border-ink-primary focus-within:ring-2 focus-within:ring-ink-primary/5',
  ].join(' ');

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* Etiqueta del input */}
      {label && (
        <label className="text-label font-body text-ink-primary select-none">
          {label}
        </label>
      )}

      {/* Contenedor visual del input (Bento Box Feel) */}
      <div className={clasesWrapper}>
        {/* Prefijo del input */}
        {prefix && (
          <span className="text-body font-body text-ink-primary select-none flex items-center justify-center">
            {prefix}
          </span>
        )}

        {/* Input nativo HTML */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none border-none p-0 text-body font-body text-ink-primary placeholder:text-ink-muted disabled:cursor-not-allowed"
          {...restoProps}
        />
      </div>
    </div>
  );
};

export default Input;
