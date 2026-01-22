import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { User, AuthMode, Organization, Workspace } from '../types';
import { apiService } from '../services/api';
import { MOCK_USERS } from '../data/mock';

interface AuthContextType {
    user: User | undefined;
    authMode: AuthMode;
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
    const [username, setUsername] = useState<string>(() => {
        const localUser = localStorage.getItem('mateos_user');
        if (localUser) {
            try { return JSON.parse(localUser).username || JSON.parse(localUser).name || ''; } catch (e) { return ''; }
        }
        return '';
    });

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
        const mockUser = MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (mockUser) return mockUser as unknown as User;
        const localUser = localStorage.getItem('mateos_user');
        if (localUser) {
            try { return JSON.parse(localUser) as User; } catch (e) { }
        }
        return undefined;
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
        const token = localStorage.getItem('mateos_token');
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

        if (token) {
            try {
                const isValid = await apiService.checkSession(token);
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

    const login = useCallback((userData: any, token: string) => {
        const now = Date.now();
        localStorage.setItem('mateos_user', JSON.stringify(userData));
        localStorage.setItem('mateos_last_login', now.toString());
        localStorage.removeItem('mateos_is_locked');
        if (token) localStorage.setItem('mateos_token', token);
        
        setUsername(userData.username || userData.name);

        const orgs = userData.organizations || [];
        if (orgs.length > 1 || (orgs[0]?.workspaces.length > 1)) {
            setAuthMode('context_selection');
        } else {
            setAuthMode('desktop');
        }
    }, []);

    const logout = useCallback(async () => {
        await apiService.logout();
        localStorage.removeItem('mateos_user');
        localStorage.removeItem('mateos_last_login');
        localStorage.removeItem('mateos_token');
        localStorage.removeItem('mateos_is_locked');
        localStorage.removeItem('mateos_windows');
        localStorage.removeItem('mateos_window_meta');
        setUsername('');
        setActiveOrgId(null);
        setActiveWorkspaceId(null);
        setAuthMode('login_full');
    }, []);

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
        authMode,
        activeOrg,
        activeWorkspace,
        login,
        logout,
        lock,
        switchOrg,
        switchWorkspace,
        setAuthMode
    }), [user, authMode, activeOrg, activeWorkspace, login, logout, lock, switchOrg, switchWorkspace]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
