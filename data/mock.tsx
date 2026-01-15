import React from 'react';
import { Calendar, FileText, Image as ImageIcon, Command } from 'lucide-react';
import { RecentItem } from '../types';

// Mock Data for "Database"
export const MOCK_USERS = [
  { id: '1', username: 'admin', password: 'password', email: 'admin@mateos.com' },
  { id: '2', username: 'guest', password: 'guest', email: 'guest@mateos.com' },
  { id: '3', username: 'mateo', password: '123', email: 'mateo@mateos.com' }
];

// Wallpaper Presets
export const WALLPAPERS = [
  { id: 'wp1', src: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=3870&auto=format&fit=crop', title: 'Default Aqua' },
  { id: 'wp2', src: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=3870&auto=format&fit=crop', title: 'Mountain' },
  { id: 'wp3', src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=3872&auto=format&fit=crop', title: 'Space' },
  { id: 'wp4', src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3870&auto=format&fit=crop', title: 'Valley' },
  { id: 'wp5', src: 'https://images.unsplash.com/photo-1506202687253-52e1b29d3527?q=80&w=3870&auto=format&fit=crop', title: 'Nebula' },
  { id: 'wp6', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3164&auto=format&fit=crop', title: 'Abstract' },
];

// Global Data
export const RECENT_ITEMS: RecentItem[] = [
    { 
        id: 1, 
        title: 'Team Meeting', 
        description: '10:00 AM - 11:00 AM', 
        type: 'calendar', 
        timestamp: 'Now',
        icon: <Calendar size={18} className="text-red-500" />
    },
    { 
        id: 2, 
        title: 'Project Alpha Specs.pdf', 
        description: 'Edited 2h ago', 
        type: 'file', 
        timestamp: '2h ago',
        icon: <FileText size={18} className="text-blue-500" />
    },
    { 
        id: 3, 
        title: 'Screenshot 2024-05-20', 
        description: 'Desktop', 
        type: 'image', 
        timestamp: 'Yesterday',
        icon: <ImageIcon size={18} className="text-purple-500" />
    },
    { 
        id: 4, 
        title: 'System Update', 
        description: 'Successfully installed', 
        type: 'system', 
        timestamp: 'Yesterday',
        icon: <Command size={18} className="text-gray-500" />
    },
];
