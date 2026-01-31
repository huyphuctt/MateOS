
import { ReactNode } from 'react';

export enum AppId {
  SETTINGS = 'settings',
  ADMIN = 'admin',
  NOTIFICATIONS = 'notifications',
  VAULT = 'vault',
  PREVIEW = 'preview',
  PIGEON = 'pigeon',
  WORKSHOP = 'workshop'
}

export type Theme = 'aero' | 'aqua';
export type ColorMode = 'light' | 'dark' | 'auto';

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
  image?: string; // New property for window image
  component: ReactNode;
  data?: any; // To pass file data or initial state
}

export interface AppConfig {
  id: AppId;
  title: string;
  icon: ReactNode;
  image?: string;
  component: (props: { windowId: AppId }) => ReactNode;
  defaultSize?: { width: number; height: number };
  preferredPosition?: { x: number; y: number };
}

export interface NotificationItem {
  id: number | string;
  title: string;
  description: string;
  timestamp: string;
  type: 'calendar' | 'file' | 'image' | 'system' | 'message';
  icon?: ReactNode;
  target?: { app: AppId; params?: any };
}

export interface Workspace {
  id: number;
  name: string;
  logo?: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface Organization {
  id: number;
  name: string;
  logo?: string;
  workspaces: Workspace[];
  // The role of the current user in this organization
  role?: 'admin' | 'user' | 'viewer';
}

export interface ThemePreference {
    name?: Theme;
    wallpaper?: string;
}

export interface Preferences{
    themes?: ThemePreference[];
    active_theme?: Theme;
    active_style?: ColorMode;
    active_organization?: number;
    active_workspace?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token?: string;
  preferences?: Preferences;
  organizations: Organization[];
}

export interface AdminConsoleData{
  // list of workspaces in the org
  workspaces: Workspace[];
  // current user in the org
  users: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      role: 'admin' | 'user' | 'viewer';    
      workspaces?: { id: number; role: string }[];
  }[];
}

export interface Message {
  id: string;
  conversation_id: number;
  sender_id: string;
  content: string;
  timestamp: string; // ISO string
  status: 'sending' | 'sent' | 'read';
  attachments?: FileItem[];
  mentions?: string[]; // user IDs
}

export interface Conversation {
    id: number;
    title: string;
    is_group: boolean;
    last_message: string;
    unread_count: number;
    updated_at: string;
    users: User[]; // Full user objects for members
}

// --- Workshop Types ---

export type WorkshopNodeType = 'brief' | 'outline' | 'draft' | 'refine' | 'summary';

export interface WorkshopNode {
    id: string;
    parentId: string | null;
    type: WorkshopNodeType;
    title: string;
    content: string;
    timestamp: string;
    childrenIds: string[];
}

export interface WorkshopProject {
    id: string;
    title: string;
    status: 'inprogress' | 'completed';
    updatedAt: string;
    nodes: Record<string, WorkshopNode>; // Flat map for easy graph lookup
    rootNodeId: string;
}

export interface WorkshopModule {
    id: WorkshopNodeType;
    label: string;
    description: string;
    iconName: 'Layout' | 'FileText' | 'Sparkles' | 'Layers'; // Map to Lucide icons in component
}
