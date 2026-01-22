import { ReactNode } from 'react';

export enum AppId {
  NOTEPAD = 'notepad',
  BROWSER = 'browser',
  PHOTOS = 'photos',
  SETTINGS = 'settings',
  CALCULATOR = 'calculator',
  ADMIN = 'admin',
  NOTIFICATIONS = 'notifications',
  VAULT = 'vault',
  PREVIEW = 'preview'
}

export type Theme = 'aero' | 'aqua';

export type AuthMode = 'boot' | 'login_full' | 'login_partial' | 'context_selection' | 'desktop';

export interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'doc' | 'sheet' | 'presentation'| 'pdf' | 'code' | 'markdown' | 'unknown';
  size: string;
  url: string; // Real or Object URL
  date: string;
  category?: string;
  tags?: string[];
  status?: 'Indexing' | 'Ready' | 'Error';
}

export interface WindowState {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  dockSide?: 'left' | 'right' | null; // New property for docking
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  icon: ReactNode;
  component: ReactNode;
  data?: any; // To pass file data or initial state
}

export interface AppConfig {
  id: AppId;
  title: string;
  icon: ReactNode;
  component: (props: { windowId: AppId }) => ReactNode;
  defaultSize?: { width: number; height: number };
  preferredPosition?: { x: number; y: number };
}

export interface RecentItem {
  id: number | string;
  title: string;
  description: string;
  timestamp: string;
  type: 'calendar' | 'file' | 'image' | 'system';
  icon?: ReactNode;
}

export interface Workspace {
  id: number;
  name: string;
}

export interface Organization {
  id: number;
  name: string;
  workspaces: Workspace[];
  // The role of the current user in this organization
  role?: 'admin' | 'user';
}

export interface ThemePreference {
    name?: Theme;
    wallpaper?: string;
}

export interface Preferences{
    themes?: ThemePreference[];
    active_theme?: Theme;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  token?: string;
  preferences?: Preferences;
  organizations: Organization[];
}