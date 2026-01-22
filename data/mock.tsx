import React from 'react';
import { Calendar, FileText, Image as ImageIcon, Command } from 'lucide-react';
import { RecentItem } from '../types';

// Mock Data for "Database"
export const MOCK_USERS = [
    {
        id: '1',
        username: 'Admin',
        password: 'password',
        email: 'admin@mateos.com',
        avatar: null,
        preferences: {
            themes: [
                {
                    name: 'aqua',
                    wallpaper: 'images/wallpaper-1.jpeg'
                },
                {
                    name: 'aero',
                    wallpaper: 'images/wallpaper-1.jpeg'
                },

            ],
            active_theme: 'aqua'
        },
        organizations: [
            {
                id: 1,
                name: 'Solar System',
                role: 'admin',
                workspaces: [{ id: 1, name: 'Earth' }, { id: 2, name: 'Mars' }, { id: 3, name: 'Venus' }]
            },
            {
                id: 2,
                name: 'Milky Way',
                role: 'user',
                workspaces: [{ id: 4, name: 'Core' }, { id: 5, name: 'Spiral Arm' }]
            }
        ],
        role: 'admin'
    },
    {
        id: '2',
        username: 'Mateo',
        password: '123',
        email: 'mateo@mateos.com',
        avatar: null,
        preferences: {
            themes: [{
                name: 'aqua',
                wallpaper: 'images/wallpaper-2.jpeg',
            }],
            active_theme: 'aqua'
        },
        organizations: [
            {
                id: 1,
                name: 'Solar System',
                role: 'user',
                workspaces: [{ id: 1, name: 'Earth' }]
            }
        ],
        role: 'user'
    }
];

// Wallpaper Presets
export const WALLPAPERS = [
    { id: 'wp1', src: 'images/wallpaper-1.jpeg', title: 'Abstract' },
    { id: 'wp2', src: 'images/wallpaper-2.jpeg', title: 'Mountain' },
    { id: 'wp3', src: 'images/wallpaper-3.jpeg', title: 'Space' },
    { id: 'wp4', src: 'images/wallpaper-4.jpeg', title: 'Valley' },
    { id: 'wp5', src: 'images/wallpaper-5.jpeg', title: 'Nebula' },
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