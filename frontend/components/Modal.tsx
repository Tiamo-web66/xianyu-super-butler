import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  children,
  footer,
  onClose,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) => {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (closeOnEsc && e.key === 'Escape') {
      onClose();
    }
  }, [closeOnEsc, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, handleEsc]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }[size];

  return createPortal(
    <div
      className="modal-overlay"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`modal-container ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="modal-header flex items-center justify-between">
            {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
