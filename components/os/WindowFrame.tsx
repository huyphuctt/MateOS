
import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, X, Maximize2, LayoutPanelLeft, LayoutPanelTop, RotateCcw } from 'lucide-react';
import { WindowState, AppId, Theme } from '../../types';

interface WindowFrameProps {
  window: WindowState;
  isActive: boolean;
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  onMaximize: (id: AppId) => void;
  onFocus: (id: AppId) => void;
  onMove: (id: AppId, x: number, y: number) => void;
  onDock?: (id: AppId, side: 'left' | 'right' | null) => void;
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
  onDock,
  children,
  theme,
  hideTaskbar
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Dimensions
  const topBarHeight = theme === 'aqua' ? 28 : 0;
  const taskbarHeight = hideTaskbar ? 6 : (theme === 'aero' ? 48 : 97);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Handle outside click for context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // If context menu is open and we clicked elsewhere (handled by effect), or if right click (handled by contextmenu event)
    if (e.button !== 0) return; 

    e.stopPropagation();
    onFocus(windowState.id);
    
    // Prevent dragging if maximized or docked
    if (windowState.isMaximized || windowState.dockSide) return;
    
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - windowState.position.x,
      y: e.clientY - windowState.position.y
    };
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(windowState.id);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosing(true);
    setTimeout(() => {
        onClose(windowState.id);
    }, 300);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const rawX = e.clientX - dragOffset.current.x;
        const rawY = e.clientY - dragOffset.current.y;
        
        const maxX = window.innerWidth - windowState.size.width;
        const maxY = window.innerHeight - 40;
        
        const clampedX = Math.max(0, Math.min(maxX, rawX));
        const clampedY = Math.max(topBarHeight, Math.min(maxY, rawY));

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
  }, [isDragging, onMove, windowState.id, windowState.size.width, topBarHeight]);

  const isVisible = isMounted && !windowState.isMinimized && !isClosing;
  const isDocked = !!windowState.dockSide;

  // Calculate layout styles based on docking/maximize
  const getLayoutStyles = () => {
      if (windowState.isMaximized) {
          return {
              left: 0,
              top: theme === 'aqua' ? topBarHeight + 4 : 0,
              right: 0,
              bottom: hideTaskbar ? '6px' : `${taskbarHeight}px`,
              width: 'auto',
              height: 'auto',
              maxHeight: 'none'
          };
      }

      if (isDocked) {
          const halfWidth = '50%';
          const xPos = windowState.dockSide === 'left' ? 0 : '50%';
          return {
              left: xPos,
              top: theme === 'aqua' ? topBarHeight + 4 : 0,
              width: halfWidth,
              bottom: hideTaskbar ? '6px' : `${taskbarHeight}px`,
              height: 'auto',
              maxHeight: 'none'
          };
      }

      // Default (Windowed)
      return {
          left: windowState.position.x,
          top: windowState.position.y,
          width: windowState.size.width,
          height: windowState.size.height,
          maxHeight: `calc(100vh - ${taskbarHeight + topBarHeight + 20}px)`,
          bottom: undefined
      };
  };

  const layoutStyles = getLayoutStyles();

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

  return (
    <>
        <div
            className={`absolute flex flex-col bg-white/80 dark:bg-[#121212]/80 backdrop-blur-2xl rounded-lg shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] origin-bottom
                ${isActive ? 'z-50 shadow-[0_20px_60px_rgba(0,0,0,0.3)]' : 'z-0'}
                ${(windowState.isMaximized || isDocked) && theme === 'aero' ? 'rounded-none border-0' : ''}
                ${isVisible 
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 scale-95 translate-y-12 pointer-events-none'}
            `}
            style={{
                zIndex: windowState.zIndex,
                transition: isDragging ? 'none' : undefined,
                ...layoutStyles
            }}
            onMouseDown={() => onFocus(windowState.id)}
        >
            {/* Title Bar */}
            <div
                className={`h-9 flex items-center px-2 bg-white/30 dark:bg-white/5 select-none border-b border-white/20 dark:border-white/5 ${theme === 'aqua' ? 'justify-start' : 'justify-between'} shrink-0`}
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
                onDoubleClick={() => onMaximize(windowState.id)}
            >
                {theme === 'aqua' ? (
                    <div className="h-full flex items-center">{renderAquaControls()}</div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 px-2 flex-1 h-full overflow-hidden">
                            <div className="flex items-center justify-center shrink-0">
                                {windowState.image ? (
                                    <img src={windowState.image} className="w-4 h-4 object-contain" alt="" />
                                ) : React.isValidElement(windowState.icon) ? (
                                    React.cloneElement(windowState.icon as React.ReactElement<any>, { size: 16 })
                                ) : (
                                    windowState.icon
                                )}
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
        
        {/* Context Menu */}
        {contextMenu && onDock && (
            <div 
                ref={contextMenuRef}
                className="fixed z-[10000] w-48 bg-white/90 dark:bg-[#2d2d2d]/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
                style={{ top: contextMenu.y, left: contextMenu.x }}
            >
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
                    Snap Layout
                </div>
                <button 
                    onClick={() => { onDock(windowState.id, 'left'); setContextMenu(null); }}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white rounded flex items-center gap-2"
                >
                    <LayoutPanelLeft size={14} className="rotate-180" />
                    Dock Left
                </button>
                <button 
                    onClick={() => { onDock(windowState.id, 'right'); setContextMenu(null); }}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white rounded flex items-center gap-2"
                >
                    <LayoutPanelLeft size={14} />
                    Dock Right
                </button>
                {(isDocked || windowState.isMaximized) && (
                     <button 
                        onClick={() => { onDock(windowState.id, null); setContextMenu(null); }}
                        className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white rounded flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 mt-1 pt-2"
                    >
                        <RotateCcw size={14} />
                        Restore
                    </button>
                )}
            </div>
        )}
    </>
  );
};
