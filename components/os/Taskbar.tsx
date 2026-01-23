import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Search, Rocket, ChevronUp, Wifi, Volume2, Battery, Building, Layers, Check, Bell, Maximize, Minimize } from 'lucide-react';
import { AppId, Theme, Organization, Workspace, RecentItem } from '../../types';

interface TaskbarProps {
  openApps: AppId[];
  activeApp: AppId | null;
  onAppClick: (id: AppId) => void;
  onStartClick: () => void;
  startMenuOpen: boolean;
  appIcons: Record<AppId, React.ReactNode>;
  theme: Theme;
  hideTaskbar: boolean;
  // Org Context Props
  organizations: Organization[];
  currentOrg?: Organization;
  currentWorkspace?: Workspace;
  onSwitchOrg: (orgId: number) => void;
  onSwitchWorkspace: (wkId: number) => void;
  // Notification Props
  notificationPanelOpen: boolean;
  onToggleNotificationPanel: () => void;
  recentItems: RecentItem[];
  // Fullscreen Props
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const PINNED_APPS = [
    AppId.VAULT,
    AppId.SETTINGS
];

export const Taskbar: React.FC<TaskbarProps> = ({
  openApps,
  activeApp,
  onAppClick,
  onStartClick,
  startMenuOpen,
  appIcons,
  theme,
  hideTaskbar,
  organizations,
  currentOrg,
  currentWorkspace,
  onSwitchOrg,
  onSwitchWorkspace,
  notificationPanelOpen,
  onToggleNotificationPanel,
  recentItems,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [time, setTime] = useState(new Date());
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle click outside for Org Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (orgMenuOpen && orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
            setOrgMenuOpen(false);
        }
    };
    if (orgMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [orgMenuOpen]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  // Merge pinned apps with currently open apps to ensure all running tasks are visible
  const displayedApps = Array.from(new Set([...PINNED_APPS, ...openApps]));

  // Aqua Dock Style
  if (theme === 'aqua') {
      return (
        <div className={`absolute bottom-0 left-0 right-0 h-24 flex justify-center z-[9999] pointer-events-none group/dock`}>
             {/* Invisible Trigger Strip for easier revealing */}
             <div className="absolute bottom-0 w-full h-4 bg-transparent pointer-events-auto" />
             
             <div 
                className={`
                    pointer-events-auto flex items-end gap-3 px-4 py-3 
                    bg-white/80 dark:bg-black/40 backdrop-blur-2xl 
                    rounded-2xl border border-white/40 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-in-out origin-bottom mb-2
                    ${hideTaskbar ? 'translate-y-[calc(100%-4px)] group-hover/dock:translate-y-0' : 'translate-y-0'}
                `}
             >
                 {/* Launchpad Button */}
                <button 
                    onClick={onStartClick}
                    className="group/icon relative p-2 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-95 mb-1"
                >
                     <div className="w-12 h-12 bg-gradient-to-b from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Rocket className="w-7 h-7 text-white fill-white" />
                     </div>
                </button>

                <div className="w-[1px] h-12 bg-black/10 dark:bg-white/20 mx-1 mb-1"></div>

                 {/* Dock Icons */}
                 {displayedApps.map(appId => {
                    const isOpen = openApps.includes(appId);
                    
                    return (
                        <button
                            key={appId}
                            onClick={() => onAppClick(appId)}
                            className="group/icon relative p-1 transition-all duration-300 hover:-translate-y-3 active:scale-95 active:-translate-y-1"
                        >
                            <div className="w-14 h-14 flex items-center justify-center transition-transform">
                                <div className="bg-transparent group-hover/icon:bg-black/10 dark:group-hover/icon:bg-white/10 p-2 rounded-2xl transition-colors duration-200">
                                    {appIcons[appId] ? (
                                        React.cloneElement(appIcons[appId] as React.ReactElement<any>, { size: 32 })
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-400 rounded-md" />
                                    )}
                                </div>
                            </div>
                            {isOpen && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/80 dark:bg-white rounded-full" />
                            )}
                            {/* Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg backdrop-blur-sm border border-white/10">
                                {appId.charAt(0).toUpperCase() + appId.slice(1)}
                            </div>
                        </button>
                    );
                })}
             </div>
        </div>
      );
  }

  const showContextSwitcher = currentOrg && (organizations.length > 1 || currentOrg.workspaces.length > 1);

  // Aero Taskbar Style
  return (
    <div 
        className={`
            absolute bottom-0 left-0 right-0 h-12 
            bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-t border-gray-300/50 dark:border-white/10 
            flex items-center justify-between px-3 z-[9999] shadow-lg
            transition-transform duration-300 ease-in-out
            ${hideTaskbar ? 'translate-y-[calc(100%-6px)] hover:translate-y-0' : 'translate-y-0'}
        `}
    >

      {/* Center Icons */}
      <div className="flex-1 flex items-center justify-center gap-1.5 h-full">
        <button 
            onClick={onStartClick}
            data-start-trigger="true"
            className={`p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 duration-200 ${startMenuOpen ? 'bg-black/10 dark:bg-white/20 shadow-inner' : ''}`}
        >
           <LayoutGrid className="w-6 h-6 text-blue-700 dark:text-sky-400 fill-blue-700 dark:fill-sky-400" />
        </button>

        {/* Pinned/Open Apps */}
        {displayedApps.map(appId => {
            const isOpen = openApps.includes(appId);
            const isActive = activeApp === appId;
            
            return (
                <button
                    key={appId}
                    onClick={() => onAppClick(appId)}
                    className={`
                        relative p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 duration-200 group
                        ${isActive ? 'bg-black/10 dark:bg-white/20 shadow-inner' : ''}
                    `}
                >
                    <div className="w-6 h-6 text-gray-900 dark:text-gray-100 flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
                        {appIcons[appId]}
                    </div>
                    {isOpen && (
                        <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-full transition-all duration-300 ${isActive ? 'w-4 bg-blue-700 dark:bg-sky-400' : 'bg-gray-500 dark:bg-gray-400'}`} />
                    )}
                </button>
            );
        })}
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-1">
        
        {/* Org Switcher for Aero */}
        {showContextSwitcher && (
          <div className="relative mr-2" ref={orgMenuRef}>
              <button
                  onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer border
                    ${orgMenuOpen 
                        ? 'bg-blue-700 border-blue-700 text-white shadow-md' 
                        : 'bg-black/5 dark:bg-white/10 border-transparent hover:border-gray-400/50 dark:hover:border-white/20 text-gray-900 dark:text-gray-200'}
                  `}
              >
                   <Building size={14} className={orgMenuOpen ? "text-white" : "text-blue-700 dark:text-sky-400"}/>
                   <span className="text-xs font-bold hidden md:block max-w-[100px] truncate">{currentOrg?.name}</span>
                   <ChevronUp size={12} className={`opacity-70 transition-transform ${orgMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {orgMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white/95 dark:bg-[#1c1c1c]/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-300 dark:border-white/10 p-2 flex flex-col z-[10000] animate-in slide-in-from-bottom-2 fade-in">
                       {/* Org List */}
                       <div className="px-2 py-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Organization</div>
                       {organizations.map(org => (
                           <button
                              key={org.id}
                              onClick={() => { onSwitchOrg(org.id); setOrgMenuOpen(false); }}
                              className={`text-left px-3 py-1.5 rounded text-sm flex items-center justify-between mb-1 transition-colors ${
                                  currentOrg?.id === org.id 
                                  ? 'bg-blue-600 text-white shadow-sm' 
                                  : 'text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                              }`}
                           >
                               <span className="truncate font-medium">{org.name}</span>
                               {currentOrg?.id === org.id && <Check size={14} />}
                           </button>
                       ))}

                       <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-2 mx-1"></div>

                       {/* Workspace List */}
                       <div className="px-2 py-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Workspace</div>
                       {currentOrg?.workspaces.map(wk => (
                           <button
                              key={wk.id}
                              onClick={() => { onSwitchWorkspace(wk.id); setOrgMenuOpen(false); }}
                              className={`text-left px-3 py-1.5 rounded text-sm flex items-center justify-between mb-1 transition-colors ${
                                  currentWorkspace?.id === wk.id 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-sky-400 font-bold' 
                                  : 'text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                              }`}
                           >
                               <div className="flex items-center gap-2">
                                   <Layers size={12} className={currentWorkspace?.id === wk.id ? 'text-blue-700 dark:text-sky-400' : 'text-gray-500'}/>
                                   <span className="truncate">{wk.name}</span>
                               </div>
                               {currentWorkspace?.id === wk.id && <Check size={14} className="text-blue-700 dark:text-sky-400" />}
                           </button>
                       ))}
                  </div>
              )}
          </div>
        )}

        <div className="hidden sm:block w-[1px] h-4 bg-gray-400 dark:bg-white/20 mx-1"></div>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
            <button 
                onClick={onToggleFullscreen}
                className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-900 dark:text-gray-100"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
        )}
                
        {/* System Group with Notification Toggle */}
        <div className="flex items-center gap-2 px-2 py-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer">
            <button
                onClick={(e) => { e.stopPropagation(); onToggleNotificationPanel(); }}
                data-panel-trigger="true"
                className={`relative transition-colors rounded-sm flex items-center justify-center ${notificationPanelOpen ? 'text-blue-700 dark:text-sky-400' : 'text-gray-900 dark:text-gray-100'}`}
            >
                <Bell size={16} fill={notificationPanelOpen ? "currentColor" : "none"} />
                {recentItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3.5 min-w-[14px] flex items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white border border-white dark:border-gray-900 shadow-sm leading-none px-0.5">
                        {recentItems.length > 9 ? '9+' : recentItems.length}
                    </span>
                )}
            </button>
        </div>
        
        <div className="flex flex-col items-end justify-center px-2 py-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer ml-1 text-right">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{formatTime(time)}</span>
            <span className="text-[10px] text-gray-700 dark:text-gray-400 font-bold">{formatDate(time)}</span>
        </div>
      </div>
    </div>
  );
};