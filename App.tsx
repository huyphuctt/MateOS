import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Compass,
  ShieldCheck,
  Bell
} from 'lucide-react';

import { Taskbar } from './components/os/Taskbar';
import { StartMenu } from './components/os/StartMenu';
import { WindowFrame } from './components/os/WindowFrame';
import { CopilotApp } from './components/apps/Copilot';
import { NotepadApp } from './components/apps/Notepad';
import { BrowserApp } from './components/apps/Browser';
import { SettingsApp } from './components/apps/Settings';
import { AdminPanel } from './components/apps/AdminPanel';
import { NotificationsApp } from './components/apps/NotificationsApp'; // New App
import { ContextSelector } from './components/os/ContextSelector';
import { TopBar } from './components/os/TopBar';
import { Launchpad } from './components/os/Launchpad';
import { NotificationCenter } from './components/os/NotificationCenter'; // New Component
import { BootScreen } from './components/os/BootScreen';
import { LoginScreen } from './components/os/LoginScreen';
import { AppId, WindowState, Theme, AuthMode, User, Organization, Workspace } from './types';
import { authService } from './services/api';
import { RECENT_ITEMS, WALLPAPERS, MOCK_USERS } from './data/mock';

// Constants
const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_SHORT_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Placeholder apps
const Placeholder = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-[#202020] text-gray-500 dark:text-gray-400">
    {text}
  </div>
);

