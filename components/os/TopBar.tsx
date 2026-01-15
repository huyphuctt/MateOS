import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Battery, Search, Command, X, UserCircle } from 'lucide-react';
import { RecentItem } from '../../types';

interface TopBarProps {
  activeAppTitle?: string;
  onOpenSettings: () => void;
  onLogout: () => void;
  recentItems: RecentItem[];
  username: string;
  onOpenUserProfile: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    activeAppTitle = 'MateOS', 
    onOpenSettings, 
    onLogout, 
    recentItems, 
    username,
    onOpenUserProfile
}) => {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle click outside for Apple Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
    };

    if (menuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Handle click outside for Side Panel
  useEffect(() => {
    const handleClickOutsidePanel = (event: MouseEvent) => {
        if (panelOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
            const target = event.target as HTMLElement;
            // Prevent closing if clicking the trigger itself
            if (!target.closest('[data-panel-trigger]')) {
                setPanelOpen(false);
            }
        }
    };
    
    if (panelOpen) {
        document.addEventListener('mousedown', handleClickOutsidePanel);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsidePanel);
  }, [panelOpen]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <>
        <div className="absolute top-0 left-0 right-0 h-7 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-[9999] text-xs font-medium text-white select-none rounded-t-lg shadow-sm">
        <div className="flex items-center gap-4 h-full relative" ref={menuRef}>
            <div 
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${menuOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => setMenuOpen(!menuOpen)}
            >
            <Command size={15} />
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-2xl rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-white/20 dark:border-gray-700/50 p-1.5 flex flex-col z-[10000] animate-in fade-in zoom-in-95 duration-100">
                    <button 
                        onClick={() => { onOpenUserProfile(); setMenuOpen(false); }}
                        className="text-left px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-100 transition-colors flex items-center gap-2 group"
                    >
                        <UserCircle size={14} className="text-gray-500 group-hover:text-white" />
                        <span className="truncate max-w-[160px]">{username || 'User'}</span>
                    </button>
                    <div className="h-[1px] bg-gray-400/20 my-1 mx-2"></div>
                    <button 
                        onClick={() => { onOpenSettings(); setMenuOpen(false); }}
                        className="text-left px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-100 transition-colors"
                    >
                        System Settings...
                    </button>
                    <div className="h-[1px] bg-gray-400/20 my-1 mx-2"></div>
                    <button 
                        onClick={() => { onLogout(); setMenuOpen(false); }}
                        className="text-left px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white text-gray-800 dark:text-gray-100 transition-colors"
                    >
                        Log Out...
                    </button>
                </div>
            )}

            <span className="font-bold cursor-default">{activeAppTitle}</span>
        </div>

        <div className="flex items-center gap-3 h-full">
            <div className="flex items-center gap-3 px-2">
                <Battery size={16} className="rotate-90" />
                <Wifi size={14} />
                <Search size={14} />
                <Command size={14} />
            </div>
            {/* Clock Trigger */}
            <div 
                data-panel-trigger="true"
                onClick={() => setPanelOpen(!panelOpen)}
                className={`flex items-center gap-2 px-3 py-0.5 rounded transition-colors cursor-pointer select-none ${panelOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
                <span>{formatDate(time)}</span>
                <span>{formatTime(time)}</span>
            </div>
        </div>
        </div>

        {/* Slide Panel (Notification Center) */}
        <div 
            ref={panelRef}
            className={`fixed top-7 right-0 bottom-0 w-80 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-3xl border-l border-white/20 dark:border-gray-700/30 shadow-2xl z-[10000] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] transform ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="p-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Recent Items</h3>
                    <button onClick={() => setPanelOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {/* Recent Items List */}
                    {recentItems.map(item => (
                        <div key={item.id} className="bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 rounded-xl flex items-start gap-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-default shadow-sm group">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate pr-2">{item.title}</h4>
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{item.timestamp}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
                            </div>
                        </div>
                    ))}

                    {/* Widgets Section Mock */}
                    <div className="pt-4">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Widgets</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="aspect-square bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white flex flex-col justify-between shadow-lg cursor-pointer hover:brightness-110 transition-all">
                                <span className="text-xs font-medium">Weather</span>
                                <div>
                                    <span className="text-2xl font-bold">72°</span>
                                    <p className="text-[10px] opacity-80">Sunny</p>
                                </div>
                            </div>
                            <div className="aspect-square bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col justify-between shadow-lg border border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                                <span className="text-xs font-medium text-gray-500">Stocks</span>
                                <div>
                                    <span className="text-lg font-bold text-green-500">+1.2%</span>
                                    <p className="text-[10px] text-gray-400">AAPL</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};