
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NotificationItem } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface GlobalContextType {
    notifications: NotificationItem[];
    recentItems: NotificationItem[];
    addNotification: (item: NotificationItem) => void;
    removeNotification: (id: number | string) => void;
    clearNotifications: () => void;
    refreshData: () => Promise<void>;
    isLoading: boolean;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { token, authMode } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [recentItems, setRecentItems] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshData = useCallback(async () => {
        if (authMode !== 'desktop' || !token) return;

        setIsLoading(true);
        try {
            const [notifsData, recentsData] = await Promise.all([
                apiService.getNotifications(token),
                apiService.getRecentItems(token)
            ]);
            setNotifications(notifsData);
            setRecentItems(recentsData);
        } catch (e) {
            console.error("Failed to fetch global data", e);
        } finally {
            setIsLoading(false);
        }
    }, [authMode, token]);

    // Initial Fetch
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Polling (Optional - every 60s)
    useEffect(() => {
        if (authMode !== 'desktop') return;
        const interval = setInterval(refreshData, 60000);
        return () => clearInterval(interval);
    }, [authMode, refreshData]);

    const addNotification = (item: NotificationItem) => {
        setNotifications(prev => [item, ...prev]);
    };

    const removeNotification = (id: number | string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <GlobalContext.Provider value={{
            notifications,
            recentItems,
            addNotification,
            removeNotification,
            clearNotifications,
            refreshData,
            isLoading
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};
