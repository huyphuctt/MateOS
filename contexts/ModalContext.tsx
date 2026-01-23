
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal, ModalType, ModalVariant } from '../components/os/Modal';

// Omit isOpen and onClose because the Provider manages visibility
export interface ModalOptions {
  title: string;
  message?: string;
  type?: ModalType;
  variant?: ModalVariant;
  children?: React.ReactNode;
  
  // Prompt specific options
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void; // Optional callback when closed/cancelled
}

interface ModalContextType {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Slight delay to clear options to allow animation to finish if needed, 
    // but for now we clear immediately after close to reset state
    setTimeout(() => {
        setModalOptions(null);
        setIsLoading(false);
    }, 200); 
  }, []);

  const openModal = useCallback((options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  }, []);

  const handleConfirm = async () => {
      if (modalOptions?.onConfirm) {
          try {
              setIsLoading(true);
              const result = modalOptions.onConfirm();
              if (result instanceof Promise) {
                  await result;
              }
              closeModal();
          } catch (error) {
              console.error("Modal confirm error", error);
              setIsLoading(false); 
          }
      } else {
          closeModal();
      }
  };

  const handleClose = () => {
      if (modalOptions?.onCancel) {
          modalOptions.onCancel();
      }
      closeModal();
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalOptions && (
          <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={modalOptions.title}
            message={modalOptions.message}
            type={modalOptions.type}
            variant={modalOptions.variant}
            confirmText={modalOptions.confirmText}
            cancelText={modalOptions.cancelText}
            onConfirm={handleConfirm}
            isLoading={isLoading}
          >
              {modalOptions.children}
          </Modal>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
