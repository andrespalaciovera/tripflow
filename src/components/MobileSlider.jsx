import React, { useState } from 'react';

/**
 * Carrusel deslizable 1 a 1 — exclusivo para móvil.
 * En escritorio este componente no se renderiza directamente; el padre debe
 * ocultarlo con `md:hidden` y mostrar una columna vertical alternativa.
 *
 * Funciona con cualquier hijo: envuelve cada uno en un slide de ancho completo
 * con snap-center para garantizar que el deslizamiento sea siempre de 1 en 1.
 * Los puntos de paginación reflejan en todo momento el slide visible.
 *
 * @param {Object}          props          - Propiedades del componente
 * @param {React.ReactNode} props.children - Tarjetas o cualquier nodo a mostrar como slides
 */
const MobileSlider = ({ children }) => {
  // Índice del slide actualmente visible; se actualiza en cada evento scroll.
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convierte los hijos en un array estable (maneja fragmentos, arrays, etc.)
  const slides = React.Children.toArray(children);

  /**
   * Calcula el slide visible a partir de la posición de scroll horizontal.
   * Math.round convierte el scroll fraccional en un índice entero: si el usuario
   * lleva el carrusel a mitad de camino entre dos slides, se toma el más cercano.
   * @param {React.UIEvent<HTMLDivElement>} e
   */
  const handleScroll = (e) => {
    const indice = Math.round(e.target.scrollLeft / e.target.clientWidth);
    setCurrentIndex(indice);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Track de slides: scroll horizontal con snap obligatorio 1 a 1 */}
      <div
        className="flex items-start overflow-x-auto snap-x snap-mandatory w-full pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
      >
        {slides.map((slide, indice) => (
          // Cada slide ocupa exactamente el 100% del ancho del track (shrink-0 + w-full)
          // y se centra con snap-center para un snap suave en todos los navegadores.
          <div
            key={indice}
            className="w-full shrink-0 snap-center px-1 flex justify-center"
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Puntos de paginación: solo visibles si hay más de 1 slide */}
      {slides.length > 1 && (
        <div className="flex justify-center items-center gap-2">
          {slides.map((_, indice) => (
            <span
              key={indice}
              className={`
                block h-2 rounded-full transition-all duration-300
                ${indice === currentIndex
                  ? 'w-4 bg-ink-primary'       // Activo: píldora ancha, color principal
                  : 'w-2 bg-stroke-form'        // Inactivo: círculo pequeño, color borde
                }
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileSlider;
