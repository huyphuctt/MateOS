import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Globe, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Sparkles, 
  Calculator,
  Trash2,
  FolderClosed,
  Compass
} from 'lucide-react';

import { Taskbar } from './components/os/Taskbar';
import { StartMenu } from './components/os/StartMenu';
import { WindowFrame } from './components/os/WindowFrame';
import { CopilotApp } from './components/apps/Copilot';
import { NotepadApp } from './components/apps/Notepad';
import { BrowserApp } from './components/apps/Browser';
import { SettingsApp } from './components/apps/Settings';
import { TopBar } from './components/os/TopBar';
import { Launchpad } from './components/os/Launchpad';
import { AppId, WindowState, Theme } from './types';

// Placeholder apps
const Placeholder = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-[#202020] text-gray-500 dark:text-gray-400">
    {text}
  </div>
);

const App: React.FC = () => {
  // --- State ---
  const [theme, setTheme] = useState<Theme>('windows');
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<AppId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  
  type AppRegistryItem = {
    title: string;
    icon: React.ReactNode;
    component: React.ReactNode;
    defaultSize?: { width: number; height: number };
    preferredPosition?: { x: number; y: number };
  };

  // App Definitions (Registry)
  const appRegistry: Record<AppId, AppRegistryItem> = {
    [AppId.COPILOT]: {
      title: 'Copilot',
      icon: <Sparkles className="text-blue-500 fill-blue-500" size={20} />,
      component: <CopilotApp />,
      defaultSize: { width: 400, height: 600 },
      preferredPosition: { x: window.innerWidth - 450, y: 50 }
    },
    [AppId.NOTEPAD]: {
      title: 'Notepad',
      icon: <FileText className="text-blue-400" size={20} />,
      component: <NotepadApp />,
      defaultSize: { width: 600, height: 400 }
    },
    [AppId.BROWSER]: {
      title: theme === 'macos' ? 'Safari' : 'Edge Browser',
      icon: theme === 'macos' ? <Compass className="text-blue-500" size={20} /> : <Globe className="text-green-500" size={20} />,
      component: <BrowserApp />,
      defaultSize: { width: 800, height: 600 }
    },
    [AppId.PHOTOS]: {
      title: 'Photos',
      icon: <ImageIcon className="text-purple-500" size={20} />,
      component: <div className="p-4 bg-black h-full overflow-y-auto grid grid-cols-3 gap-2">
         {[...Array(12)].map((_, i) => (
             <img key={i} src={`https://picsum.photos/300/200?random=${i}`} className="w-full h-auto rounded-sm hover:opacity-80 transition-opacity cursor-pointer" alt="Gallery" />
         ))}
      </div>,
      defaultSize: { width: 700, height: 500 }
    },
    [AppId.SETTINGS]: {
        title: 'Settings',
        icon: <Settings className="text-gray-500" size={20} />,
        component: null, // Rendered dynamically
        defaultSize: { width: 600, height: 450 }
    },
    [AppId.CALCULATOR]: {
        title: 'Calculator',
        icon: <Calculator className="text-orange-500" size={20} />,
        component: <Placeholder text="Calculator" />,
        defaultSize: { width: 300, height: 400 }
    }
  };

  // --- Actions ---

  const openApp = (id: AppId) => {
    setStartMenuOpen(false);

    if (windows.find(w => w.id === id)) {
      // Bring to front if already open
      focusWindow(id);
      // If minimized, restore
      setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false } : w));
      return;
    }

    const app = appRegistry[id];
    const newWindow: WindowState = {
      id,
      title: app.title,
      icon: app.icon,
      component: app.component,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      size: app.defaultSize || { width: 600, height: 400 },
      position: app.preferredPosition || { 
        x: 50 + (windows.length * 30), 
        y: (theme === 'macos' ? 80 : 50) + (windows.length * 30) 
      }
    };

    setWindows([...windows, newWindow]);
    setActiveWindowId(id);
    setNextZIndex(prev => prev + 1);
  };

  const closeWindow = (id: AppId) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const minimizeWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
  };

  const maximizeWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
    focusWindow(id);
  };

  const focusWindow = (id: AppId) => {
    setActiveWindowId(id);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZIndex } : w));
    setNextZIndex(prev => prev + 1);
  };

  const moveWindow = (id: AppId, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));
  };

  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const handleDesktopClick = () => {
     // Optional: clicking desktop interactions
  };

  // Icons for taskbar/start menu
  const appIcons = Object.fromEntries(
    Object.entries(appRegistry).map(([id, app]) => [id, app.icon])
  ) as Record<AppId, React.ReactNode>;

  const getBackground = () => {
      if (theme === 'macos') {
          return 'url("https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=3870&auto=format&fit=crop")'; // Monterey style abstract
      }
      return 'url("https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=3870&auto=format&fit=crop")'; // Win 11 abstract
  };

  // Determine active app title for MacOS TopBar
  const activeWindow = windows.find(w => w.id === activeWindowId);
  const activeAppTitle = activeWindow ? activeWindow.title : 'Finder';

  return (
    <div 
        className="relative w-screen h-screen overflow-hidden bg-cover bg-center select-none transition-all duration-700"
        style={{ backgroundImage: getBackground() }}
        onClick={handleDesktopClick}
    >
      {/* MacOS Top Bar */}
      {theme === 'macos' && <TopBar activeAppTitle={activeAppTitle} />}

      {/* Desktop Icons */}
      <div className={`absolute left-4 flex flex-col gap-6 z-0 ${theme === 'macos' ? 'top-12 right-4 items-end left-auto' : 'top-4 items-center'}`}>
        <button 
            onDoubleClick={() => openApp(AppId.NOTEPAD)}
            className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
        >
            <FolderClosed className="w-10 h-10 text-yellow-400 fill-yellow-400 desktop-icon-shadow" />
            <span className="text-xs text-center line-clamp-2 desktop-text-shadow font-medium">Documents</span>
        </button>

        <button 
            className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
        >
            <Trash2 className="w-10 h-10 text-gray-300 desktop-icon-shadow" />
            <span className="text-xs text-center desktop-text-shadow font-medium">Recycle Bin</span>
        </button>

        <button 
            onDoubleClick={() => openApp(AppId.BROWSER)}
            className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
        >
            {theme === 'macos' ? (
                 <Compass className="w-10 h-10 text-blue-400 desktop-icon-shadow" />
            ) : (
                 <Globe className="w-10 h-10 text-blue-400 desktop-icon-shadow" />
            )}
            <span className="text-xs text-center desktop-text-shadow font-medium">{theme === 'macos' ? 'Safari' : 'Edge'}</span>
        </button>
      </div>

      {/* Windows Layer */}
      {windows.map(window => (
        <WindowFrame
          key={window.id}
          window={window}
          isActive={activeWindowId === window.id}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onFocus={focusWindow}
          onMove={moveWindow}
          theme={theme}
        >
          {window.id === AppId.SETTINGS ? (
              <SettingsApp theme={theme} setTheme={setTheme} />
          ) : (
              window.component
          )}
        </WindowFrame>
      ))}

      {/* Start Menu or Launchpad */}
      {theme === 'windows' ? (
          <StartMenu 
            isOpen={startMenuOpen} 
            onAppClick={openApp} 
            appIcons={appIcons}
            onClose={() => setStartMenuOpen(false)}
          />
      ) : (
          <Launchpad
            isOpen={startMenuOpen} 
            onAppClick={openApp} 
            appIcons={appIcons}
            onClose={() => setStartMenuOpen(false)}
          />
      )}

      {/* Taskbar / Dock */}
      <Taskbar 
        openApps={windows.map(w => w.id)} 
        activeApp={activeWindowId} 
        onAppClick={(id) => {
            const win = windows.find(w => w.id === id);
            if (win?.isMinimized) {
                focusWindow(id);
                setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false } : w));
            } else if (activeWindowId === id) {
                minimizeWindow(id);
            } else {
                focusWindow(id);
            }
        }}
        onStartClick={toggleStartMenu}
        startMenuOpen={startMenuOpen}
        appIcons={appIcons}
        theme={theme}
      />
    </div>
  );
};

export default App;