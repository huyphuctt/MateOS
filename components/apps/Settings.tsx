import React from 'react';
import { Monitor, Layout, Smartphone, Check } from 'lucide-react';
import { Theme } from '../../types';

interface SettingsAppProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hideTaskbar: boolean;
  setHideTaskbar: (hide: boolean) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ theme, setTheme, hideTaskbar, setHideTaskbar }) => {
  return (
    <div className="flex flex-col h-full bg-[#f3f3f3] dark:bg-[#202020] text-gray-900 dark:text-gray-100">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your experience</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Theme Section */}
            <section>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Layout size={20} />
                    Theme
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setTheme('aero')}
                        className={`
                            relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                            ${theme === 'aero' 
                                ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-md scale-[1.02]' 
                                : 'border-transparent bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'}
                        `}
                    >
                        <div className="w-full aspect-video bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute bottom-0 w-full h-3 bg-white/30 backdrop-blur-sm"></div>
                            <div className="text-white font-bold text-xl">Aero</div>
                        </div>
                        <div className="flex items-center justify-between w-full px-2">
                            <span className="font-medium">Aero Layout</span>
                            {theme === 'aero' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                        </div>
                    </button>

                    <button 
                        onClick={() => setTheme('aqua')}
                        className={`
                            relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                            ${theme === 'aqua' 
                                ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-md scale-[1.02]' 
                                : 'border-transparent bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'}
                        `}
                    >
                         <div className="w-full aspect-video bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-white/30 backdrop-blur-sm rounded-full"></div>
                            <div className="text-white font-bold text-xl">Aqua</div>
                        </div>
                        <div className="flex items-center justify-between w-full px-2">
                            <span className="font-medium">Aqua Layout</span>
                            {theme === 'aqua' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                        </div>
                    </button>
                </div>
            </section>

             {/* Taskbar Behaviors */}
             <section>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Monitor size={20} />
                    Taskbar Behaviors
                </h2>
                
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-1">
                    <button 
                        onClick={() => setHideTaskbar(!hideTaskbar)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                    >
                        <div className="flex flex-col">
                            <span className="font-medium">{theme === 'aqua' ? 'Automatically hide and show the Dock' : 'Automatically hide the taskbar'}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {hideTaskbar ? 'Taskbar will appear when you hover near the bottom of the screen' : 'Taskbar is always visible'}
                            </span>
                        </div>
                        <div className={`
                            w-6 h-6 rounded-md border flex items-center justify-center transition-colors
                            ${hideTaskbar 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'bg-transparent border-gray-400 dark:border-gray-500'}
                        `}>
                            {hideTaskbar && <Check size={16} className="text-white" />}
                        </div>
                    </button>
                </div>
            </section>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 text-sm text-blue-800 dark:text-blue-200">
                <p>Note: Switching themes will modify the layout of the taskbar, window controls, and start menu behavior immediately.</p>
            </div>
        </div>
      </div>
    </div>
  );
};