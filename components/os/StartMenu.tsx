
import React, { useRef, useEffect } from 'react';
import { Search, Power, User, Lock } from 'lucide-react';
import { AppId } from '../../types';

interface StartMenuProps {
  isOpen: boolean;
  onAppClick: (id: AppId) => void;
  appIcons: Record<AppId, React.ReactNode>;
  onClose: () => void;
  onLogout: () => void;
  name: string;
  onOpenUserProfile: () => void;
  userAvatar?: string | null;
  onLock: () => void;
  isAdmin: boolean;
}

interface StartMenuItem {
    id: AppId;
    name: string;
    image?: string;
}

export const StartMenu: React.FC<StartMenuProps> = ({ 
    isOpen, 
    onAppClick, 
    appIcons, 
    onClose, 
    onLogout, 
    name,
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

  const pinnedApps: StartMenuItem[] = [
    { id: AppId.VAULT, name: 'Vault' },
    ...(isAdmin ? [{ id: AppId.ADMIN, name: 'Admin' }] : []),
    { id: AppId.SETTINGS, name: 'Settings' },
    { id: AppId.PIGEON, name: 'Pigeon' },
    { id: AppId.WORKSHOP, name: 'Workshop' },
  ];

  return (
    <div 
        ref={menuRef}
        className={`absolute left-1/2 -translate-x-1/2 w-[640px] max-w-[90vw] h-[350px] max-h-[70vh] bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-3xl rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.25)] border border-white/40 dark:border-gray-700/50 z-[9998] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] origin-bottom
        ${isOpen 
            ? 'bottom-14 opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'bottom-14 opacity-0 translate-y-12 scale-95 pointer-events-none' 
        }`}
    >
      
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {/* Pinned Section */}
        <div className="flex items-center justify-between mb-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 ml-2">Pinned</h3>
        </div>
        
        <div className="grid grid-cols-6 gap-2 mb-8">
            {pinnedApps.map(app => (
                <button 
                    key={app.id} 
                    onClick={() => onAppClick(app.id)}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-white/50 dark:hover:bg-white/5 rounded-md transition-colors group"
                >
                    <div className="w-10 h-10 bg-stone-400 dark:bg-gray-700 rounded-md shadow-sm flex items-center justify-center text-gray-700 dark:text-gray-200 group-hover:scale-105 transition-transform overflow-hidden relative">
                        {app.image ? (
                            <img src={app.image} alt={app.name} className="w-full h-full object-cover" />
                        ) : (
                            appIcons[app.id]
                        )}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate w-full text-center">{app.name}</span>
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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">{name || 'Guest User'}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {name ? `${name.toLowerCase().replace(/\s+/g, '.')}@mateos.com` : 'guest@mateos.com'}
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
