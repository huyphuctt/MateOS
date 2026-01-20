import React from 'react';
import { WindowState } from '../../types';
import { X } from 'lucide-react';

interface AppSwitcherProps {
  isOpen: boolean;
  windows: WindowState[];
  selectedIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export const AppSwitcher: React.FC<AppSwitcherProps> = ({ 
  isOpen, 
  windows, 
  selectedIndex,
  onClose,
  onSelect
}) => {
  if (!isOpen || windows.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f3f3f3]/80 dark:bg-[#202020]/80 backdrop-blur-2xl p-6 rounded-2xl border border-white/20 shadow-2xl flex gap-4 max-w-[90vw] overflow-x-auto items-center min-h-[200px]">
        {windows.map((win, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div 
              key={win.id}
              onClick={() => onSelect(index)}
              className={`
                relative flex flex-col items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer min-w-[160px] w-[180px]
                ${isSelected 
                  ? 'bg-white dark:bg-white/10 shadow-lg scale-105 ring-2 ring-blue-500/50' 
                  : 'hover:bg-white/40 dark:hover:bg-white/5 opacity-70 hover:opacity-100 hover:scale-102'
                }
              `}
            >
              {/* Window Preview Representation */}
              <div className={`
                w-full aspect-[16/10] rounded-lg border flex items-center justify-center relative overflow-hidden
                ${isSelected ? 'bg-white dark:bg-[#2b2b2b] border-blue-500/30' : 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-700'}
              `}>
                 {/* App Icon Scaled */}
                 <div className="transform scale-150 opacity-90">
                    {React.cloneElement(win.icon as React.ReactElement<any>, { size: 32 })}
                 </div>
                 
                 {/* Mini Header Strip */}
                 <div className="absolute top-0 left-0 right-0 h-3 bg-gray-200 dark:bg-gray-700 opacity-50"></div>
              </div>

              <div className="flex flex-col items-center gap-1 w-full">
                 <div className="w-8 h-8 rounded-full bg-white dark:bg-[#333] shadow-sm flex items-center justify-center -mt-8 z-10 border border-gray-100 dark:border-gray-700">
                    {React.cloneElement(win.icon as React.ReactElement<any>, { size: 16 })}
                 </div>
                 <span className={`text-sm font-medium truncate w-full text-center ${isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    {win.title}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
