
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
import { BrowserApp } from './components/apps/Browser';
import { SettingsApp } from './components/apps/Settings';
import { AdminConsole } from './components/apps/AdminConsole';
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
import { Modal } from './components/os/Modal';
import { AppId, WindowState, Theme, AuthMode, User, Organization, Workspace, FileItem, ColorMode } from './types';
import { useAuth } from './contexts/AuthContext';
import { RECENT_ITEMS, WALLPAPERS } from './data/mock';

// Placeholder apps
const Placeholder = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-[#202020] text-gray-900 dark:text-gray-100">
    {text}
  </div>
);

const App: React.FC = () => {
  const { 
    user, 
    authMode, 
    colorMode,
    setColorMode,
    activeOrg, 
    activeWorkspace, 
    login, 
    logout, 
    lock, 
    switchOrg, 
    switchWorkspace, 
    setAuthMode 
  } = useAuth();

  // --- OS UI State ---
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
  
  const [hasRestored, setHasRestored] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherSelectedIndex, setSwitcherSelectedIndex] = useState(0);

  // Track context to close apps on switch
  const lastContextId = useRef<string>("");

  // Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Appearance Sync (Dark Mode Implementation)
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyColorMode = (mode: ColorMode) => {
        if (mode === 'dark') {
            root.classList.add('dark');
        } else if (mode === 'light') {
            root.classList.remove('dark');
        } else {
            // Auto: use system media query
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    applyColorMode(colorMode);

    // If Auto, we need a listener for system changes
    if (colorMode === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => {
            if (e.matches) root.classList.add('dark');
            else root.classList.remove('dark');
        };
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [colorMode]);

  // Sync state to local storage for UI settings
  useEffect(() => { localStorage.setItem('mateos_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('mateos_wallpaper', wallpaper); }, [wallpaper]);
  useEffect(() => { 
    if (userAvatar) localStorage.setItem('mateos_avatar', userAvatar);
    else localStorage.removeItem('mateos_avatar');
  }, [userAvatar]);

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  const sortedWindows = useMemo(() => [...windows].sort((a, b) => b.zIndex - a.zIndex), [windows]);

  // Window Management
  const openApp = useCallback((id: AppId, payload?: any) => {
    setStartMenuOpen(false);
    
    setWindows(prevWindows => {
        const existingWindow = prevWindows.find(w => w.id === id);
        
        if (existingWindow) {
             let newData = payload || existingWindow.data;
             if (id === AppId.PREVIEW && payload?.file) {
                 const currentTabs: FileItem[] = existingWindow.data?.tabs || [];
                 const newFile: FileItem = payload.file;
                 const exists = currentTabs.find(t => t.id === newFile.id);
                 let newTabs = exists ? currentTabs : [...currentTabs, newFile].slice(0, 20);
                 newData = { tabs: newTabs, activeTabId: newFile.id };
             }
             return prevWindows.map(w => w.id === id ? { ...w, isMinimized: false, data: newData, zIndex: nextZIndex } : w);
        }

        const title = id.charAt(0).toUpperCase() + id.slice(1);
        
        let initialData = payload;
        if (id === AppId.PREVIEW && payload?.file) {
            initialData = { tabs: [payload.file], activeTabId: payload.file.id };
        }

        const newWindow: WindowState = {
            id,
            title: title,
            icon: <File size={16} />, 
            component: null, 
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            dockSide: null,
            zIndex: nextZIndex,
            size: { width: 800, height: 600 },
            position: { x: 50 + (prevWindows.length * 30), y: (theme === 'aqua' ? 80 : 50) + (prevWindows.length * 30) },
            data: initialData
        };
        return [...prevWindows, newWindow];
    });

    setActiveWindowId(id);
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex, theme]);

  const handleOpenFile = useCallback((file: FileItem) => {
      openApp(AppId.PREVIEW, { file });
  }, [openApp]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isSwitcherOpen) {
            if (e.key === 'ArrowRight') { e.preventDefault(); setSwitcherSelectedIndex(prev => (prev + 1) % sortedWindows.length); return; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); setSwitcherSelectedIndex(prev => (prev - 1 + sortedWindows.length) % sortedWindows.length); return; }
            if (e.key === 'Enter') { e.preventDefault(); setIsSwitcherOpen(false); if (sortedWindows[switcherSelectedIndex]) focusWindow(sortedWindows[switcherSelectedIndex].id); return; }
        }
        const isModifierHeld = e.metaKey || e.altKey;
        if (isModifierHeld) {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (sortedWindows.length > 0) {
                     if (!isSwitcherOpen) { setIsSwitcherOpen(true); setSwitcherSelectedIndex(sortedWindows.length > 1 ? 1 : 0); }
                     else { setSwitcherSelectedIndex(prev => (prev + 1) % sortedWindows.length); }
                }
            }
            if (e.key.toLowerCase() === 'w' && activeWindowId) { e.preventDefault(); closeWindow(activeWindowId); }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        const isModifierKey = e.key === 'Meta' || e.key === 'Alt' || e.key === 'Control' || e.key === 'OS';
        if (isSwitcherOpen && isModifierKey) {
            setIsSwitcherOpen(false);
            if (sortedWindows[switcherSelectedIndex]) focusWindow(sortedWindows[switcherSelectedIndex].id);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [isSwitcherOpen, switcherSelectedIndex, sortedWindows, activeWindowId]);

  // Inactivity timeout
  useEffect(() => {
    if (authMode !== 'desktop') return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(lock, 1800000); // 30 minutes
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [authMode, lock]);

  // Close all apps when switching Organization or Workspace
  useEffect(() => {
    if (authMode !== 'desktop') return;
    
    const currentContextId = `${activeOrg?.id}-${activeWorkspace?.id}`;
    
    // We only clear if the user has already restored their session and manually switches.
    // Restoration phase is when authMode is 'desktop' but hasRestored is false.
    if (hasRestored) {
        if (lastContextId.current && lastContextId.current !== currentContextId) {
            setWindows([]);
            setActiveWindowId(null);
            // Optional: Close start menu/notification panel on context switch
            setStartMenuOpen(false);
            setNotificationPanelOpen(false);
        }
    }
    
    lastContextId.current = currentContextId;
  }, [activeOrg?.id, activeWorkspace?.id, authMode, hasRestored]);

  // --- App Registry ---
  const appRegistry: Record<AppId, any> = useMemo(() => ({    
    [AppId.SETTINGS]: {
        title: 'Settings',
        icon: <Settings className="text-gray-900 dark:text-gray-100" size={20} />,
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
        icon: <Bell className="text-blue-500" size={20} />,
        component: <NotificationsApp />,
        defaultSize: { width: 400, height: 600 }
    },
    [AppId.VAULT]: {
        title: 'Vault',
        icon: <Vault className="text-amber-500" size={20} />,
        component: null,
        defaultSize: { width: 900, height: 600 }
    },
    [AppId.PREVIEW]: {
        title: 'Preview',
        icon: <Eye className="text-gray-600 dark:text-gray-300" size={20} />,
        component: null,
        defaultSize: { width: 800, height: 800 }
    },
  }), []);

  // Session Persistence
  useEffect(() => {
      if (authMode === 'desktop' && !hasRestored) {
          const savedWindowsStr = localStorage.getItem('mateos_windows');
          const savedMetaStr = localStorage.getItem('mateos_window_meta');
          if (savedWindowsStr) {
              try {
                  const savedWindows = JSON.parse(savedWindowsStr);
                  const hydratedWindows = savedWindows.map((w: any) => {
                      const app = appRegistry[w.id as AppId];
                      if (!app) return null;
                      return { ...w, icon: app.icon, component: app.component };
                  }).filter(Boolean);
                  setWindows(hydratedWindows);
                  if (savedMetaStr) {
                      const meta = JSON.parse(savedMetaStr);
                      setActiveWindowId(meta.activeWindowId);
                      setNextZIndex(meta.nextZIndex);
                  }
              } catch (e) { console.error(e); }
          }
          setHasRestored(true);
      }
  }, [authMode, hasRestored, appRegistry]);

  useEffect(() => {
      if (authMode === 'desktop' && hasRestored) {
          const serializableWindows = windows.map(w => {
              const { icon, component, ...rest } = w;
              return rest;
          });
          localStorage.setItem('mateos_windows', JSON.stringify(serializableWindows));
          localStorage.setItem('mateos_window_meta', JSON.stringify({ activeWindowId, nextZIndex }));
      }
  }, [windows, activeWindowId, nextZIndex, authMode, hasRestored]);

  const updateWindowData = (id: AppId, newData: any) => setWindows(prev => prev.map(w => w.id === id ? { ...w, data: newData } : w));
  const closeWindow = (id: AppId) => { setWindows(prev => prev.filter(w => w.id !== id)); if (activeWindowId === id) setActiveWindowId(null); };
  const minimizeWindow = (id: AppId) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w)); setActiveWindowId(null); };
  const maximizeWindow = (id: AppId) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized, dockSide: null } : w)); focusWindow(id); };
  const dockWindow = (id: AppId, side: 'left' | 'right' | null) => { setWindows(prev => prev.map(w => w.id === id ? { ...w, dockSide: side, isMaximized: false } : w)); focusWindow(id); };
  const focusWindow = (id: AppId) => { setActiveWindowId(id); setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZIndex } : w)); setNextZIndex(prev => prev + 1); };
  const moveWindow = (id: AppId, x: number, y: number) => setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));
  const toggleStartMenu = () => setStartMenuOpen(!startMenuOpen);
  
  const appIcons = Object.fromEntries(Object.entries(appRegistry).map(([id, app]) => [id, app.icon])) as Record<AppId, React.ReactNode>;
  const activeAppTitle = windows.find(w => w.id === activeWindowId)?.title || 'MateOS';

  const renderWindowContent = (window: WindowState) => {
      if (window.id === AppId.SETTINGS) {
          return <SettingsApp theme={theme} setTheme={setTheme} colorMode={colorMode} setColorMode={setColorMode} hideTaskbar={hideTaskbar} setHideTaskbar={setHideTaskbar} name={user?.name} wallpaper={wallpaper} setWallpaper={setWallpaper} userAvatar={userAvatar} setUserAvatar={setUserAvatar} />;
      }
      if (window.id === AppId.ADMIN && activeOrg) return <AdminConsole currentOrg={activeOrg} currentWorkspace={activeWorkspace} />;
      if (window.id === AppId.VAULT) return <VaultApp onOpenFile={handleOpenFile} />;
      if (window.id === AppId.PREVIEW) return <PreviewApp tabs={window.data?.tabs || []} activeTabId={window.data?.activeTabId} onUpdate={(newData) => updateWindowData(AppId.PREVIEW, newData)} />;
      return window.component;
  };

  return (
    <div 
        className="relative w-screen h-screen overflow-hidden bg-cover bg-center select-none transition-all duration-700"
        style={{ backgroundImage: `url("${wallpaper}")` }}
    >
      {authMode === 'boot' && <BootScreen onComplete={() => setAuthMode('login_full')} />}
      {(authMode === 'login_full' || authMode === 'login_partial') && (
        <LoginScreen 
            mode={authMode === 'login_full' ? 'full' : 'partial'}
            savedName={user?.name}
            savedEmail={user?.email}
            onLogin={login}
            onSwitchAccount={logout}
            onForgotPassword={() => setShowRecoveryModal(true)}
            userAvatar={userAvatar}
        />
      )}
      {authMode === 'context_selection' && user && (
        <ContextSelector user={user} onComplete={(o, w) => { switchOrg(o); switchWorkspace(w); setAuthMode('desktop'); }} savedOrgId={activeOrg?.id || null} savedWorkspaceId={activeWorkspace?.id || null} />
      )}

      {authMode === 'desktop' && (
        <div className="w-full h-full relative dark-transition">
            {theme === 'aqua' && (
                <TopBar 
                    activeAppTitle={activeAppTitle} 
                    onOpenSettings={() => openApp(AppId.SETTINGS)}
                    onLogout={logout}
                    recentItems={RECENT_ITEMS}
                    name={user?.name || ''}
                    onOpenUserProfile={() => openApp(AppId.SETTINGS)}
                    userAvatar={userAvatar}
                    onLock={lock}
                    organizations={user?.organizations || []}
                    currentOrg={activeOrg}
                    currentWorkspace={activeWorkspace}
                    onSwitchOrg={switchOrg}
                    onSwitchWorkspace={switchWorkspace}
                    notificationPanelOpen={notificationPanelOpen}
                    onToggleNotificationPanel={() => setNotificationPanelOpen(!notificationPanelOpen)}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                />
            )}

            <div className={`absolute left-4 flex flex-col gap-6 z-0 ${theme === 'aqua' ? 'top-14 right-4 items-end left-auto' : 'top-6 items-center'}`}>
                <button onDoubleClick={() => openApp(AppId.VAULT)} className="w-20 flex flex-col items-center gap-1.5 group text-white hover:bg-white/10 rounded-xl p-2 transition-all active:scale-95">
                    <Vault className="w-10 h-10 text-amber-400 desktop-icon-shadow" />
                    <span className="text-xs text-center line-clamp-2 desktop-text-shadow font-bold">Vault</span>
                </button>
                {activeOrg?.role === 'admin' && (
                    <button onDoubleClick={() => openApp(AppId.ADMIN)} className="w-20 flex flex-col items-center gap-1.5 group text-white hover:bg-white/10 rounded-xl p-2 transition-all active:scale-95">
                        <ShieldUser className="w-10 h-10 text-red-500 fill-red-900/30 desktop-icon-shadow" />
                        <span className="text-xs text-center desktop-text-shadow font-bold">Admin Panel</span>
                    </button>
                )}
            </div>

            {windows.map(window => (
                <WindowFrame key={window.id} window={window} isActive={activeWindowId === window.id} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} onFocus={focusWindow} onMove={moveWindow} onDock={dockWindow} theme={theme} hideTaskbar={hideTaskbar}>
                   {renderWindowContent(window)}
                </WindowFrame>
            ))}

            <AppSwitcher isOpen={isSwitcherOpen} windows={sortedWindows} selectedIndex={switcherSelectedIndex} onClose={() => setIsSwitcherOpen(false)} onSelect={(idx) => { setSwitcherSelectedIndex(idx); if (sortedWindows[idx]) focusWindow(sortedWindows[idx].id); setIsSwitcherOpen(false); }} />

            {theme === 'aero' ? (
                <StartMenu isOpen={startMenuOpen} onAppClick={openApp} appIcons={appIcons} onClose={() => setStartMenuOpen(false)} onLogout={logout} recentItems={RECENT_ITEMS} name={user?.name || ''} onOpenUserProfile={() => openApp(AppId.SETTINGS)} userAvatar={userAvatar} onLock={lock} isAdmin={activeOrg?.role === 'admin'} />
            ) : (
                <Launchpad isOpen={startMenuOpen} onAppClick={openApp} appIcons={appIcons} onClose={() => setStartMenuOpen(false)} isAdmin={activeOrg?.role === 'admin'} />
            )}
            
            <NotificationCenter isOpen={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} recentItems={RECENT_ITEMS} onOpenNotificationsApp={() => openApp(AppId.NOTIFICATIONS)} theme={theme} />

            <Taskbar openApps={windows.map(w => w.id)} activeApp={activeWindowId} onAppClick={(id) => { const win = windows.find(w => w.id === id); if (!win) openApp(id); else if (win.isMinimized) { focusWindow(id); setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false } : w)); } else if (activeWindowId === id) minimizeWindow(id); else focusWindow(id); }} onStartClick={toggleStartMenu} startMenuOpen={startMenuOpen} appIcons={appIcons} theme={theme} hideTaskbar={hideTaskbar} organizations={user?.organizations || []} currentOrg={activeOrg} currentWorkspace={activeWorkspace} onSwitchOrg={switchOrg} onSwitchWorkspace={switchWorkspace} notificationPanelOpen={notificationPanelOpen} onToggleNotificationPanel={() => setNotificationPanelOpen(!notificationPanelOpen)} recentItems={RECENT_ITEMS} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
        </div>
      )}

      {/* Global Modals */}
      <Modal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        title="Recovery Email Sent"
        message="We have sent a password recovery link to your email address. Please check your inbox."
        type="success"
      />
    </div>
  );
};

export default App;
