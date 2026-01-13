import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { AppId } from '../../types';

interface LaunchpadProps {
  isOpen: boolean;
  onAppClick: (id: AppId) => void;
  appIcons: Record<AppId, React.ReactNode>;
  onClose: () => void;
}

export const Launchpad: React.FC<LaunchpadProps> = ({ isOpen, onAppClick, appIcons, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setAnimate(true);
    } else {
        const timer = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Apps to display
  const apps = [
    { id: AppId.COPILOT, name: 'Copilot' },
    { id: AppId.BROWSER, name: 'Safari' }, // Renamed for effect, but ID is same
    { id: AppId.NOTEPAD, name: 'Notes' },
    { id: AppId.PHOTOS, name: 'Photos' },
    { id: AppId.SETTINGS, name: 'Settings' },
    { id: AppId.CALCULATOR, name: 'Calculator' },
  ];

  const filteredApps = apps.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen && !animate) return null;

  return (
    <div 
        className={`fixed inset-0 z-[9999] overflow-hidden transition-all duration-300 ease-in-out
        ${isOpen ? 'backdrop-blur-2xl bg-black/40 opacity-100' : 'backdrop-blur-none bg-transparent opacity-0 pointer-events-none'}`}
        onClick={onClose}
    >
        {/* Search */}
        <div className={`w-full flex justify-center mt-20 transition-all duration-500 delay-100 ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
             <div className="relative w-72" onClick={e => e.stopPropagation()}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200" size={16} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search" 
                    className="w-full bg-white/20 border border-white/20 text-white placeholder-gray-300 rounded-lg py-1.5 pl-9 pr-4 text-center focus:text-left focus:bg-white/30 focus:outline-none transition-all"
                />
             </div>
        </div>

        {/* Grid */}
        <div className="container mx-auto px-10 mt-10">
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-8 justify-items-center">
                {filteredApps.map((app, index) => (
                    <button 
                        key={app.id}
                        onClick={(e) => { e.stopPropagation(); onAppClick(app.id); }}
                        className={`flex flex-col items-center gap-3 group transition-all duration-500 
                            ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'}`}
                        style={{ transitionDelay: `${index * 50}ms` }}
                    >
                        <div className="w-20 h-20 bg-white/10 group-hover:bg-white/20 rounded-[1.5rem] shadow-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 border border-white/10 backdrop-blur-sm">
                            {React.cloneElement(appIcons[app.id] as React.ReactElement<any>, { size: 40, className: 'text-white drop-shadow-md' })}
                        </div>
                        <span className="text-white font-medium text-sm tracking-wide text-shadow-sm">{app.name}</span>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};