const App: React.FC = () => {
  // --- Auth State ---
  // Initialize state based on localStorage to prevent UI flash and handle lock screen correctly
  const [username, setUsername] = useState<string>(() => {
    const localUser = localStorage.getItem('mateos_user');
    if (localUser) {
        try {
            return JSON.parse(localUser).username;
        } catch (e) {
            return '';
        }
    }
    return '';
  });

  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    const bootCompleted = localStorage.getItem('mateos_boot_completed');
    if (!bootCompleted) return 'boot';

    const isLocked = localStorage.getItem('mateos_is_locked') === 'true';
    const localUser = localStorage.getItem('mateos_user');
    
    // If specifically locked and we have user data, go straight to partial login
    if (isLocked && localUser) {
        return 'login_partial';
    }

    // Default to full login, session check will upgrade to desktop if valid
    return 'login_full';
  });
  
  // --- User & Org Context State ---
  // Resolve full user object (in real app, this comes from API). For now, we mock lookup.
  const currentUser = useMemo(() => {
    return MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase()) as unknown as User | undefined;
  }, [username]);

  // Load saved context or default to first available
  const [activeOrgId, setActiveOrgId] = useState<number | null>(() => {
    const saved = localStorage.getItem('mateos_active_context');
    if (saved) return JSON.parse(saved).orgId;
    return null;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(() => {
     const saved = localStorage.getItem('mateos_active_context');
     if (saved) return JSON.parse(saved).wkId;
     return null;
  });

  // Derived active objects
  const currentOrg = useMemo(() => {
    if (!currentUser) return undefined;
    if (activeOrgId) return currentUser.organizations.find(o => o.id === activeOrgId);
    return currentUser.organizations[0]; // Default to first
  }, [currentUser, activeOrgId]);

  const currentWorkspace = useMemo(() => {
    if (!currentOrg) return undefined;
    if (activeWorkspaceId) return currentOrg.workspaces.find(w => w.id === activeWorkspaceId);
    return currentOrg.workspaces[0]; // Default to first
  }, [currentOrg, activeWorkspaceId]);

  // Persist Context Changes
  useEffect(() => {
    if (currentOrg) {
        localStorage.setItem('mateos_active_context', JSON.stringify({
            orgId: currentOrg.id,
            wkId: currentWorkspace?.id
        }));
    }
  }, [currentOrg, currentWorkspace]);

  // --- OS State ---
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('mateos_theme');
    return (saved === 'aero' || saved === 'aqua') ? saved : 'aqua';
  });
  
  const [wallpaper, setWallpaper] = useState<string>(() => {
    const saved = localStorage.getItem('mateos_wallpaper');
    return saved || WALLPAPERS[0].src;
  });

  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    return localStorage.getItem('mateos_avatar');
  });

  const [hideTaskbar, setHideTaskbar] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<AppId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  
  // Notification Center State
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // --- Effects ---

  // Persist theme
  useEffect(() => {
    localStorage.setItem('mateos_theme', theme);
  }, [theme]);

  // Persist wallpaper
  useEffect(() => {
    localStorage.setItem('mateos_wallpaper', wallpaper);
  }, [wallpaper]);

  // Persist avatar
  useEffect(() => {
    if (userAvatar) {
        localStorage.setItem('mateos_avatar', userAvatar);
    } else {
        localStorage.removeItem('mateos_avatar');
    }
  }, [userAvatar]);

  // --- Auth Logic (Session Management) ---

  const checkSession = useCallback(async (isBackgroundCheck = false) => {
    const localUser = localStorage.getItem('mateos_user');
    const lastLoginStr = localStorage.getItem('mateos_last_login');
    const bootCompleted = localStorage.getItem('mateos_boot_completed');
    const token = localStorage.getItem('mateos_token');
    const isLocked = localStorage.getItem('mateos_is_locked') === 'true';
    const now = Date.now();

    // 1. Boot Sequence Check (Skip if already booted once on this device)
    if (!bootCompleted && !isBackgroundCheck) {
        setAuthMode('boot');
        return;
    }

    // 2. Local Data Check
    if (!localUser || !lastLoginStr) {
        setAuthMode('login_full');
        if (localUser) setUsername(JSON.parse(localUser).username);
        return;
    }

    const usernameStr = JSON.parse(localUser).username;

    // 3. Time Expiry Check
    const lastLogin = parseInt(lastLoginStr, 10);
    const diff = now - lastLogin;

    if (diff > SESSION_MAX_MS) {
        setAuthMode('login_full');
        setUsername(usernameStr);
        return;
    } 
    
    if (diff > SESSION_SHORT_MS) {
        setAuthMode('login_partial');
        setUsername(usernameStr);
        return;
    }

    // 4. API Token Validation Check
    // If token exists, verify with server. If invalid, lock screen.
    if (token) {
        try {
            const isValid = await authService.checkSession(token);
            if (!isValid) {
                setAuthMode('login_partial');
                setUsername(usernameStr);
                return;
            }
        } catch (error) {
            // On error, default to partial login to be safe.
            setAuthMode('login_partial');
            setUsername(usernameStr);
            return;
        }
    } else {
        // Missing token but have session data? Force re-auth (partial).
        setAuthMode('login_partial');
        setUsername(usernameStr);
        return;
    }

    // 5. Manual Lock Check
    // If the user manually locked the screen, ensure it stays locked even if token is valid.
    if (isLocked) {
        setAuthMode('login_partial');
        setUsername(usernameStr);
        return;
    }

    // 6. Valid Session
    if (!isBackgroundCheck) {
        setAuthMode('desktop');
        setUsername(usernameStr);
    }
  }, []);

  useEffect(() => {
    // 1. Initial Session Check (Mount)
    checkSession(false);

    // 2. Periodic Check (Every 10 minutes)
    const intervalId = setInterval(() => {
        checkSession(true);
    }, CHECK_INTERVAL_MS);

    // 3. Re-access Check (Visibility Change)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            checkSession(true);
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession]);

  const handleBootComplete = () => {
     localStorage.setItem('mateos_boot_completed', 'true');
     setAuthMode('login_full');
  };

  const handleLoginSuccess = (user: { username: string, avatar?: string, wallpaper?: string, token?: string }) => {
    const now = Date.now();
    localStorage.setItem('mateos_user', JSON.stringify({ username: user.username }));
    localStorage.setItem('mateos_last_login', now.toString());
    localStorage.removeItem('mateos_is_locked'); // Clear lock state
    
    if (user.token) {
        localStorage.setItem('mateos_token', user.token);
    }

    // Update avatar if provided by API (e.g. initial login with a user that has one)
    if (user.avatar) {
        setUserAvatar(user.avatar);
    }

    // Update wallpaper if provided by API
    if (user.wallpaper) {
        setWallpaper(user.wallpaper);
    }

    setUsername(user.username);

    // Check for Org/Workspace complexity for Context Selection
    // We need to fetch the full user object from MOCK (or API) since 'user' arg here is partial from login response
    const fullUser = MOCK_USERS.find(u => u.username.toLowerCase() === user.username.toLowerCase());
    
    if (fullUser) {
        const hasMultipleOrgs = fullUser.organizations.length > 1;
        const hasMultipleWorkspaces = fullUser.organizations.some(o => o.workspaces.length > 1);
        
        if (hasMultipleOrgs || hasMultipleWorkspaces) {
            setAuthMode('context_selection');
            return;
        }
    }

    // Single context, go straight to desktop
    setAuthMode('desktop');
  };

  const handleContextSelected = (orgId: number, wkId: number) => {
    setActiveOrgId(orgId);
    setActiveWorkspaceId(wkId);
    setAuthMode('desktop');
  };

  const handleSwitchAccount = async () => {
    // Call the logout service
    await authService.logout();

    // Clear User Specific Data
    localStorage.removeItem('mateos_user');
    localStorage.removeItem('mateos_last_login');
    localStorage.removeItem('mateos_token');
    localStorage.removeItem('mateos_is_locked');
    localStorage.removeItem('mateos_active_context');
    // Note: We do NOT clear mateos_boot_completed

    // Reset OS visual state to defaults (clearing user preferences)
    setWallpaper(WALLPAPERS[0].src);
    setTheme('aqua');
    setUserAvatar(null);
    setUsername('');
    setActiveOrgId(null);
    setActiveWorkspaceId(null);

    // Clear OS state
    setWindows([]);
    setActiveWindowId(null);
    setStartMenuOpen(false);
    
    setAuthMode('login_full');
  };
  
  const handleLock = useCallback(() => {
      localStorage.setItem('mateos_is_locked', 'true');
      setAuthMode('login_partial');
  }, []);

  // --- Inactivity Auto-Lock ---
  useEffect(() => {
    if (authMode !== 'desktop') return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let lastActivity = Date.now();

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLock, INACTIVITY_TIMEOUT_MS);
    };

    const handleActivity = () => {
        const now = Date.now();
        // Throttle resets to max once per second to avoid performance hit on mousemove
        if (now - lastActivity > 1000) {
            resetTimer();
            lastActivity = now;
        }
    };

    // Initialize
    resetTimer();

    // Listeners
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [authMode, handleLock]);

  const handleForgotPassword = () => {
      alert("Recovery link sent to your email.");
  };

  const handleManageAccount = () => {
      alert("Manage Account interface pending implementation.");
  };

  // --- OS Logic ---

  type AppRegistryItem = {
    title: string;
    icon: React.ReactNode;
    component: React.ReactNode;
    defaultSize?: { width: number; height: number };
    preferredPosition?: { x: number; y: number };
    requiresAdmin?: boolean; // New Flag
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
    [AppId.ADMIN]: {
        title: 'Admin Console',
        icon: <ShieldCheck className="text-red-500" size={20} />,
        component: null, // Dynamic
        defaultSize: { width: 800, height: 600 },
        requiresAdmin: true
    },
    [AppId.NOTIFICATIONS]: {
        title: 'Notifications',
        icon: <Bell className="text-blue-500" size={20} />,
        component: <NotificationsApp />,
        defaultSize: { width: 400, height: 600 }
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

    // Permission Check for Admin
    const app = appRegistry[id];
    if (app.requiresAdmin && currentOrg?.role !== 'admin') {
        alert("Access Denied: You must be an administrator of the current organization.");
        return;
    }

    if (windows.find(w => w.id === id)) {
      focusWindow(id);
      setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false } : w));
      return;
    }

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

  const activeWindow = windows.find(w => w.id === activeWindowId);
  const activeAppTitle = activeWindow ? activeWindow.title : 'MateOS';

  // --- Context Switching Logic ---
  const handleSwitchOrg = (orgId: number) => {
      setActiveOrgId(orgId);
      // Reset workspace to first one of new org
      const newOrg = currentUser?.organizations.find(o => o.id === orgId);
      if (newOrg && newOrg.workspaces.length > 0) {
          setActiveWorkspaceId(newOrg.workspaces[0].id);
      } else {
          setActiveWorkspaceId(null);
      }
      // Close Admin window if open when switching, for safety/UX
      closeWindow(AppId.ADMIN);
  };

  const handleSwitchWorkspace = (wkId: number) => {
      setActiveWorkspaceId(wkId);
  };

  return (
    <div 
        className="relative w-screen h-screen overflow-hidden bg-cover bg-center select-none transition-all duration-700"
        style={{ backgroundImage: `url("${wallpaper}")` }}
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
            userAvatar={userAvatar}
        />
      )}

      {authMode === 'context_selection' && currentUser && (
        <ContextSelector 
            user={currentUser}
            onComplete={handleContextSelected}
            savedOrgId={activeOrgId}
            savedWorkspaceId={activeWorkspaceId}
        />
      )}

      {/* -------------------------------------------
          Desktop Environment Layer
         ------------------------------------------- */}
      {authMode === 'desktop' && (
        <>
            {/* Aqua Top Bar */}
            {theme === 'aqua' && (
                <TopBar 
                    activeAppTitle={activeAppTitle} 
                    onOpenSettings={() => openApp(AppId.SETTINGS)}
                    onLogout={handleSwitchAccount}
                    recentItems={RECENT_ITEMS}
                    username={username}
                    onOpenUserProfile={() => openApp(AppId.SETTINGS)}
                    userAvatar={userAvatar}
                    onLock={handleLock}
                    // Org Context
                    organizations={currentUser?.organizations || []}
                    currentOrg={currentOrg}
                    currentWorkspace={currentWorkspace}
                    onSwitchOrg={handleSwitchOrg}
                    onSwitchWorkspace={handleSwitchWorkspace}
                    // Notification
                    notificationPanelOpen={notificationPanelOpen}
                    onToggleNotificationPanel={() => setNotificationPanelOpen(!notificationPanelOpen)}
                />
            )}

            {/* Desktop Icons */}
            <div className={`absolute left-4 flex flex-col gap-6 z-0 ${theme === 'aqua' ? 'top-12 right-4 items-end left-auto' : 'top-4 items-center'}`}>
                <button 
                    onDoubleClick={() => openApp(AppId.NOTEPAD)}
                    className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
                >
                    <FolderClosed className="w-10 h-10 text-yellow-400 fill-yellow-400 desktop-icon-shadow" />
                    <span className="text-xs text-center line-clamp-2 desktop-text-shadow font-medium">Documents</span>
                </button>

                {/* Show Admin Tool Icon on Desktop if Admin */}
                {currentOrg?.role === 'admin' && (
                    <button 
                        onDoubleClick={() => openApp(AppId.ADMIN)}
                        className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
                    >
                        <ShieldCheck className="w-10 h-10 text-red-500 fill-red-900/50 desktop-icon-shadow" />
                        <span className="text-xs text-center desktop-text-shadow font-medium">Admin Console</span>
                    </button>
                )}

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
                        username={username}
                        onManageAccount={handleManageAccount}
                        wallpaper={wallpaper}
                        setWallpaper={setWallpaper}
                        userAvatar={userAvatar}
                        setUserAvatar={setUserAvatar}
                    />
                ) : window.id === AppId.ADMIN && currentOrg ? (
                    <AdminPanel 
                        currentOrg={currentOrg}
                        currentWorkspace={currentWorkspace}
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
                    onLogout={handleSwitchAccount}
                    recentItems={RECENT_ITEMS}
                    username={username}
                    onOpenUserProfile={() => openApp(AppId.SETTINGS)}
                    userAvatar={userAvatar}
                    onLock={handleLock}
                    isAdmin={currentOrg?.role === 'admin'}
                />
            ) : (
                <Launchpad
                    isOpen={startMenuOpen} 
                    onAppClick={openApp} 
                    appIcons={appIcons}
                    onClose={() => setStartMenuOpen(false)}
                    isAdmin={currentOrg?.role === 'admin'}
                />
            )}
            
            {/* Notification Center Slide Panel */}
            <NotificationCenter 
                isOpen={notificationPanelOpen}
                onClose={() => setNotificationPanelOpen(false)}
                recentItems={RECENT_ITEMS}
                onOpenNotificationsApp={() => openApp(AppId.NOTIFICATIONS)}
                theme={theme}
            />

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
                organizations={currentUser?.organizations || []}
                currentOrg={currentOrg}
                currentWorkspace={currentWorkspace}
                onSwitchOrg={handleSwitchOrg}
                onSwitchWorkspace={handleSwitchWorkspace}
                // Notification
                notificationPanelOpen={notificationPanelOpen}
                onToggleNotificationPanel={() => setNotificationPanelOpen(!notificationPanelOpen)}
                recentItems={RECENT_ITEMS}
            />
        </>
      )}
    </div>
  );
};

export default App;