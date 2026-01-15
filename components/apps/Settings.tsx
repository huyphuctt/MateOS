import React, { useState } from 'react';
import { Monitor, Palette, Check, Search, User, Shield, CreditCard, UserCircle } from 'lucide-react';
import { Theme } from '../../types';

interface SettingsAppProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hideTaskbar: boolean;
  setHideTaskbar: (hide: boolean) => void;
  username?: string;
  onManageAccount?: () => void;
}

type SettingsSection = 'user' | 'theme' | 'taskbar';

export const SettingsApp: React.FC<SettingsAppProps> = ({ 
    theme, 
    setTheme, 
    hideTaskbar, 
    setHideTaskbar, 
    username,
    onManageAccount 
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('user');

  return (
    <div className="flex h-full bg-[#f5f5f7] dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-[280px] flex flex-col border-r border-gray-200/60 dark:border-white/10 bg-[#fbfbfb]/80 dark:bg-[#2d2d2d]/80 pt-5 px-4 pb-4 gap-4 backdrop-blur-xl">
        
        {/* User Card */}
        <button 
            onClick={() => setActiveSection('user')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group mb-2 border ${
                activeSection === 'user' 
                ? 'bg-white dark:bg-white/10 border-gray-200/50 dark:border-white/5 shadow-sm' 
                : 'border-transparent hover:bg-white/50 dark:hover:bg-white/5'
            }`}
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0">
                {(username || 'User').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-start overflow-hidden min-w-0">
                <span className="font-semibold text-sm truncate w-full text-left text-gray-900 dark:text-white">{username || 'Guest User'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-left">Apple ID & iCloud</span>
            </div>
        </button>

        {/* Search */}
        <div className="relative px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
                type="text" 
                placeholder="Search settings..." 
                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
            />
        </div>

        {/* Navigation List */}
        <div className="flex flex-col gap-1 overflow-y-auto px-1 mt-2">
            <button 
                onClick={() => setActiveSection('theme')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === 'theme' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/10'
                }`}
            >
                <Palette size={18} className={activeSection === 'theme' ? 'text-white' : 'text-blue-500'} />
                <span className="flex-1 text-left">Theme</span>
            </button>
            
            <button 
                onClick={() => setActiveSection('taskbar')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === 'taskbar' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/10'
                }`}
            >
                <Monitor size={18} className={activeSection === 'taskbar' ? 'text-white' : 'text-blue-500'} />
                <span className="flex-1 text-left">Taskbar & {theme === 'aqua' ? 'Dock' : 'Taskbar'}</span>
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1e1e1e]">
        <div className="max-w-3xl mx-auto py-12 px-8">
            
            {/* USER SECTION */}
            {activeSection === 'user' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {(username || 'User').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{username || 'Guest User'}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{username ? `${username.toLowerCase().replace(/\s+/g, '.')}@mateos.com` : 'guest@mateos.com'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Account Settings</h3>
                        <div className="bg-[#f5f5f7] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5">
                            <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                                <User className="text-blue-500" size={20} />
                                <div className="flex-1 text-left">
                                    <span className="block font-medium text-sm text-gray-900 dark:text-white">Personal Information</span>
                                    <span className="text-xs text-gray-500">Edit photo, name, and birthday</span>
                                </div>
                            </button>
                            <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                                <Shield className="text-blue-500" size={20} />
                                <div className="flex-1 text-left">
                                    <span className="block font-medium text-sm text-gray-900 dark:text-white">Sign-In & Security</span>
                                    <span className="text-xs text-gray-500">Password and authentication</span>
                                </div>
                            </button>
                             <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                                <CreditCard className="text-blue-500" size={20} />
                                <div className="flex-1 text-left">
                                    <span className="block font-medium text-sm text-gray-900 dark:text-white">Payment & Shipping</span>
                                    <span className="text-xs text-gray-500">Payment methods and delivery address</span>
                                </div>
                            </button>
                        </div>
                        <div className="pt-2">
                            <button 
                                onClick={onManageAccount}
                                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                            >
                                Manage Account Details...
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* THEME SECTION */}
            {activeSection === 'theme' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Theme</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Customize the look and feel of MateOS.</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-6">
                        {/* Aero Option */}
                         <button 
                            onClick={() => setTheme('aero')}
                            className={`group relative flex flex-col gap-3 text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                theme === 'aero' 
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                                : 'border-transparent bg-[#f5f5f7] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            <div className="w-full aspect-[16/10] bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                                <div className="absolute top-2 left-2 w-16 h-12 bg-white/20 rounded-md backdrop-blur-md border border-white/30"></div>
                                <div className="absolute bottom-0 w-full h-6 bg-white/30 backdrop-blur-md border-t border-white/20"></div>
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <span className={`font-medium ${theme === 'aero' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>Aero</span>
                                {theme === 'aero' && <Check size={18} className="text-blue-500" />}
                            </div>
                        </button>

                        {/* Aqua Option */}
                        <button 
                            onClick={() => setTheme('aqua')}
                            className={`group relative flex flex-col gap-3 text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                theme === 'aqua' 
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                                : 'border-transparent bg-[#f5f5f7] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            <div className="w-full aspect-[16/10] bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                                <div className="absolute top-2 left-2 w-16 h-12 bg-white/20 rounded-md backdrop-blur-md border border-white/30"></div>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white/30 backdrop-blur-sm rounded-full"></div>
                            </div>
                             <div className="flex items-center justify-between w-full">
                                <span className={`font-medium ${theme === 'aqua' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>Aqua</span>
                                {theme === 'aqua' && <Check size={18} className="text-blue-500" />}
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* TASKBAR SECTION */}
            {activeSection === 'taskbar' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Taskbar & {theme === 'aqua' ? 'Dock' : 'Taskbar'}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage how your applications are organized.</p>
                     </div>

                     <div className="bg-[#f5f5f7] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5">
                        <div className="p-4 flex items-center justify-between">
                            <div className="pr-8">
                                 <span className="block font-medium text-sm text-gray-900 dark:text-white">Automatically hide and show the {theme === 'aqua' ? 'Dock' : 'Taskbar'}</span>
                                 <span className="text-xs text-gray-500 mt-1 block">When enabled, the {theme === 'aqua' ? 'dock' : 'taskbar'} will slide out of view when not in use.</span>
                            </div>
                            
                            <button 
                                onClick={() => setHideTaskbar(!hideTaskbar)}
                                className={`
                                    w-11 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50
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
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};