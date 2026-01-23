
import React from 'react';
import { X, AlertCircle, Info, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export type ModalType = 'info' | 'error' | 'success' | 'warning' | 'question';
export type ModalVariant = 'alert' | 'prompt';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: ModalType;
  variant?: ModalVariant;
  children?: React.ReactNode;
  
  // Prompt specific props
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  variant = 'alert',
  children,
  onConfirm,
  confirmText = 'Yes',
  cancelText = 'No',
  isLoading = false
}) => {
  if (!isOpen) return null;

  // Icon mapping
  const getIcon = () => {
      switch(type) {
          case 'error': return <AlertCircle className="w-6 h-6 text-red-400" />;
          case 'success': return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
          case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-400" />;
          case 'question': return <HelpCircle className="w-6 h-6 text-blue-400" />;
          case 'info': 
          default: return <Info className="w-6 h-6 text-indigo-400" />;
      }
  };

  const getIconStyles = () => {
      switch(type) {
          case 'error': return 'bg-red-500/10 border-red-500/20';
          case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
          case 'warning': return 'bg-amber-500/10 border-amber-500/20';
          case 'question': return 'bg-blue-500/10 border-blue-500/20';
          case 'info': 
          default: return 'bg-indigo-500/10 border-indigo-500/20';
      }
  };

  const getConfirmButtonStyles = () => {
      switch(type) {
          case 'error': return 'bg-red-600 hover:bg-red-500 text-white';
          case 'success': return 'bg-emerald-600 hover:bg-emerald-500 text-white';
          case 'warning': return 'bg-amber-600 hover:bg-amber-500 text-white';
          case 'info': 
          default: return 'bg-blue-600 hover:bg-blue-500 text-white';
      }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-[fade-in_0.2s_ease-out]">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon based on type */}
            <div className={`flex-shrink-0 p-3 rounded-lg border ${getIconStyles()}`}>
              {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              {message && <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>}
              {children}
            </div>

            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-shrink-0 text-zinc-500 hover:text-white transition-colors -mt-1 -mr-1 p-1 rounded hover:bg-white/10 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {variant === 'prompt' ? (
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-zinc-300 transition-colors"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg flex items-center gap-2 ${getConfirmButtonStyles()} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmText}
                    </button>
                </>
            ) : (
                <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors shadow-lg"
                >
                Close
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
