
import React from 'react';
import { X, AlertCircle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: 'info' | 'error' | 'success';
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-[fade-in_0.2s_ease-out]">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon based on type */}
            <div className={`flex-shrink-0 p-3 rounded-lg border ${
              type === 'error' ? 'bg-red-500/10 border-red-500/20' : 
              type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
              'bg-indigo-500/10 border-indigo-500/20'
            }`}>
              {type === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
              {type === 'success' && <Info className="w-6 h-6 text-emerald-400" />}
              {type === 'info' && <Info className="w-6 h-6 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              {message && <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>}
              {children}
            </div>

            <button 
              onClick={onClose}
              className="flex-shrink-0 text-zinc-500 hover:text-white transition-colors -mt-1 -mr-1 p-1 rounded hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
