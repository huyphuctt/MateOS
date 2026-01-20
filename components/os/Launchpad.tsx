import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { AppId } from '../../types';

interface LaunchpadProps {
  isOpen: boolean;
  onAppClick: (id: AppId) => void;
  appIcons: Record<AppId, React.ReactNode>;
  onClose: () => void;
  isAdmin: boolean;
}

export const Launchpad: React.FC<LaunchpadProps> = ({ isOpen, onAppClick, appIcons, onClose, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setShow(true);
    } else {
        const timer = setTimeout(() => setShow(false), 350); // Match transition duration
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Apps to display
  const apps = [
    { id: AppId.VAULT, name: 'Vault' }, // Renamed for effect, but ID is same
    ...(isAdmin ? [{ id: AppId.ADMIN, name: 'Admin Console' }] : []),
    { id: AppId.SETTINGS, name: 'Settings' },    
  ];

  const filteredApps = apps.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen && !show) return null;

  return (
    <div 
        className="fixed inset-0 z-[9999] overflow-hidden"
        onClick={onClose}
    >
        {/* Background Backdrop - Fades In/Out */}
        <div className={`absolute inset-0 bg-sky-400/40 backdrop-blur-3xl transition-opacity duration-300 ease-in-out
            ${isOpen ? 'opacity-95' : 'opacity-0'}
        `} />

        {/* Content Container - Zooms In/Out */}
        <div className={`relative w-full h-full flex flex-col items-center justify-start pt-24 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}>

            {/* Grid */}
            <div className="container mx-auto px-10">
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-8 gap-y-12 justify-items-center">
                    {filteredApps.map((app) => (
                        <button 
                            key={app.id}
                            onClick={(e) => { e.stopPropagation(); onAppClick(app.id); }}
                            className="flex flex-col items-center gap-3 group"
                        >
                            <div className="w-20 h-20 bg-white/10 group-hover:bg-white/20 rounded-[1.6rem] shadow-2xl flex items-center justify-center text-white transition-transform duration-200 group-active:scale-95 border border-white/10 backdrop-blur-md">
                                {React.cloneElement(appIcons[app.id] as React.ReactElement<any>, { size: 42, className: 'text-white drop-shadow-md' })}
                            </div>
                            <span className="text-white font-medium text-sm tracking-wide text-shadow-sm">{app.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};