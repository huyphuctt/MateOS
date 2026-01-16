import React, { useRef, useEffect } from 'react';
import { Search, Power, User, Lock } from 'lucide-react';
import { AppId, RecentItem } from '../../types';

interface StartMenuProps {
  isOpen: boolean;
  onAppClick: (id: AppId) => void;
  appIcons: Record<AppId, React.ReactNode>;
  onClose: () => void;
  onLogout: () => void;
  recentItems: RecentItem[];
  username: string;
  onOpenUserProfile: () => void;
  userAvatar?: string | null;
  onLock: () => void;
  isAdmin: boolean;
}

export const StartMenu: React.FC<StartMenuProps> = ({ 
    isOpen, 
    onAppClick, 
    appIcons, 
    onClose, 
    onLogout, 
    recentItems,
    username,
    onOpenUserProfile,
    userAvatar,
    onLock,
    isAdmin
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Check if the click was on the start button (which handles its own toggle via data attribute)
        const target = event.target as Element;
        if (!target.closest('[data-start-trigger]')) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const pinnedApps = [
    { id: AppId.BROWSER, name: 'Edge' },
    { id: AppId.COPILOT, name: 'Copilot' },
    { id: AppId.NOTEPAD, name: 'Notepad' },
    { id: AppId.PHOTOS, name: 'Photos' },
    ...(isAdmin ? [{ id: AppId.ADMIN, name: 'Admin' }] : []),
    { id: AppId.SETTINGS, name: 'Settings' },
    { id: AppId.CALCULATOR, name: 'Calculator' },
  ];

  return (
    <div 
        ref={menuRef}
        className={`absolute left-1/2 -translate-x-1/2 w-[640px] max-w-[90vw] h-[650px] max-h-[70vh] bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-3xl rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.25)] border border-white/40 dark:border-gray-700/50 z-[9998] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] origin-bottom
        ${isOpen 
            ? 'bottom-14 opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'bottom-14 opacity-0 translate-y-12 scale-95 pointer-events-none' 
        }`}
    >
      
      {/* Search Bar */}
      <div className="p-6 pb-2">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search for apps, settings, and documents" 
                className="w-full bg-[#f3f3f3]/50 dark:bg-[#2d2d2d]/50 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-800 dark:text-gray-100 border border-white/10 dark:border-gray-600/50 shadow-inner"
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2">
        {/* Pinned Section */}
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 ml-2">Pinned</h3>
            <button className="text-xs bg-white/50 dark:bg-[#333]/50 px-2 py-1 rounded border border-gray-200/50 dark:border-gray-600/50 text-gray-600 dark:text-gray-300 shadow-sm backdrop-blur-sm">All apps &gt;</button>
        </div>
        
        <div className="grid grid-cols-6 gap-2 mb-8">
            {pinnedApps.map(app => (
                <button 
                    key={app.id} 
                    onClick={() => onAppClick(app.id)}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-white/50 dark:hover:bg-white/5 rounded-md transition-colors group"
                >
                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-md shadow-sm flex items-center justify-center text-gray-700 dark:text-gray-200 group-hover:scale-105 transition-transform">
                        {appIcons[app.id]}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate w-full text-center">{app.name}</span>
                </button>
            ))}
        </div>

        {/* Recommended Section (Recent Items) */}
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 ml-2">Recommended</h3>
            <button className="text-xs bg-white/50 dark:bg-[#333]/50 px-2 py-1 rounded border border-gray-200/50 dark:border-gray-600/50 text-gray-600 dark:text-gray-300 shadow-sm backdrop-blur-sm">More &gt;</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
            {recentItems.map((item, i) => (
                <button key={item.id} className="flex items-center gap-3 p-3 hover:bg-white/50 dark:hover:bg-white/5 rounded-md text-left transition-colors group">
                     {/* Use icon from global data, fallback to generic styling if icon isn't standard */}
                    <div className="w-8 h-8 bg-blue-100/80 dark:bg-blue-900/40 rounded flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                        {item.icon ? (
                            React.cloneElement(item.icon as React.ReactElement<any>, { size: 16 })
                        ) : (
                            item.title.split('.').pop()?.toUpperCase().substring(0, 3) || 'DOC'
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">{item.title}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</span>
                    </div>
                </button>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="h-16 bg-gray-100/40 dark:bg-[#1a1a1a]/40 border-t border-gray-200/30 dark:border-gray-700/30 flex items-center justify-between px-8 rounded-b-lg backdrop-blur-md">
        <button 
            onClick={onOpenUserProfile}
            className="flex items-center gap-3 hover:bg-white/50 dark:hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors text-left"
        >
            <div className="w-9 h-9 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                {userAvatar ? (
                    <img src={userAvatar} className="w-full h-full object-cover" alt="User" />
                ) : (
                    <User size={18} className="text-gray-600 dark:text-gray-200"/>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">{username || 'Guest User'}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {username ? `${username.toLowerCase().replace(/\s+/g, '.')}@mateos.com` : 'guest@mateos.com'}
                </span>
            </div>
        </button>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={onLock}
                className="p-3 hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-colors"
                title="Lock Screen"
            >
                <Lock size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
            <button 
                onClick={onLogout}
                className="p-3 hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-colors"
                title="Log Out"
            >
                <Power size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
        </div>
      </div>
    </div>
  );
};