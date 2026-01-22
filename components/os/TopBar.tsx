
import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Battery, Search, Command, User, ChevronDown, Building, Layers, Check, Bell, Maximize, Minimize } from 'lucide-react';
import { RecentItem, Organization, Workspace } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  activeAppTitle?: string;
  onOpenSettings: () => void;
  onLogout: () => void;
  recentItems: RecentItem[];
  name: string;
  onOpenUserProfile: () => void;
  userAvatar?: string | null;
  onLock: () => void;
  organizations: Organization[];
  currentOrg?: Organization;
  currentWorkspace?: Workspace;
  onSwitchOrg: (orgId: number) => void;
  onSwitchWorkspace: (wkId: number) => void;
  notificationPanelOpen: boolean;
  onToggleNotificationPanel: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    activeAppTitle = 'MateOS', 
    recentItems, 
    userAvatar,
    onOpenUserProfile,
    notificationPanelOpen,
    onToggleNotificationPanel,
    isFullscreen,
    onToggleFullscreen
}) => {
  // Access auth context directly to show it's available everywhere
  const { user, activeOrg, activeWorkspace, logout, lock, switchOrg, switchWorkspace } = useAuth();
  
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
        if (contextOpen && contextRef.current && !contextRef.current.contains(event.target as Node)) setContextOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, contextOpen]);

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const showContextSwitcher = activeOrg && (user?.organizations.length || 0) > 1 || (activeOrg?.workspaces.length || 0) > 1;

  return (
    <div className="absolute top-0 left-0 right-0 h-7 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-[9999] text-xs font-medium text-white select-none rounded-t-lg shadow-sm">
        <div className="flex items-center gap-4 h-full relative" ref={menuRef}>
            <div 
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${menuOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => setMenuOpen(!menuOpen)}
            >
                <Command size={15} />
            </div>

            {menuOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-2xl rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-white/20 dark:border-gray-700/50 p-1.5 flex flex-col z-[10000] animate-in fade-in zoom-in-95 duration-100">
                    <button 
                        onClick={() => { onOpenUserProfile(); setMenuOpen(false); }}
                        className="text-left px-3 py-2 rounded hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-100 transition-colors flex items-center gap-3 group"
                    >
                        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" alt="User" /> : <User size={24} className="text-gray-500 group-hover:text-white" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{user?.name || 'User'}</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-blue-100 truncate font-normal">
                                {user?.email || 'guest@mateos.com'}
                            </span>
                        </div>
                    </button>
                    <div className="h-[1px] bg-gray-400/20 my-1 mx-2"></div>
                    <button onClick={() => { lock(); setMenuOpen(false); }} className="text-left px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-100 transition-colors text-sm">Lock Screen</button>
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-100 transition-colors text-sm">Log Out...</button>
                </div>
            )}
            <span className="font-bold cursor-default">{activeAppTitle}</span>
        </div>

        <div className="flex items-center gap-3 h-full">
            {showContextSwitcher && (
                <div className="relative mr-2" ref={contextRef}>
                    <button onClick={() => setContextOpen(!contextOpen)} className={`flex items-center gap-2 px-2 py-0.5 rounded transition-colors cursor-pointer border border-transparent ${contextOpen ? 'bg-white/20' : 'hover:bg-white/10 hover:border-white/10'}`}>
                        <div className="flex items-center gap-1.5"><Building size={12} className="text-blue-300"/><span className="truncate max-w-[100px]">{activeOrg?.name}</span></div>
                        <span className="opacity-50 text-[10px]">/</span>
                        <div className="flex items-center gap-1.5"><span className="truncate max-w-[80px]">{activeWorkspace?.name || 'All'}</span></div>
                        <ChevronDown size={10} className="opacity-70 ml-1" />
                    </button>

                    {contextOpen && (
                        <div className="absolute top-full right-0 mt-1 w-64 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-2xl rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-white/20 dark:border-gray-700/50 p-2 flex flex-col z-[10000] animate-in fade-in zoom-in-95 duration-100">
                             <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Organization</div>
                             {user?.organizations.map(org => (
                                 <button key={org.id} onClick={() => { switchOrg(org.id); setContextOpen(false); }} className={`text-left px-3 py-1.5 rounded text-sm flex items-center justify-between mb-1 transition-colors ${activeOrg?.id === org.id ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                     <span className="truncate">{org.name}</span>{activeOrg?.id === org.id && <Check size={12} />}
                                 </button>
                             ))}
                             <div className="h-[1px] bg-gray-400/20 my-2 mx-1"></div>
                             <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Workspace</div>
                             {activeOrg?.workspaces.map(wk => (
                                 <button key={wk.id} onClick={() => { switchWorkspace(wk.id); setContextOpen(false); }} className={`text-left px-3 py-1.5 rounded text-sm flex items-center justify-between mb-1 transition-colors ${activeWorkspace?.id === wk.id ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                     <div className="flex items-center gap-2"><Layers size={12} className={activeWorkspace?.id === wk.id ? 'text-blue-500' : 'text-gray-400'}/><span className="truncate">{wk.name}</span></div>
                                     {activeWorkspace?.id === wk.id && <Check size={12} className="text-blue-500" />}
                                 </button>
                             ))}
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2 px-2">
                 {onToggleFullscreen && <button onClick={onToggleFullscreen} className="p-1 rounded hover:bg-white/10 transition-colors text-white" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>}
                <button onClick={onToggleNotificationPanel} data-panel-trigger="true" className={`flex items-center gap-1.5 p-1 rounded hover:bg-white/10 transition-colors ${notificationPanelOpen ? 'text-blue-300' : 'text-white'}`}>
                    <Bell size={16} fill={notificationPanelOpen ? "currentColor" : "none"} />
                    {recentItems.length > 0 && <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none px-1 border border-black/20 text-white shadow-sm">{recentItems.length > 9 ? '9+' : recentItems.length}</span>}
                </button>
            </div>
            <div data-panel-trigger="true" className="flex items-center gap-2 px-3 py-0.5 rounded transition-colors cursor-pointer select-none hover:bg-white/10">
                <span>{formatDate(time)}</span><span>{formatTime(time)}</span>
            </div>
        </div>
    </div>
  );
};
