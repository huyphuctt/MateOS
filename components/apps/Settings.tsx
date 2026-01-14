import React, { useState } from 'react';
import { Monitor, Palette, Check, Search } from 'lucide-react';
import { Theme } from '../../types';

interface SettingsAppProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hideTaskbar: boolean;
  setHideTaskbar: (hide: boolean) => void;
  username?: string;
  onManageAccount?: () => void;
}

type SettingsSection = 'user' | 'appearance' | 'desktop';

export const SettingsApp: React.FC<SettingsAppProps> = ({ 
    theme, 
    setTheme, 
    hideTaskbar, 
    setHideTaskbar, 
    username,
    onManageAccount 
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('user');

  // Sidebar Item Component
  const SidebarItem = ({ id, icon: Icon, label }: { id: SettingsSection, icon: any, label: string }) => (
    <button 
        onClick={() => setActiveSection(id)}
        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
            activeSection === id 
            ? 'bg-blue-500 text-white shadow-sm' 
            : 'text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'
        }`}
    >
        <div className={`p-0.5 rounded ${activeSection === id ? 'text-white' : 'text-blue-500 bg-blue-500/10 dark:bg-blue-400/20'}`}>
            <Icon size={15} />
        </div>
        <span className="flex-1 text-left">{label}</span>
    </button>
  );

  return (
    <div className="flex h-full bg-[#f5f5f7] dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-[260px] flex flex-col border-r border-gray-200/60 dark:border-white/10 bg-[#fbfbfb]/80 dark:bg-[#2d2d2d]/80 pt-8 px-4 pb-4 gap-4 backdrop-blur-xl">
        
        {/* Search */}
        <div className="relative mb-2 px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md py-1 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
            />
        </div>

        {/* User Card (Apple ID style) */}
        <button 
            onClick={() => setActiveSection('user')}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors group mb-2 ${
                activeSection === 'user' ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0">
                {(username || 'User').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-start overflow-hidden min-w-0">
                <span className="font-semibold text-sm truncate w-full text-left">{username || 'Guest User'}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-full text-left leading-tight">Apple ID, iCloud, Media & App Store</span>
            </div>
        </button>

        {/* Navigation List */}
        <div className="flex flex-col gap-0.5 overflow-y-auto px-1">
            <SidebarItem id="appearance" icon={Palette} label="Appearance" />
            <SidebarItem id="desktop" icon={Monitor} label="Desktop & Dock" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-10 py-12 bg-white dark:bg-[#1e1e1e]">
        
        {/* USER SECTION */}
        {activeSection === 'user' && (
             <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-6 mb-8">
                     <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-inner shrink-0">
                        {(username || 'User').charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h2 className="text-2xl font-semibold mb-1">{username || 'Guest User'}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{username ? `${username.toLowerCase().replace(/\s+/g, '.')}@mateos.com` : 'guest@mateos.com'}</p>
                     </div>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm">
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                            <div>
                                <span className="block font-medium text-sm">Personal Information</span>
                                <span className="text-xs text-gray-500">Name, birthday, and photo</span>
                            </div>
                            <button className="text-xs text-blue-500 hover:underline">Edit</button>
                        </div>
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                             <div>
                                <span className="block font-medium text-sm">Sign-In & Security</span>
                                <span className="text-xs text-gray-500">Password and security options</span>
                            </div>
                            <button className="text-xs text-blue-500 hover:underline">Edit</button>
                        </div>
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                             <div>
                                <span className="block font-medium text-sm">Payment & Shipping</span>
                                <span className="text-xs text-gray-500">Methods and addresses</span>
                            </div>
                            <button className="text-xs text-blue-500 hover:underline">Edit</button>
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <button 
                            onClick={onManageAccount}
                            className="bg-white dark:bg-[#333] border border-gray-300 dark:border-black/30 px-4 py-1.5 rounded-md shadow-sm text-sm font-medium active:scale-95 transition-transform hover:bg-gray-50 dark:hover:bg-[#444]"
                        >
                            Manage Account...
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* APPEARANCE SECTION */}
        {activeSection === 'appearance' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                 <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                 
                 <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 mb-6 shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 block">Theme</span>
                    <div className="grid grid-cols-2 gap-6">
                         <button 
                            onClick={() => setTheme('aero')}
                            className="group flex flex-col gap-2 text-left"
                        >
                            <div className={`
                                w-full aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all relative
                                ${theme === 'aero' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600'}
                            `}>
                                <div className="h-full w-full bg-gradient-to-br from-blue-400 to-blue-600 relative">
                                    <div className="absolute top-2 left-2 w-16 h-12 bg-white/20 rounded-md backdrop-blur-md border border-white/30"></div>
                                    <div className="absolute bottom-0 w-full h-8 bg-white/30 backdrop-blur-md border-t border-white/20"></div>
                                </div>
                                {theme === 'aero' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <div className="bg-blue-500 rounded-full p-1 shadow-md">
                                            <Check size={16} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium ml-1">Aero</span>
                        </button>

                        <button 
                            onClick={() => setTheme('aqua')}
                             className="group flex flex-col gap-2 text-left"
                        >
                             <div className={`
                                w-full aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all relative
                                ${theme === 'aqua' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600'}
                            `}>
                                <div className="h-full w-full bg-gradient-to-br from-purple-400 to-pink-600 relative">
                                    <div className="absolute top-2 left-2 w-16 h-12 bg-white/20 rounded-md backdrop-blur-md border border-white/30"></div>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-white/30 backdrop-blur-sm rounded-full"></div>
                                </div>
                                {theme === 'aqua' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <div className="bg-blue-500 rounded-full p-1 shadow-md">
                                            <Check size={16} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium ml-1">Aqua</span>
                        </button>
                    </div>
                 </div>
            </div>
        )}

        {/* DESKTOP SECTION */}
        {activeSection === 'desktop' && (
             <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                 <h2 className="text-xl font-semibold mb-6">Desktop & Dock</h2>

                 <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm">
                    <div className="p-4 flex items-center justify-between">
                        <div className="pr-8">
                             <span className="block font-medium text-sm">Automatically hide and show the Dock</span>
                             <span className="text-xs text-gray-500">The dock will disappear when not in use and reappear when you move your mouse to the edge of the screen.</span>
                        </div>
                        
                        <button 
                            onClick={() => setHideTaskbar(!hideTaskbar)}
                            className={`
                                w-11 h-6 rounded-full transition-colors relative shrink-0
                                ${hideTaskbar ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                            `}
                        >
                            <div className={`
                                absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200
                                ${hideTaskbar ? 'translate-x-5' : 'translate-x-0'}
                            `} />
                        </button>
                    </div>
                 </div>
                 
                 <div className="mt-6">
                    <span className="text-xs text-gray-500">Additional desktop customization options will appear here in future updates.</span>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};