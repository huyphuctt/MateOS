import { ReactNode } from 'react';

export enum AppId {
  COPILOT = 'copilot',
  NOTEPAD = 'notepad',
  BROWSER = 'browser',
  PHOTOS = 'photos',
  SETTINGS = 'settings',
  CALCULATOR = 'calculator',
  ADMIN = 'admin'
}

export type Theme = 'aero' | 'aqua';

export type AuthMode = 'boot' | 'login_full' | 'login_partial' | 'context_selection' | 'desktop';

export interface WindowState {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  icon: ReactNode;
  component: ReactNode;
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

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  token?: string;
  wallpaper?: string;
  organizations: Organization[];
  // Global role or primary role fallback
  role?: 'admin' | 'user'; 
}