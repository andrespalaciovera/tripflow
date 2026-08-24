import React from 'react';

/**
 * Mapeo de estilos para cada variante de botón utilizando estrictamente los tokens del sistema de diseño.
 */
const VARIANTES = {
  // Variante principal: Fondo negro tinta y texto blanco superficie
  primary: 'bg-ink-primary text-bg-surface hover:opacity-90 active:scale-[0.98]',
  
  // Variante secundaria: Fondo transparente con borde y texto negro tinta
  secondary: 'bg-transparent border border-ink-primary text-ink-primary hover:bg-ink-primary/5 active:scale-[0.98]',
  
  // Variante deshabilitada: Fondo gris desactivado y cursor no permitido
  disabled: 'bg-btn-disable text-bg-surface cursor-not-allowed pointer-events-none',
  
  // Variante terciaria: Fondo transparente con borde y texto verde de estado activo
  tertiary: 'bg-transparent border border-status-activo-text text-status-activo-text hover:bg-status-activo-bg/40 active:scale-[0.98]',
  
  // Variante botón de icono para agregar: Circular, fondo negro tinta y texto blanco superficie
  'icon-add': 'w-10 h-10 aspect-square p-2 bg-ink-primary text-bg-surface hover:opacity-90 active:scale-95',
  
  // Variante botón de icono para eliminar: Circular, fondo alerta máxima (rosa/coral) y texto blanco superficie
  'icon-delete': 'w-10 h-10 aspect-square p-2 bg-alert-max text-bg-surface hover:opacity-90 active:scale-95',
};

/**
 * Componente reutilizable Button para la aplicación Tripflow.
 *
 * @param {Object} props - Propiedades del componente
 * @param {'primary' | 'secondary' | 'disabled' | 'tertiary' | 'icon-add' | 'icon-delete'} [props.variant='primary'] - Variante visual del botón
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - Tipo de botón HTML
 * @param {boolean} [props.disabled=false] - Indica si el botón está inactivo
 * @param {string} [props.className=''] - Clases CSS adicionales para extender estilos
 * @param {React.ReactNode} props.children - Contenido interno o icono del botón
 * @param {Function} [props.onClick] - Función controladora de clic
 */
export const Button = ({
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  children,
  onClick,
  ...restoProps
}) => {
  // Si el botón tiene la prop `disabled` en true, se fuerza la variante 'disabled'
  const esDeshabilitado = disabled || variant === 'disabled';
  const varianteActiva = esDeshabilitado ? 'disabled' : variant;

  // Es un botón de tipo icono si corresponde a icon-add o icon-delete
  const esIcono = varianteActiva === 'icon-add' || varianteActiva === 'icon-delete';

  // Dimensiones y espaciado según si es botón de texto o botón de icono circular
  const paddingYTamano = esIcono
    ? '' // El tamaño ya está definido en la variante (w-10 h-10 aspect-square)
    : 'px-6 py-3 text-body font-medium';

  // Estilos base comunes a todos los botones
  const estilosBase =
    'inline-flex items-center justify-center font-body rounded-full transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-ink-primary/20';

  const clasesCompuestas = [
    estilosBase,
    paddingYTamano,
    VARIANTES[varianteActiva] || VARIANTES.primary,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      disabled={esDeshabilitado}
      onClick={esDeshabilitado ? undefined : onClick}
      className={clasesCompuestas}
      {...restoProps}
    >
      {children}
    </button>
  );
};

export default Button;
