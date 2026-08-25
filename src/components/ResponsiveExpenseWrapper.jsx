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
  // Prevenir scroll en el body cuando el modal está abierto en móvil
  useEffect(() => {
    // Solo bloqueamos el scroll si estamos en móvil (asumiendo que en desktop es inline y no interfiere)
    // Una forma simple es verificar window.innerWidth, pero Tailwind md: anula el overlay de todos modos.
    // Para ser seguros, bloqueamos el scroll globalmente cuando isOpen es true, ya que la intención
    // en móvil es modal y en desktop la vista inline podría tolerarlo temporalmente.
    if (isOpen) {
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
          fixed inset-x-0 bottom-0 z-[60] max-h-[90vh] overflow-y-auto bg-bg-body rounded-t-[20px] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
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
