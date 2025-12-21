import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
  closeOnOverlayClick?: boolean;  // New prop to control overlay click behavior
  closeOnEscape?: boolean;        // New prop to control Escape key behavior
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = '400px',
  closeOnOverlayClick = true,  // Default: close on overlay click
  closeOnEscape = true         // Default: close on Escape key
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartedInsideRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Track if mouse down started inside the modal content
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if the mousedown is on the modal content (not overlay)
    const target = e.target as HTMLElement;
    const isInsideContent = target.closest('.modal-content');
    dragStartedInsideRef.current = !!isInsideContent;
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset after a short delay to allow click event to fire
    setTimeout(() => {
      dragStartedInsideRef.current = false;
    }, 100);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Don't close if:
    // 1. closeOnOverlayClick is false
    // 2. User was dragging (selecting text, etc.)
    // 3. Drag started inside the modal content
    if (!closeOnOverlayClick || isDragging || dragStartedInsideRef.current) {
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button className="modal-close-button-absolute" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;

