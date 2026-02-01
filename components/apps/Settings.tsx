
import React, { useState } from 'react';
import { Monitor, Palette, Check, Search, User, Shield, CreditCard, Image as ImageIcon, Upload, Camera, Sun, Moon, Laptop } from 'lucide-react';
import { Theme, ColorMode } from '../../types';
import { WALLPAPERS } from '../../data/mock';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface SettingsAppProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  hideTaskbar: boolean;
  setHideTaskbar: (hide: boolean) => void;
  name?: string;
  email?: string;
  onManageAccount?: () => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
  userAvatar?: string | null;
  setUserAvatar: (avatar: string) => void;
}

type SettingsSection = 'user' | 'theme' | 'appearance' | 'taskbar' | 'wallpaper';

export const SettingsApp: React.FC<SettingsAppProps> = ({ 
    theme, 
    setTheme, 
    colorMode,
    setColorMode,
    hideTaskbar, 
    setHideTaskbar, 
    name,
    email,
    onManageAccount,
    wallpaper,
    setWallpaper
}) => {
  const { token, user } = useAuth();
  const [ userAvatar, setUserAvatar] = useState<string | null>(user?.avatar || null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('user');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Optimistic update
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setWallpaper(e.target.result);
        }
      };
      reader.readAsDataURL(file);

      // Upload to API
      if (token) {
          try {
              const response = await apiService.uploadImage(token, file, 'wallpaper');
              if (response.success && response.imageUrl) {
                  setWallpaper(response.imageUrl);
              }
          } catch (error) {
              console.error("Failed to upload wallpaper:", error);
          }
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Optimistic update
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          user.avatar = e.target.result;
          setUserAvatar(e.target.result);
        }
      };
      reader.readAsDataURL(file);

      // Upload to API
      if (token) {
          try {
              const response = await apiService.uploadImage(token, file, 'user.avatar');
              if (response.success && response.imageUrl) {
                  user.avatar = response.imageUrl;
                  setUserAvatar(response.imageUrl);
              }
          } catch (error) {
              console.error("Failed to upload avatar:", error);
          }
      }
    }
  };

  return (
    <div className="flex h-full bg-[#f5f5f7] dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-[280px] flex flex-col border-r border-gray-200/60 dark:border-white/10 bg-[#fbfbfb]/80 dark:bg-[#2d2d2d]/80 pt-5 px-4 pb-4 gap-4 backdrop-blur-xl shrink-0">
        
        {/* User Card */}
        <button 
            onClick={() => setActiveSection('user')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group mb-2 border ${
                activeSection === 'user' 
                ? 'bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 shadow-sm' 
                : 'border-transparent hover:bg-white/50 dark:hover:bg-white/5'
            }`}
        >
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0 overflow-hidden">
                {userAvatar || user?.avatar ? (
                    <img src={userAvatar || user?.avatar} className="w-full h-full object-cover" alt="User" />
                ) : (
                    <img src='/images/profile.png' className="w-full h-full object-cover" alt="User" />
                )}
            </div>
            <div className="flex flex-col items-start overflow-hidden min-w-0">
                <span className="font-bold text-sm truncate w-full text-left text-gray-900 dark:text-white">{name || 'Guest User'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-left">Account & Settings</span>
            </div>
        </button>

        {/* Search */}
        <div className="relative px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
                type="text" 
                placeholder="Search settings..." 
                className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
            />
        </div>

        {/* Navigation List */}
        <div className="flex flex-col gap-1 overflow-y-auto px-1 mt-2">
            <button 
                onClick={() => setActiveSection('appearance')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeSection === 'appearance' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/10'
                }`}
            >
                <Sun size={18} className={activeSection === 'appearance' ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                <span className="flex-1 text-left">Appearance</span>
            </button>

            <button 
                onClick={() => setActiveSection('theme')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeSection === 'theme' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/10'
                }`}
            >
                <Palette size={18} className={activeSection === 'theme' ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                <span className="flex-1 text-left">Desktop Style</span>
            </button>

            <button 
                onClick={() => setActiveSection('wallpaper')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeSection === 'wallpaper' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/10'
                }`}
            >
                <ImageIcon size={18} className={activeSection === 'wallpaper' ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                <span className="flex-1 text-left">Wallpaper</span>
            </button>
            
            <button 
                onClick={() => setActiveSection('taskbar')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    activeSection === 'taskbar' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/10'
                }`}
            >
                <Monitor size={18} className={activeSection === 'taskbar' ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                <span className="flex-1 text-left">{theme === 'aqua' ? 'Dock' : 'Taskbar'}</span>
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
                        <label className="relative group cursor-pointer">
                             <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white dark:border-[#1e1e1e]">
                                {userAvatar || user?.avatar ? (
                                    <img src={userAvatar || user?.avatar} className="w-full h-full object-cover" alt="User" />
                                ) : (
                                    <img src='images/profile.png' className="w-full h-full object-cover" alt="User" />
                                )}
                             </div>
                             <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Camera className="text-white" size={24} />
                             </div>
                             <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{name || 'Guest User'}</h2>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{name ? `${name.toLowerCase().replace(/\s+/g, '.')}@mateos.com` : 'guest@mateos.com'}</p>
                            <label className="mt-2 inline-block text-sm text-blue-600 font-bold hover:underline cursor-pointer">
                                Change Profile Photo
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Account Settings</h3>
                        <div className="bg-[#f5f5f7] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5">
                            <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                                <User className="text-blue-600 dark:text-blue-400" size={20} />
                                <div className="flex-1 text-left">
                                    <span className="block font-bold text-sm text-gray-900 dark:text-white">Personal Information</span>
                                    <span className="text-xs text-gray-500">Edit photo, name, and details</span>
                                </div>
                            </button>
                            <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                                <Shield className="text-blue-600 dark:text-blue-400" size={20} />
                                <div className="flex-1 text-left">
                                    <span className="block font-bold text-sm text-gray-900 dark:text-white">Sign-In & Security</span>
                                    <span className="text-xs text-gray-500">Password and authentication</span>
                                </div>
                            </button>
                             <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                                <CreditCard className="text-blue-600 dark:text-blue-400" size={20} />
                                <div className="flex-1 text-left">
                                    <span className="block font-bold text-sm text-gray-900 dark:text-white">Subscriptions</span>
                                    <span className="text-xs text-gray-500">Manage your active plans</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* APPEARANCE SECTION */}
            {activeSection === 'appearance' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appearance</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Switch between light and dark modes.</p>
                     </div>

                     <div className="grid grid-cols-3 gap-4">
                         {/* Light Mode */}
                         <button 
                            onClick={() => setColorMode('light')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all shadow-sm ${
                                colorMode === 'light' 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 scale-105 z-10' 
                                : 'border-transparent bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                         >
                            <div className="w-full aspect-video bg-white rounded-lg border border-gray-300 flex flex-col p-2 gap-1.5 overflow-hidden">
                                <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                                <div className="h-2 w-full bg-gray-100 rounded"></div>
                                <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sun size={14} className={colorMode === 'light' ? 'text-blue-600' : 'text-gray-500'} />
                                <span className={`text-sm font-bold ${colorMode === 'light' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>Light</span>
                            </div>
                         </button>

                         {/* Dark Mode */}
                         <button 
                            onClick={() => setColorMode('dark')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all shadow-sm ${
                                colorMode === 'dark' 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 scale-105 z-10' 
                                : 'border-transparent bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                         >
                            <div className="w-full aspect-video bg-[#1e1e1e] rounded-lg border border-gray-800 flex flex-col p-2 gap-1.5 overflow-hidden">
                                <div className="h-2 w-1/2 bg-gray-800 rounded"></div>
                                <div className="h-2 w-full bg-gray-900 rounded"></div>
                                <div className="h-2 w-3/4 bg-gray-900 rounded"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Moon size={14} className={colorMode === 'dark' ? 'text-blue-600' : 'text-gray-500'} />
                                <span className={`text-sm font-bold ${colorMode === 'dark' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>Dark</span>
                            </div>
                         </button>

                         {/* Auto Mode */}
                         <button 
                            onClick={() => setColorMode('auto')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all shadow-sm ${
                                colorMode === 'auto' 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 scale-105 z-10' 
                                : 'border-transparent bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                         >
                            <div className="w-full aspect-video rounded-lg border border-gray-400 flex overflow-hidden">
                                <div className="flex-1 bg-white p-2 flex flex-col gap-1.5">
                                    <div className="h-2 w-full bg-gray-200 rounded"></div>
                                    <div className="h-2 w-full bg-gray-100 rounded"></div>
                                </div>
                                <div className="flex-1 bg-[#1e1e1e] p-2 flex flex-col gap-1.5">
                                    <div className="h-2 w-full bg-gray-800 rounded"></div>
                                    <div className="h-2 w-full bg-gray-900 rounded"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Laptop size={14} className={colorMode === 'auto' ? 'text-blue-600' : 'text-gray-500'} />
                                <span className={`text-sm font-bold ${colorMode === 'auto' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>Auto</span>
                            </div>
                         </button>
                     </div>
                </div>
            )}

            {/* THEME SECTION */}
            {activeSection === 'theme' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Desktop Style</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Choose the interface style for your desktop environment.</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-6">
                         <button 
                            onClick={() => setTheme('aero')}
                            className={`group relative flex flex-col gap-3 text-left p-4 rounded-xl border-2 transition-all duration-200 shadow-sm ${
                                theme === 'aero' 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 scale-102' 
                                : 'border-transparent bg-[#f5f5f7] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            <div className="w-full aspect-[16/10] bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                                <div className="absolute top-2 left-2 w-16 h-12 bg-white/20 rounded-md backdrop-blur-md border border-white/30"></div>
                                <div className="absolute bottom-0 w-full h-6 bg-white/30 backdrop-blur-md border-t border-white/20"></div>
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <span className={`font-bold ${theme === 'aero' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>Aero (Win11)</span>
                                {theme === 'aero' && <Check size={18} className="text-blue-600" />}
                            </div>
                        </button>

                        <button 
                            onClick={() => setTheme('aqua')}
                            className={`group relative flex flex-col gap-3 text-left p-4 rounded-xl border-2 transition-all duration-200 shadow-sm ${
                                theme === 'aqua' 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 scale-102' 
                                : 'border-transparent bg-[#f5f5f7] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            <div className="w-full aspect-[16/10] bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                                <div className="absolute top-2 left-2 w-16 h-12 bg-white/20 rounded-md backdrop-blur-md border border-white/30"></div>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white/30 backdrop-blur-sm rounded-full"></div>
                            </div>
                             <div className="flex items-center justify-between w-full">
                                <span className={`font-bold ${theme === 'aqua' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>Aqua (macOS)</span>
                                {theme === 'aqua' && <Check size={18} className="text-blue-600" />}
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* WALLPAPER SECTION */}
            {activeSection === 'wallpaper' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Wallpaper</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Personalize your desktop background.</p>
                    </div>

                    {/* Current Wallpaper Preview */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Preview</h3>
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-300 dark:border-white/10">
                            <img src={wallpaper} alt="Current Wallpaper" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                <label className="bg-white/90 backdrop-blur-md text-gray-900 px-6 py-2.5 rounded-full text-sm font-bold cursor-pointer hover:bg-white transition-all shadow-xl">
                                    Update Wallpaper
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Library</h3>
                            <label className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                                <Upload size={14} />
                                Upload Custom
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {WALLPAPERS.map(wp => (
                                <button 
                                    key={wp.id}
                                    onClick={() => setWallpaper(wp.src)}
                                    className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all shadow-sm ${
                                        wallpaper === wp.src 
                                        ? 'border-blue-600 ring-4 ring-blue-500/20 z-10 scale-102' 
                                        : 'border-transparent hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <img src={wp.src} alt={wp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                        <span className="text-xs text-white font-bold">{wp.title}</span>
                                    </div>
                                    {wallpaper === wp.src && (
                                        <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TASKBAR SECTION */}
            {activeSection === 'taskbar' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{theme === 'aqua' ? 'Dock' : 'Taskbar'}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Configure the system bar at the bottom of your screen.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#f5f5f7] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5">
                            <div className="p-5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setHideTaskbar(!hideTaskbar)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                        <Monitor size={22} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-sm text-gray-900 dark:text-white">Automatically hide the {theme === 'aqua' ? 'Dock' : 'Taskbar'}</span>
                                        <span className="text-xs text-gray-500 font-medium leading-relaxed">Reveals itself only when you hover at the bottom edge.</span>
                                    </div>
                                </div>
                                <button 
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                        hideTaskbar ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            hideTaskbar ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="p-5 flex items-center justify-between opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center text-gray-500">
                                        <ImageIcon size={22} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-sm text-gray-900 dark:text-white">App Indicator Dots</span>
                                        <span className="text-xs text-gray-500 font-medium leading-relaxed">Show indicators for open applications.</span>
                                    </div>
                                </div>
                                <button disabled className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600/50">
                                    <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white/80" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
