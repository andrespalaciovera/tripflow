import React, { useEffect } from 'react';
import Button from './Button';

/**
 * Componente genérico de Modal de Confirmación.
 * Muestra un overlay oscuro fijo sobre la pantalla completa y una tarjeta
 * central con un título y dos botones (confirmar / cancelar).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Indica si el modal está visible
 * @param {Function} props.onClose - Callback al cancelar o hacer clic en el fondo
 * @param {Function} props.onConfirm - Callback al presionar el botón principal
 * @param {string} [props.title] - Texto de la pregunta (por defecto "¿Deseas eliminar este viaje?")
 * @param {string} [props.confirmText] - Texto del botón de acción (por defecto "Eliminar")
 * @param {string} [props.cancelText] - Texto del botón de cancelación (por defecto "Cancelar")
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Deseas eliminar este viaje?',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
}) => {
  // Prevenir scroll en el body cuando el modal está abierto
  useEffect(() => {
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
    // Overlay oscuro: z-[60] asegura que esté sobre la TopNavbar y la MobileBottomBar
    <div
      className="fixed inset-0 bg-ink-primary/40 z-[60] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Tarjeta del modal. Detenemos la propagación para que los clics dentro
          de la tarjeta no cierren el modal. Usamos el token de superficie blanca
          y radius-lg (28px). */}
      <div
        className="bg-bg-surface rounded-lg w-full max-w-sm p-6 flex flex-col items-center shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-h3 font-display text-ink-primary text-center mb-6 w-full">
          {title}
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" className="w-full" onClick={onConfirm}>
            {confirmText}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onClose}>
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
