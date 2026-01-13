import React from 'react';
import { Monitor, Layout, Smartphone } from 'lucide-react';
import { Theme } from '../../types';

interface SettingsAppProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ theme, setTheme }) => {
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
                    Operating System Theme
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setTheme('windows')}
                        className={`
                            relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                            ${theme === 'windows' 
                                ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-md scale-[1.02]' 
                                : 'border-transparent bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'}
                        `}
                    >
                        <div className="w-full aspect-video bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute bottom-0 w-full h-3 bg-white/30 backdrop-blur-sm"></div>
                            <div className="text-white font-bold text-xl">Win 11</div>
                        </div>
                        <div className="flex items-center justify-between w-full px-2">
                            <span className="font-medium">Windows 11</span>
                            {theme === 'windows' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                        </div>
                    </button>

                    <button 
                        onClick={() => setTheme('macos')}
                        className={`
                            relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                            ${theme === 'macos' 
                                ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-md scale-[1.02]' 
                                : 'border-transparent bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'}
                        `}
                    >
                         <div className="w-full aspect-video bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-white/30 backdrop-blur-sm rounded-full"></div>
                            <div className="text-white font-bold text-xl">macOS</div>
                        </div>
                        <div className="flex items-center justify-between w-full px-2">
                            <span className="font-medium">macOS Sequoia</span>
                            {theme === 'macos' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
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