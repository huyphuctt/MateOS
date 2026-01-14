import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { WindowState, AppId, Theme } from '../../types';

interface WindowFrameProps {
  window: WindowState;
  isActive: boolean;
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  onMaximize: (id: AppId) => void;
  onFocus: (id: AppId) => void;
  onMove: (id: AppId, x: number, y: number) => void;
  children: React.ReactNode;
  theme: Theme;
  hideTaskbar: boolean;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: windowState,
  isActive,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  children,
  theme,
  hideTaskbar
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Trigger open animation on mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus(windowState.id);
    if (windowState.isMaximized) return;
    
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - windowState.position.x,
      y: e.clientY - windowState.position.y
    };
  };

  // Intercept close to play animation
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosing(true);
    setTimeout(() => {
        onClose(windowState.id);
    }, 300); // Match CSS duration
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const rawX = e.clientX - dragOffset.current.x;
        const rawY = e.clientY - dragOffset.current.y;
        
        // Viewport boundaries
        const taskbarHeight = hideTaskbar ? 6 : (theme === 'aero' ? 48 : 80);
        const topBarHeight = theme === 'aqua' ? 28 : 0;

        const maxX = window.innerWidth - windowState.size.width;
        const maxY = window.innerHeight - windowState.size.height - taskbarHeight;
        
        const clampedX = Math.max(0, Math.min(maxX, rawX));
        const clampedY = Math.max(topBarHeight, Math.min(maxY, rawY)); // Respect TopBar

        onMove(windowState.id, clampedX, clampedY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onMove, windowState.id, windowState.size.width, windowState.size.height, theme, hideTaskbar]);

  // Animation State Calculation
  const isVisible = isMounted && !windowState.isMinimized && !isClosing;

  // Render Aero Style Controls
  const renderAeroControls = () => (
    <div className="flex items-center h-full">
      <button
        onClick={(e) => { e.stopPropagation(); onMinimize(windowState.id); }}
        className="h-full w-10 flex items-center justify-center hover:bg-white/20 dark:hover:bg-white/10 transition-colors rounded-sm"
      >
        <Minus size={14} className="text-gray-600 dark:text-gray-300" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onMaximize(windowState.id); }}
        className="h-full w-10 flex items-center justify-center hover:bg-white/20 dark:hover:bg-white/10 transition-colors rounded-sm"
      >
        {windowState.isMaximized ? (
            <Maximize2 size={12} className="rotate-45 text-gray-600 dark:text-gray-300" />
        ) : (
            <Square size={12} className="text-gray-600 dark:text-gray-300" />
        )}
      </button>
      <button
        onClick={handleClose}
        className="h-full w-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors group rounded-sm"
      >
        <X size={14} className="text-gray-600 dark:text-gray-300 group-hover:text-white" />
      </button>
    </div>
  );

  // Render Aqua Style Controls
  const renderAquaControls = () => (
    <div className="flex items-center gap-2 pl-2 h-full group">
       <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#FF5F57] flex items-center justify-center border border-black/10">
          <X size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
       </button>
       <button onClick={(e) => { e.stopPropagation(); onMinimize(windowState.id); }} className="w-3 h-3 rounded-full bg-[#FEBC2E] flex items-center justify-center border border-black/10">
          <Minus size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
       </button>
       <button onClick={(e) => { e.stopPropagation(); onMaximize(windowState.id); }} className="w-3 h-3 rounded-full bg-[#28C840] flex items-center justify-center border border-black/10">
          <Maximize2 size={8} className="text-black/50 opacity-0 group-hover:opacity-100 rotate-45" />
       </button>
    </div>
  );

  const getBottomOffset = () => {
      if (!windowState.isMaximized) return undefined;
      
      if (theme === 'aqua') {
          return hideTaskbar ? '6px' : '72px';
      }
      // Aero
      return hideTaskbar ? '6px' : '42px';
  };

  return (
    <div
      className={`absolute flex flex-col bg-white/80 dark:bg-[#121212]/80 backdrop-blur-2xl rounded-lg shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 
        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] origin-bottom
        ${isActive ? 'z-50 shadow-[0_20px_60px_rgba(0,0,0,0.3)]' : 'z-0'}
        ${(windowState.isMaximized && theme === 'aero') ? 'rounded-b-none border-b-0' : ''}
        ${isVisible 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-12 pointer-events-none'}
      `}
      style={{
        left: windowState.isMaximized ? 0 : windowState.position.x,
        top: windowState.isMaximized ? (theme === 'aqua' ? 25 : 0) : windowState.position.y,
        right: windowState.isMaximized ? 0 : undefined,
        bottom: getBottomOffset(),
        width: windowState.isMaximized ? 'auto' : windowState.size.width,
        height: windowState.isMaximized ? 'auto' : windowState.size.height,
        zIndex: windowState.zIndex,
        transition: isDragging ? 'none' : undefined 
      }}
      onMouseDown={() => onFocus(windowState.id)}
    >
      {/* Title Bar */}
      <div
        className={`h-9 flex items-center px-2 bg-white/30 dark:bg-white/5 select-none border-b border-white/20 dark:border-white/5 ${theme === 'aqua' ? 'justify-start' : 'justify-between'}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onMaximize(windowState.id)}
      >
        {theme === 'aqua' ? (
             <div className="h-full flex items-center">{renderAquaControls()}</div>
        ) : (
            <>
                <div className="flex items-center gap-2 px-2 flex-1 h-full overflow-hidden">
                    <div className="flex items-center justify-center shrink-0">
                        {React.isValidElement(windowState.icon) 
                            ? React.cloneElement(windowState.icon as React.ReactElement<any>, { size: 16 }) 
                            : windowState.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate leading-none pt-[1px]">{windowState.title}</span>
                </div>
                {renderAeroControls()}
            </>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};