import { ReactNode } from 'react';

export enum AppId {
  COPILOT = 'copilot',
  NOTEPAD = 'notepad',
  BROWSER = 'browser',
  PHOTOS = 'photos',
  SETTINGS = 'settings',
  CALCULATOR = 'calculator'
}

export type Theme = 'aero' | 'aqua';

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