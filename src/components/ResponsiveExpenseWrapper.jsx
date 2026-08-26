import React, { useEffect } from 'react';
import AddExpensesForm from './AddExpensesForm';

/**
 * Envoltorio responsivo (Patrón Camaleón) para el formulario de gastos.
 * 
 * Móvil (< md): Se comporta como un "Bottom Sheet" (modal que sube desde abajo)
 * con un fondo oscuro (backdrop) para enfocar la atención en el formulario, 
 * ideal ya que se dispara desde la MobileBottomBar.
 * 
 * Escritorio (md:): Se comporta como un bloque estático en línea (inline),
 * anulando todas las clases fixed/modal mediante prefijos md:.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla la visibilidad del componente
 * @param {Function} props.onClose - Callback al cancelar o hacer clic en el fondo (móvil)
 * @param {Object} props.trip - Datos del viaje activo, pasados al formulario
 * @param {Function} props.onGuardar - Callback al guardar el gasto con éxito
 */
const ResponsiveExpenseWrapper = ({ isOpen, onClose, trip, onGuardar }) => {
  // Bloquea el scroll del body solo en móvil (< 768px), donde el componente
  // actúa como un Bottom Sheet modal. En escritorio el formulario es inline y
  // bloquear el scroll impediría desplazarse por el Dashboard — bug real.
  useEffect(() => {
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;

    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 
        MÓVIL: Backdrop oscuro. 
        ESCRITORIO: Oculto completamente (md:hidden) ya que no hay modal. 
      */}
      <div 
        className="fixed inset-0 bg-ink-primary/40 z-[60] md:hidden" 
        onClick={onClose}
      />

      {/* 
        Contenedor del formulario.
        MÓVIL: Bottom Sheet (fixed, pegado abajo, max-height, borde redondeado arriba).
        ESCRITORIO: Anula todo lo fixed/modal para ser estático (md:static, md:p-0, etc).
      */}
      <div 
        className="
          fixed inset-x-0 bottom-0 z-[60] max-h-[90vh] overflow-y-auto bg-bg-navbar-forms rounded-t-[20px] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
          md:static md:inset-auto md:z-auto md:max-h-none md:overflow-visible md:bg-transparent md:rounded-none md:p-0 md:shadow-none
        "
      >
        <AddExpensesForm 
          trip={trip} 
          onGuardar={onGuardar} 
          onCancelar={onClose} 
        />
      </div>
    </>
  );
};

export default ResponsiveExpenseWrapper;
