import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ShieldUser,
  Bell,
  Vault,
  File,
  Eye
} from 'lucide-react';

import { Taskbar } from './components/os/Taskbar';
import { StartMenu } from './components/os/StartMenu';
import { WindowFrame } from './components/os/WindowFrame';
import { CopilotApp } from './components/apps/Copilot';
import { NotepadApp } from './components/apps/Notepad';
import { BrowserApp } from './components/apps/Browser';
import { SettingsApp } from './components/apps/Settings';
import { AdminPanel } from './components/apps/AdminPanel';
import { NotificationsApp } from './components/apps/NotificationsApp';
import { VaultApp } from './components/apps/VaultApp'; 
import { PreviewApp } from './components/apps/DocViewerApp'; 
import { ContextSelector } from './components/os/ContextSelector';
import { TopBar } from './components/os/TopBar';
import { Launchpad } from './components/os/Launchpad';
import { NotificationCenter } from './components/os/NotificationCenter';
import { BootScreen } from './components/os/BootScreen';
import { LoginScreen } from './components/os/LoginScreen';
import { AppSwitcher } from './components/os/AppSwitcher';
import { AppId, WindowState, Theme, AuthMode, User, Organization, Workspace, FileItem } from './types';
import { apiService } from './services/api';
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
    
    if (isLocked && localUser) {
        return 'login_partial';
    }

    const lastLoginStr = localStorage.getItem('mateos_last_login');
    
    if (localUser && lastLoginStr) {
         const now = Date.now();
         const lastLogin = parseInt(lastLoginStr, 10);
         if (now - lastLogin < SESSION_MAX_MS) {
             return 'desktop';
         }
    }
    return 'login_full';
  });
  
  // --- User & Org Context State ---
  const currentUser = useMemo(() => {
    return MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase()) as unknown as User | undefined;
  }, [username]);

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

  const currentOrg = useMemo(() => {
    if (!currentUser) return undefined;
    if (activeOrgId) return currentUser.organizations.find(o => o.id === activeOrgId);
    return currentUser.organizations[0]; 
  }, [currentUser, activeOrgId]);

  const currentWorkspace = useMemo(() => {
    if (!currentOrg) return undefined;
    if (activeWorkspaceId) return currentOrg.workspaces.find(w => w.id === activeWorkspaceId);
    return currentOrg.workspaces[0]; 
  }, [currentOrg, activeWorkspaceId]);

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
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- App Switcher State ---
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherSelectedIndex, setSwitcherSelectedIndex] = useState(0);

  // --- Effects & Auth Logic ---
  useEffect(() => {
    localStorage.setItem('mateos_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mateos_wallpaper', wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    if (userAvatar) {
        localStorage.setItem('mateos_avatar', userAvatar);
    } else {
        localStorage.removeItem('mateos_avatar');
    }
  }, [userAvatar]);

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  // Sorted windows for switcher (MRU - Most Recently Used based on zIndex)
  const sortedWindows = useMemo(() => {
    return [...windows].sort((a, b) => b.zIndex - a.zIndex);
  }, [windows]);

  // Keyboard Shortcuts (App Switcher & Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Navigation within Switcher (Arrow Keys & Enter)
        if (isSwitcherOpen) {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                setSwitcherSelectedIndex(prev => (prev + 1) % sortedWindows.length);
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                setSwitcherSelectedIndex(prev => (prev - 1 + sortedWindows.length) % sortedWindows.length);
                return;
            }
            if (e.key === 'Enter') {
                 e.preventDefault();
                 e.stopPropagation();
                 setIsSwitcherOpen(false);
                 if (sortedWindows[switcherSelectedIndex]) {
                     focusWindow(sortedWindows[switcherSelectedIndex].id);
                 }
                 setSwitcherSelectedIndex(0);
                 return;
            }
        }

        // Detect Modifier Keys (Meta/Super or Alt)
        const isModifierHeld = e.metaKey || e.altKey;

        if (isModifierHeld) {
            // Modifier + Tab: Open/Cycle Switcher
            if (e.key === 'Tab') {
                e.preventDefault();
                e.stopPropagation();
                
                if (sortedWindows.length > 0) {
                     if (!isSwitcherOpen) {
                         setIsSwitcherOpen(true);
                         // Select the next window (previous MRU), or 0 if only 1
                         setSwitcherSelectedIndex(sortedWindows.length > 1 ? 1 : 0);
                     } else {
                         // Cycle
                         setSwitcherSelectedIndex(prev => (prev + 1) % sortedWindows.length);
                     }
                }
            }
            
            // Modifier + W: Close Active Window
            if (e.key.toLowerCase() === 'w') {
                e.preventDefault();
                e.stopPropagation();
                if (activeWindowId) {
                    closeWindow(activeWindowId);
                }
            }
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        // If the modifier key is released while switcher is open, confirm selection and close
        const isModifierKey = e.key === 'Meta' || e.key === 'Alt' || e.key === 'Control' || e.key === 'OS';
        
        if (isSwitcherOpen && isModifierKey) {
            e.preventDefault();
            e.stopPropagation();
            setIsSwitcherOpen(false);
            if (sortedWindows[switcherSelectedIndex]) {
                focusWindow(sortedWindows[switcherSelectedIndex].id);
            }
            setSwitcherSelectedIndex(0);
        }
    };

    // Attach to window to catch global shortcuts
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSwitcherOpen, switcherSelectedIndex, sortedWindows, activeWindowId]);


  const checkSession = useCallback(async (isBackgroundCheck = false) => {
    const localUser = localStorage.getItem('mateos_user');
    const lastLoginStr = localStorage.getItem('mateos_last_login');
    const bootCompleted = localStorage.getItem('mateos_boot_completed');
    const token = localStorage.getItem('mateos_token');
    const isLocked = localStorage.getItem('mateos_is_locked') === 'true';
    const now = Date.now();

    if (!bootCompleted && !isBackgroundCheck) {
        setAuthMode('boot');
        return;
    }

    if (!localUser || !lastLoginStr) {
        setAuthMode('login_full');
        if (localUser) setUsername(JSON.parse(localUser).username);
        return;
    }

    const usernameStr = JSON.parse(localUser).username;
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

    if (token) {
        try {
            const isValid = await apiService.checkSession(token);
            if (!isValid) {
                setAuthMode('login_partial');
                setUsername(usernameStr);
                return;
            }
        } catch (error) {
            setAuthMode('login_partial');
            setUsername(usernameStr);
            return;
        }
    } else {
        setAuthMode('login_partial');
        setUsername(usernameStr);
        return;
    }

    if (isLocked) {
        setAuthMode('login_partial');
        setUsername(usernameStr);
        return;
    }

    if (!isBackgroundCheck) {
        setAuthMode('desktop');
        setUsername(usernameStr);
    }
  }, []);

  useEffect(() => {
    checkSession(false);
    const intervalId = setInterval(() => {
        checkSession(true);
    }, CHECK_INTERVAL_MS);
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
    localStorage.removeItem('mateos_is_locked'); 
    
    if (user.token) {
        localStorage.setItem('mateos_token', user.token);
    }
    if (user.avatar) {
        setUserAvatar(user.avatar);
    }
    if (user.wallpaper) {
        setWallpaper(user.wallpaper);
    }
    setUsername(user.username);

    const fullUser = MOCK_USERS.find(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (fullUser) {
        const savedContextStr = localStorage.getItem('mateos_active_context');
        if (savedContextStr) {
             try {
                const { orgId, wkId } = JSON.parse(savedContextStr);
                const org = fullUser.organizations.find(o => o.id === orgId);
                if (org) {
                    const wk = org.workspaces.find(w => w.id === wkId);
                    if (wk || org.workspaces.length === 0) {
                        setActiveOrgId(orgId);
                        setActiveWorkspaceId(wkId);
                        setAuthMode('desktop');
                        return;
                    }
                    if (org.workspaces.length > 0) {
                         setActiveOrgId(orgId);
                         setActiveWorkspaceId(org.workspaces[0].id);
                         setAuthMode('desktop');
                         return;
                    }
                }
             } catch (e) {
                 console.error("Failed to restore context", e);
             }
        }
        const hasMultipleOrgs = fullUser.organizations.length > 1;
        const hasMultipleWorkspaces = fullUser.organizations.some(o => o.workspaces.length > 1);
        if (hasMultipleOrgs || hasMultipleWorkspaces) {
            setAuthMode('context_selection');
            return;
        }
    }
    setAuthMode('desktop');
  };

  const handleContextSelected = (orgId: number, wkId: number) => {
    setActiveOrgId(orgId);
    setActiveWorkspaceId(wkId);
    setAuthMode('desktop');
  };

  const handleSwitchAccount = async () => {
    await apiService.logout();
    localStorage.removeItem('mateos_user');
    localStorage.removeItem('mateos_last_login');
    localStorage.removeItem('mateos_token');
    localStorage.removeItem('mateos_is_locked');
    setWallpaper(WALLPAPERS[0].src);
    setTheme('aqua');
    setUserAvatar(null);
    setUsername('');
    setActiveOrgId(null);
    setActiveWorkspaceId(null);
    setWindows([]);
    setActiveWindowId(null);
    setStartMenuOpen(false);
    setAuthMode('login_full');
  };
  
  const handleLock = useCallback(() => {
      localStorage.setItem('mateos_is_locked', 'true');
      setAuthMode('login_partial');
  }, []);

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
        if (now - lastActivity > 1000) {
            resetTimer();
            lastActivity = now;
        }
    };
    resetTimer();
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

  // --- App Registry ---
  type AppRegistryItem = {
    title: string;
    icon: React.ReactNode;
    component: React.ReactNode;
    defaultSize?: { width: number; height: number };
    preferredPosition?: { x: number; y: number };
    requiresAdmin?: boolean; 
  };

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
      component: null, 
      defaultSize: { width: 600, height: 400 }
    },
    [AppId.BROWSER]: {
      title: theme === 'aqua' ? 'Safari' : 'Edge Browser',
      icon: theme === 'aqua' ? <Compass className="text-blue-500" size={20} /> : <Globe className="text-green-500" size={20} />,
      component: null, 
      defaultSize: { width: 800, height: 600 }
    },
    [AppId.PHOTOS]: {
      title: 'Photos',
      icon: <ImageIcon className="text-purple-500" size={20} />,
      component: null, 
      defaultSize: { width: 700, height: 500 }
    },
    [AppId.SETTINGS]: {
        title: 'Settings',
        icon: <Settings className="text-gray-100" size={20} />,
        component: null, 
        defaultSize: { width: 600, height: 450 }
    },
    [AppId.ADMIN]: {
        title: 'Admin Console',
        icon: <ShieldUser className="text-red-500" size={20} />,
        component: null, 
        defaultSize: { width: 800, height: 600 },
        requiresAdmin: true
    },
    [AppId.NOTIFICATIONS]: {
        title: 'Notifications',
        icon: <Bell className="text-blue-400" size={20} />,
        component: <NotificationsApp />,
        defaultSize: { width: 400, height: 600 }
    },
    [AppId.VAULT]: {
        title: 'Vault',
        icon: <Vault className="text-amber-300" size={20} />,
        component: null, // Dynamically rendered
        defaultSize: { width: 900, height: 600 }
    },
    [AppId.PREVIEW]: {
        title: 'Preview',
        icon: <Eye className="text-gray-500" size={20} />,
        component: null, // Dynamically rendered
        defaultSize: { width: 800, height: 800 }
    },
    [AppId.CALCULATOR]: {
        title: 'Calculator',
        icon: <Calculator className="text-orange-500" size={20} />,
        component: <Placeholder text="Calculator" />,
        defaultSize: { width: 300, height: 400 }
    }
  };

  // --- Window Management ---

  const openApp = (id: AppId, payload?: any) => {
    setStartMenuOpen(false);

    // Permission Check
    const app = appRegistry[id];
    if (app.requiresAdmin && currentOrg?.role !== 'admin') {
        alert("Access Denied: You must be an administrator of the current organization.");
        return;
    }

    setWindows(prevWindows => {
        const existingWindow = prevWindows.find(w => w.id === id);
        
        // If window exists, bring to front and potentially merge data (tabs)
        if (existingWindow) {
             let newData = payload || existingWindow.data;

             // Special logic for Preview Tabs
             if (id === AppId.PREVIEW && payload?.file) {
                 const currentTabs: FileItem[] = existingWindow.data?.tabs || [];
                 const newFile: FileItem = payload.file;
                 
                 // Check if file already open
                 const exists = currentTabs.find(t => t.id === newFile.id);
                 let newTabs = currentTabs;
                 
                 if (!exists && currentTabs.length < 20) {
                     newTabs = [...currentTabs, newFile];
                 }
                 
                 // If it exists, we just switch to it. If new, we added it.
                 newData = {
                     tabs: newTabs,
                     activeTabId: newFile.id
                 };
             }

             return prevWindows.map(w => 
                w.id === id 
                ? { ...w, isMinimized: false, data: newData, zIndex: nextZIndex } 
                : w
             );
        }

        // Else create new
        let initialData = payload;
        
        // Initialize Preview with Tab structure if opening with a file
        if (id === AppId.PREVIEW && payload?.file) {
            initialData = {
                tabs: [payload.file],
                activeTabId: payload.file.id
            };
        }

        const newWindow: WindowState = {
            id,
            title: app.title,
            icon: app.icon,
            component: app.component, 
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            dockSide: null,
            zIndex: nextZIndex,
            size: app.defaultSize || { width: 600, height: 400 },
            position: app.preferredPosition || { 
                x: 50 + (prevWindows.length * 30), 
                y: (theme === 'aqua' ? 80 : 50) + (prevWindows.length * 30) 
            },
            data: initialData
        };
        return [...prevWindows, newWindow];
    });

    setActiveWindowId(id);
    setNextZIndex(prev => prev + 1);
  };

  const updateWindowData = (id: AppId, newData: any) => {
      setWindows(prev => prev.map(w => w.id === id ? { ...w, data: newData } : w));
  };

  const handleOpenFile = (file: FileItem) => {
      // Route all viewable files to Preview
      if (['image', 'video', 'code', 'markdown', 'pdf', 'doc', 'sheet', 'unknown'].includes(file.type)) {
          openApp(AppId.PREVIEW, { file });
      } else {
          // Fallback
          openApp(AppId.NOTEPAD, { file });
      }
  };

  // --- Window Actions ---

  const closeWindow = (id: AppId) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const minimizeWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
  };

  const maximizeWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized, dockSide: null } : w));
    focusWindow(id);
  };

  const dockWindow = (id: AppId, side: 'left' | 'right' | null) => {
    setWindows(prev => prev.map(w => w.id === id ? { 
        ...w, 
        dockSide: side, 
        isMaximized: false 
    } : w));
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

  const handleDesktopClick = () => {};

  const appIcons = Object.fromEntries(
    Object.entries(appRegistry).map(([id, app]) => [id, app.icon])
  ) as Record<AppId, React.ReactNode>;

  const activeWindow = windows.find(w => w.id === activeWindowId);
  const activeAppTitle = activeWindow ? activeWindow.title : 'MateOS';

  const handleSwitchOrg = (orgId: number) => {
      setActiveOrgId(orgId);
      const newOrg = currentUser?.organizations.find(o => o.id === orgId);
      if (newOrg && newOrg.workspaces.length > 0) {
          setActiveWorkspaceId(newOrg.workspaces[0].id);
      } else {
          setActiveWorkspaceId(null);
      }
      setWindows([]);
      setActiveWindowId(null);
  };

  const handleSwitchWorkspace = (wkId: number) => {
      setActiveWorkspaceId(wkId);
      setWindows([]);
      setActiveWindowId(null);
  };

  // Helper to render dynamic window content with props/data
  const renderWindowContent = (window: WindowState) => {
      // Specialized Apps handling data
      if (window.id === AppId.PHOTOS) {
           return (
              <div className="p-4 bg-black h-full overflow-y-auto grid grid-cols-3 gap-2">
                 {[...Array(12)].map((_, i) => (
                     <img key={i} src={`https://picsum.photos/300/200?random=${i}`} className="w-full h-auto rounded-sm hover:opacity-80 transition-opacity cursor-pointer" alt="Gallery" />
                 ))}
              </div>
           );
      }

      if (window.id === AppId.BROWSER) {
           // If we have a URL passed via Vault
           if (window.data?.url) {
                return (
                    <div className="flex flex-col h-full">
                        <div className="bg-gray-100 p-2 text-sm truncate border-b">{window.data.url}</div>
                        <iframe src={window.data.url} className="flex-1 w-full border-0" title="Browser" />
                    </div>
                );
           }
           return <BrowserApp />;
      }
      
      if (window.id === AppId.NOTEPAD) {
          return <NotepadApp />;
      }

      if (window.id === AppId.SETTINGS) {
          return (
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
          );
      }

      if (window.id === AppId.ADMIN && currentOrg) {
          return (
            <AdminPanel 
                currentOrg={currentOrg}
                currentWorkspace={currentWorkspace}
            />
          );
      }

      if (window.id === AppId.VAULT) {
          return <VaultApp onOpenFile={handleOpenFile} />;
      }

      if (window.id === AppId.PREVIEW) {
          return (
            <PreviewApp 
                tabs={window.data?.tabs || []} 
                activeTabId={window.data?.activeTabId} 
                onUpdate={(newData) => updateWindowData(AppId.PREVIEW, newData)}
            />
          );
      }
      
      return window.component;
  };

  return (
    <div 
        className="relative w-screen h-screen overflow-hidden bg-cover bg-center select-none transition-all duration-700"
        style={{ backgroundImage: `url("${wallpaper}")` }}
        onClick={handleDesktopClick}
        onContextMenu={(e) => e.preventDefault()}
    >
      {authMode === 'boot' && <BootScreen onComplete={handleBootComplete} />}
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

      {authMode === 'desktop' && (
        <>
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
                    organizations={currentUser?.organizations || []}
                    currentOrg={currentOrg}
                    currentWorkspace={currentWorkspace}
                    onSwitchOrg={handleSwitchOrg}
                    onSwitchWorkspace={handleSwitchWorkspace}
                    notificationPanelOpen={notificationPanelOpen}
                    onToggleNotificationPanel={() => setNotificationPanelOpen(!notificationPanelOpen)}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                />
            )}

            <div className={`absolute left-4 flex flex-col gap-6 z-0 ${theme === 'aqua' ? 'top-12 right-4 items-end left-auto' : 'top-4 items-center'}`}>
                <button 
                    onDoubleClick={() => openApp(AppId.VAULT)}
                    className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
                >
                    <Vault className="w-10 h-10 text-amber-300 desktop-icon-shadow" />
                    <span className="text-xs text-center line-clamp-2 desktop-text-shadow font-medium">Vault</span>
                </button>

                {currentOrg?.role === 'admin' && (
                    <button 
                        onDoubleClick={() => openApp(AppId.ADMIN)}
                        className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
                    >
                        <ShieldUser className="w-10 h-10 text-red-500 fill-red-900/50 desktop-icon-shadow" />
                        <span className="text-xs text-center desktop-text-shadow font-medium">Admin Console</span>
                    </button>
                )}
                <button 
                    className="w-20 flex flex-col items-center gap-1 group text-white hover:bg-white/10 rounded p-2 transition-colors"
                >
                    <Trash2 className="w-10 h-10 text-gray-300 desktop-icon-shadow" />
                    <span className="text-xs text-center desktop-text-shadow font-medium">Recycle Bin</span>
                </button>
            </div>

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
                onDock={dockWindow}
                theme={theme}
                hideTaskbar={hideTaskbar}
                >
                   {renderWindowContent(window)}
                </WindowFrame>
            ))}

            <AppSwitcher 
                isOpen={isSwitcherOpen} 
                windows={sortedWindows}
                selectedIndex={switcherSelectedIndex}
                onClose={() => setIsSwitcherOpen(false)}
                onSelect={(idx) => {
                    setSwitcherSelectedIndex(idx);
                    if (sortedWindows[idx]) {
                        focusWindow(sortedWindows[idx].id);
                    }
                    setIsSwitcherOpen(false);
                }}
            />

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
            
            <NotificationCenter 
                isOpen={notificationPanelOpen}
                onClose={() => setNotificationPanelOpen(false)}
                recentItems={RECENT_ITEMS}
                onOpenNotificationsApp={() => openApp(AppId.NOTIFICATIONS)}
                theme={theme}
            />

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
                notificationPanelOpen={notificationPanelOpen}
                onToggleNotificationPanel={() => setNotificationPanelOpen(!notificationPanelOpen)}
                recentItems={RECENT_ITEMS}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
            />
        </>
      )}
    </div>
  );
};

export default App;