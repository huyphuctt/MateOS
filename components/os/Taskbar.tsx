import React, { useState, useEffect } from 'react';
import { LayoutGrid, Search, Rocket, ChevronUp, Wifi, Volume2, Battery } from 'lucide-react';
import { AppId, Theme } from '../../types';

interface TaskbarProps {
  openApps: AppId[];
  activeApp: AppId | null;
  onAppClick: (id: AppId) => void;
  onStartClick: () => void;
  startMenuOpen: boolean;
  appIcons: Record<AppId, React.ReactNode>;
  theme: Theme;
  hideTaskbar: boolean;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  openApps,
  activeApp,
  onAppClick,
  onStartClick,
  startMenuOpen,
  appIcons,
  theme,
  hideTaskbar
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  // Aqua Dock Style
  if (theme === 'aqua') {
      return (
        <div className={`absolute bottom-0 left-0 right-0 h-20 flex justify-center z-[9999] pointer-events-none group/dock`}>
             {/* Invisible Trigger Strip for easier revealing */}
             <div className="absolute bottom-0 w-full h-2 bg-transparent pointer-events-auto" />
             
             <div 
                className={`
                    pointer-events-auto flex items-end gap-2 px-4 py-2 bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl transition-transform duration-300 ease-in-out origin-bottom mb-2
                    ${hideTaskbar ? 'translate-y-[calc(100%-4px)] group-hover/dock:translate-y-0' : 'translate-y-0'}
                `}
             >
                 {/* Launchpad Button */}
                <button 
                    onClick={onStartClick}
                    className="group/icon relative p-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/20 transition-all duration-300 active:scale-95"
                >
                     <div className="w-10 h-10 bg-gradient-to-b from-gray-300 to-gray-400 rounded-xl flex items-center justify-center shadow-lg">
                        <Rocket className="w-6 h-6 text-white fill-white" />
                     </div>
                </button>

                <div className="w-[1px] h-10 bg-white/20 mx-1"></div>

                 {/* Dock Icons */}
                 {[AppId.BROWSER, AppId.COPILOT, AppId.NOTEPAD, AppId.PHOTOS, AppId.SETTINGS].map(appId => {
                    const isOpen = openApps.includes(appId);
                    const isActive = activeApp === appId;
                    
                    return (
                        <button
                            key={appId}
                            onClick={() => onAppClick(appId)}
                            className="group/icon relative p-1 transition-all duration-300 hover:-translate-y-2 active:scale-95 active:-translate-y-1"
                        >
                            <div className="w-12 h-12 flex items-center justify-center transition-transform">
                                {/* We assume icons are passed as elements, we scale them up slightly */}
                                <div className="bg-white/10 p-1.5 rounded-xl backdrop-blur-sm shadow-sm">
                                    {React.cloneElement(appIcons[appId] as React.ReactElement<any>, { size: 28 })}
                                </div>
                            </div>
                            {isOpen && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black/60 dark:bg-white/60 rounded-full" />
                            )}
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {appId.charAt(0).toUpperCase() + appId.slice(1)}
                            </div>
                        </button>
                    );
                })}
             </div>
        </div>
      );
  }

  // Aero Taskbar Style
  return (
    <div 
        className={`
            absolute bottom-0 left-0 right-0 h-12 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-t border-white/30 dark:border-white/10 flex items-center justify-between px-3 z-[9999] shadow-lg
            transition-transform duration-300 ease-in-out
            ${hideTaskbar ? 'translate-y-[calc(100%-6px)] hover:translate-y-0' : 'translate-y-0'}
        `}
    >
      {/* Weather Widget Placeholder */}
      <div className="w-48 hidden md:flex items-center gap-2 pl-2 hover:bg-white/40 dark:hover:bg-white/10 p-1 rounded-md transition-colors cursor-pointer group">
         <div className="relative w-6 h-6">
            <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
            <div className="absolute bottom-0 left-0 w-4 h-3 bg-gray-200 rounded-full opacity-80"></div>
         </div>
         <div className="flex flex-col leading-none">
            <span className="text-xs text-gray-800 dark:text-gray-100 font-medium">72°F</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:underline">Sunny</span>
         </div>
      </div>

      {/* Center Icons */}
      <div className="flex-1 flex items-center justify-center gap-1.5 h-full">
        <button 
            onClick={onStartClick}
            data-start-trigger="true"
            className={`p-2 rounded hover:bg-white/50 dark:hover:bg-white/10 transition-all active:scale-95 duration-200 ${startMenuOpen ? 'bg-white/50 dark:bg-white/10' : ''}`}
        >
           <LayoutGrid className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
        </button>

        <button className="p-2 rounded hover:bg-white/50 dark:hover:bg-white/10 transition-all active:scale-95 duration-200 hidden sm:block">
           <Search className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        
        {/* Pinned/Open Apps */}
        {[AppId.COPILOT, AppId.BROWSER, AppId.NOTEPAD, AppId.SETTINGS].map(appId => {
            const isOpen = openApps.includes(appId);
            const isActive = activeApp === appId;
            
            return (
                <button
                    key={appId}
                    onClick={() => onAppClick(appId)}
                    className={`
                        relative p-2 rounded hover:bg-white/50 dark:hover:bg-white/10 transition-all active:scale-95 duration-200 group
                        ${isActive ? 'bg-white/60 dark:bg-white/20' : ''}
                    `}
                >
                    <div className="w-6 h-6 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
                        {appIcons[appId]}
                    </div>
                    {isOpen && (
                        <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full transition-all duration-300 ${isActive ? 'w-4 bg-blue-500' : 'bg-gray-400'}`} />
                    )}
                </button>
            );
        })}
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-1">
        <div className="hidden sm:flex hover:bg-white/40 dark:hover:bg-white/10 p-1 rounded transition-colors cursor-pointer">
            <ChevronUp size={14} className="text-gray-600 dark:text-gray-300"/>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/40 dark:hover:bg-white/10 rounded transition-colors cursor-pointer border border-transparent hover:border-gray-300/30">
            <Wifi size={16} className="text-gray-800 dark:text-gray-100"/>
            <Volume2 size={16} className="text-gray-800 dark:text-gray-100"/>
            <Battery size={16} className="text-gray-800 dark:text-gray-100 rotate-90"/>
        </div>
        <div className="flex flex-col items-end justify-center px-2 py-0.5 hover:bg-white/40 dark:hover:bg-white/10 rounded transition-colors cursor-pointer ml-1 text-right">
            <span className="text-xs font-medium text-gray-800 dark:text-gray-100">{formatTime(time)}</span>
            <span className="text-[10px] text-gray-600 dark:text-gray-300">{formatDate(time)}</span>
        </div>
        <div className="w-1.5 h-full border-l border-gray-300/30 dark:border-gray-600/30 ml-1"></div>
      </div>
    </div>
  );
};