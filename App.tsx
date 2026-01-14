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
import { BootScreen } from './components/os/BootScreen';
import { LoginScreen } from './components/os/LoginScreen';
import { AppId, WindowState, Theme, AuthMode } from './types';

// Constants
const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_SHORT_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

// Placeholder apps
const Placeholder = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-[#202020] text-gray-500 dark:text-gray-400">
    {text}
  </div>
);

const App: React.FC = () => {
  // --- Auth State ---
  const [authMode, setAuthMode] = useState<AuthMode>('boot'); // Start with logic check
  const [username, setUsername] = useState<string>('');
  
  // --- OS State ---
  const [theme, setTheme] = useState<Theme>('aqua'); // Default to Aqua for Ventura feel
  const [hideTaskbar, setHideTaskbar] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<AppId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  
  // --- Auth Logic (Screen Routing) ---
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    const localUser = localStorage.getItem('mateos_user');
    const lastLoginStr = localStorage.getItem('mateos_last_login');
    const now = Date.now();

    // 1. No Local Data -> Boot Sequence -> Full Login
    if (!localUser) {
        setAuthMode('boot');
        return;
    }

    // 2. No Session Token or Expired (> 7 days) -> Full Login
    if (!lastLoginStr) {
        setAuthMode('login_full');
        setUsername(JSON.parse(localUser).username);
        return;
    }

    const lastLogin = parseInt(lastLoginStr, 10);
    const diff = now - lastLogin;

    if (diff > SESSION_MAX_MS) {
        // Session Expired
        setAuthMode('login_full');
        setUsername(JSON.parse(localUser).username);
    } else if (diff > SESSION_SHORT_MS && diff <= SESSION_MAX_MS) {
        // Session Medium (2-7 days) -> Partial Login
        setAuthMode('login_partial');
        setUsername(JSON.parse(localUser).username);
    } else {
        // Session Recent (< 2 days) -> Auto Login
        setAuthMode('desktop');
        setUsername(JSON.parse(localUser).username);
    }
  };

  const handleBootComplete = () => {
     setAuthMode('login_full');
  };

  const handleLoginSuccess = (user: string) => {
    const now = Date.now();
    localStorage.setItem('mateos_user', JSON.stringify({ username: user }));
    localStorage.setItem('mateos_last_login', now.toString());
    setUsername(user);
    setAuthMode('desktop');
  };

  const handleSwitchAccount = () => {
    // Clear last login to force full login, but keep user data for autofill if we wanted (here we just clear state)
    setAuthMode('login_full');
    setUsername('');
  };

  const handleForgotPassword = () => {
      alert("Recovery link sent to your email.");
  };

  // --- OS Logic ---

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
      title: theme === 'aqua' ? 'Safari' : 'Edge Browser',
      icon: theme === 'aqua' ? <Compass className="text-blue-500" size={20} /> : <Globe className="text-green-500" size={20} />,
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
      focusWindow(id);
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
        y: (theme === 'aqua' ? 80 : 50) + (windows.length * 30) 
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

  const appIcons = Object.fromEntries(
    Object.entries(appRegistry).map(([id, app]) => [id, app.icon])
  ) as Record<AppId, React.ReactNode>;

  const getBackground = () => {
      // Use the Ventura abstract orange/blue background
      if (theme === 'aqua') {
          return 'url("https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=3870&auto=format&fit=crop")'; 
      }
      return 'url("https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=3870&auto=format&fit=crop")';
  };

  const activeWindow = windows.find(w => w.id === activeWindowId);
  const activeAppTitle = activeWindow ? activeWindow.title : 'Finder';

  return (
    <div 
        className="relative w-screen h-screen overflow-hidden bg-cover bg-center select-none transition-all duration-700"
        style={{ backgroundImage: getBackground() }}
        onClick={handleDesktopClick}
        onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* -------------------------------------------
          Screen Routing Layer
         ------------------------------------------- */}
      
      {authMode === 'boot' && (
        <BootScreen onComplete={handleBootComplete} />
      )}

      {(authMode === 'login_full' || authMode === 'login_partial') && (
        <LoginScreen 
            mode={authMode === 'login_full' ? 'full' : 'partial'}
            savedUsername={username}
            onLogin={handleLoginSuccess}
            onSwitchAccount={handleSwitchAccount}
            onForgotPassword={handleForgotPassword}
        />
      )}

      {/* -------------------------------------------
          Desktop Environment Layer
         ------------------------------------------- */}
      {authMode === 'desktop' && (
        <>
            {/* Aqua Top Bar */}
            {theme === 'aqua' && <TopBar activeAppTitle={activeAppTitle} />}

            {/* Desktop Icons */}
            <div className={`absolute left-4 flex flex-col gap-6 z-0 ${theme === 'aqua' ? 'top-12 right-4 items-end left-auto' : 'top-4 items-center'}`}>
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
                    {theme === 'aqua' ? (
                        <Compass className="w-10 h-10 text-blue-400 desktop-icon-shadow" />
                    ) : (
                        <Globe className="w-10 h-10 text-blue-400 desktop-icon-shadow" />
                    )}
                    <span className="text-xs text-center desktop-text-shadow font-medium">{theme === 'aqua' ? 'Safari' : 'Edge'}</span>
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
                hideTaskbar={hideTaskbar}
                >
                {window.id === AppId.SETTINGS ? (
                    <SettingsApp 
                        theme={theme} 
                        setTheme={setTheme} 
                        hideTaskbar={hideTaskbar} 
                        setHideTaskbar={setHideTaskbar} 
                    />
                ) : (
                    window.component
                )}
                </WindowFrame>
            ))}

            {/* Start Menu or Launchpad */}
            {theme === 'aero' ? (
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
                hideTaskbar={hideTaskbar}
            />
        </>
      )}
    </div>
  );
};

export default App;