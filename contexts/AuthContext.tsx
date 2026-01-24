
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { User, AuthMode, Organization, Workspace, ColorMode } from '../types';
import { apiService } from '../services/api';
import { MOCK_USERS } from '../data/mock';

interface AuthContextType {
    user: User | undefined;
    token: string | undefined;
    authMode: AuthMode;
    colorMode: ColorMode;
    setColorMode: (mode: ColorMode) => void;
    activeOrg: Organization | undefined;
    activeWorkspace: Workspace | undefined;
    login: (user: any, token: string) => void;
    logout: () => Promise<void>;
    lock: () => void;
    switchOrg: (id: number) => void;
    switchWorkspace: (id: number) => void;
    setAuthMode: (mode: AuthMode) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_SHORT_MS = 2 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [name, setName] = useState<string>(() => {
        const localUser = localStorage.getItem('mateos_user');
        if (localUser) {
            try { return JSON.parse(localUser).name || ''; } catch (e) { return ''; }
        }
        return '';
    });

    const [token, setToken] = useState<string | undefined>(() => localStorage.getItem('mateos_token') || undefined);

    const [colorMode, setColorModeState] = useState<ColorMode>(() => {
        return (localStorage.getItem('mateos_color_mode') as ColorMode) || 'auto';
    });

    const setColorMode = useCallback((mode: ColorMode) => {
        setColorModeState(mode);
        localStorage.setItem('mateos_color_mode', mode);
    }, []);

    const [authMode, setAuthMode] = useState<AuthMode>(() => {
        const bootCompleted = localStorage.getItem('mateos_boot_completed');
        if (!bootCompleted) return 'boot';
        const isLocked = localStorage.getItem('mateos_is_locked') === 'true';
        const localUser = localStorage.getItem('mateos_user');
        if (isLocked && localUser) return 'login_partial';
        const lastLoginStr = localStorage.getItem('mateos_last_login');
        if (localUser && lastLoginStr) {
            const now = Date.now();
            const lastLogin = parseInt(lastLoginStr, 10);
            if (now - lastLogin < SESSION_MAX_MS) return 'desktop';
        }
        return 'login_full';
    });

    const user = useMemo(() => {
        const mockUser = MOCK_USERS.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (mockUser) return mockUser as unknown as User;
        const localUser = localStorage.getItem('mateos_user');
        if (localUser) {
            try { return JSON.parse(localUser) as User; } catch (e) { }
        }
        return undefined;
    }, [name]);

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

    const activeOrg = useMemo(() => {
        if (!user) return undefined;
        if (activeOrgId) return user.organizations.find(o => o.id === activeOrgId);
        return user.organizations[0];
    }, [user, activeOrgId]);

    const activeWorkspace = useMemo(() => {
        if (!activeOrg) return undefined;
        if (activeWorkspaceId) return activeOrg.workspaces.find(w => w.id === activeWorkspaceId);
        return activeOrg.workspaces[0];
    }, [activeOrg, activeWorkspaceId]);

    useEffect(() => {
        if (activeOrg) {
            localStorage.setItem('mateos_active_context', JSON.stringify({
                orgId: activeOrg.id,
                wkId: activeWorkspace?.id
            }));
        }
    }, [activeOrg, activeWorkspace]);

    const checkSession = useCallback(async (isBackgroundCheck = false) => {
        const localUser = localStorage.getItem('mateos_user');
        const lastLoginStr = localStorage.getItem('mateos_last_login');
        const currentToken = localStorage.getItem('mateos_token');
        const isLocked = localStorage.getItem('mateos_is_locked') === 'true';
        const now = Date.now();

        if (!localUser || !lastLoginStr) {
            if (!isBackgroundCheck) setAuthMode('login_full');
            return;
        }

        const lastLogin = parseInt(lastLoginStr, 10);
        if (now - lastLogin > SESSION_MAX_MS) {
            setAuthMode('login_full');
            return;
        }

        if (currentToken) {
            try {
                const isValid = await apiService.checkSession(currentToken);
                if (!isValid) setAuthMode('login_partial');
            } catch (e) {
                setAuthMode('login_partial');
            }
        }

        if (isLocked) setAuthMode('login_partial');
    }, []);

    useEffect(() => {
        if (authMode === 'desktop') {
            const intervalId = setInterval(() => checkSession(true), CHECK_INTERVAL_MS);
            return () => clearInterval(intervalId);
        }
    }, [authMode, checkSession]);

    const login = useCallback((userData: any, newToken: string) => {
        const now = Date.now();
        localStorage.setItem('mateos_user', JSON.stringify(userData));
        localStorage.setItem('mateos_last_login', now.toString());
        localStorage.removeItem('mateos_is_locked');
        if (newToken) {
            localStorage.setItem('mateos_token', newToken);
            setToken(newToken);
        }
        
        setName(userData.name);

        const orgs = userData.organizations || [];
        if (orgs.length > 1 || (orgs[0]?.workspaces.length > 1)) {
            setAuthMode('context_selection');
        } else {
            setAuthMode('desktop');
        }
    }, []);

    const logout = useCallback(async () => {
        await apiService.logout(token);
        
        // Session & Auth
        localStorage.removeItem('mateos_user');
        localStorage.removeItem('mateos_last_login');
        localStorage.removeItem('mateos_token');
        localStorage.removeItem('mateos_is_locked');
        localStorage.removeItem('mateos_active_context');
        
        // OS State / UI Preferences / Temporary Settings
        localStorage.removeItem('mateos_windows');
        localStorage.removeItem('mateos_window_meta');
        localStorage.removeItem('mateos_theme');
        localStorage.removeItem('mateos_wallpaper');
        localStorage.removeItem('mateos_avatar');

        setName('');
        setToken(undefined);
        setActiveOrgId(null);
        setActiveWorkspaceId(null);
        setAuthMode('login_full');
    }, [token]);

    const lock = useCallback(() => {
        localStorage.setItem('mateos_is_locked', 'true');
        setAuthMode('login_partial');
    }, []);

    const switchOrg = useCallback((orgId: number) => {
        setActiveOrgId(orgId);
        const org = user?.organizations.find(o => o.id === orgId);
        if (org && org.workspaces.length > 0) {
            setActiveWorkspaceId(org.workspaces[0].id);
        } else {
            setActiveWorkspaceId(null);
        }
    }, [user]);

    const switchWorkspace = useCallback((wkId: number) => {
        setActiveWorkspaceId(wkId);
    }, []);

    const value = useMemo(() => ({
        user,
        token,
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
    }), [user, token, authMode, colorMode, setColorMode, activeOrg, activeWorkspace, login, logout, lock, switchOrg, switchWorkspace]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
