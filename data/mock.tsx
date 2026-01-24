
import React from 'react';
import { Calendar, FileText, Image as ImageIcon, Command } from 'lucide-react';
import { FileItem, RecentItem, Theme, Message, Conversation } from '../types';

// Mock Data for "Database"
export const MOCK_USERS = [
    {
        id: '1',
        name: 'Solar System Admin',
        password: '1',
        email: 'solar_admin@example.com',
        avatar: null,
        preferences: {
            themes: [
                {
                    name: 'aqua' as Theme,
                    wallpaper: 'images/wallpaper-1.jpeg'
                },
                {
                    name: 'aero' as Theme,
                    wallpaper: 'images/wallpaper-1.jpeg'
                },

            ],
            active_theme: 'aqua' as Theme
        },
        organizations: [
            {
                id: 1,
                name: 'Solar System',
                logo: 'https://cdn-icons-png.flaticon.com/512/2530/2530877.png',
                role: 'admin' as const,
                workspaces: [
                    { id: 1, name: 'Earth', logo: 'https://cdn-icons-png.flaticon.com/512/2853/2853965.png' ,
                        role:'admin' as const}, 
                    { id: 2, name: 'Mars', logo: 'https://cdn-icons-png.flaticon.com/512/2530/2530863.png' ,
                        role:'admin' as const
                    }, 
                    { id: 3, name: 'Venus', logo: 'https://cdn-icons-png.flaticon.com/512/2530/2530871.png' ,
                        role:'admin' as const
                    }
                ]
            },
            {
                id: 2,
                name: 'Milky Way',
                logo: 'https://cdn-icons-png.flaticon.com/512/3241/3241219.png',
                role: 'user' as const,
                workspaces: [
                    { id: 4, name: 'Core', logo: 'https://cdn-icons-png.flaticon.com/512/3241/3241219.png' , role:'admin' as const},
                    { id: 5, name: 'Spiral Arm', logo: 'https://cdn-icons-png.flaticon.com/512/2928/2928509.png' , role:'admin' as const}
                ]
            }
        ],
        role: 'admin'
    },
    {
        id: '2',
        name: 'Solar System Member',
        password: '1',
        email: 'solar_member@example.com',
        avatar: null,
        preferences: {
            themes: [{
                name: 'aqua' as Theme,
                wallpaper: 'images/wallpaper-2.jpeg',
            }],
            active_theme: 'aqua' as Theme
        },
        organizations: [
            {
                id: 1,
                name: 'Solar System',
                logo: 'https://cdn-icons-png.flaticon.com/512/2530/2530877.png',
                role: 'user' as const,
                workspaces: [{ id: 1, name: 'Earth', logo: 'https://cdn-icons-png.flaticon.com/512/2853/2853965.png' , role:'user' as const},
                    {
                    id: 2, name: 'Mars', logo: 'https://cdn-icons-png.flaticon.com/512/2530/2530863.png' , role:'user' as const
                    }
                ]
            }
        ],
        role: 'user'
    },
    {
        id: '3',
        name: 'Solar System Viewer',
        password: '1',
        email: 'solar_viewer@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        preferences: { themes: [], active_theme: 'aqua' as Theme },
        organizations: [{ id: 1, name: 'Solar System', logo: '', workspaces: [{ id: 1, name: 'Earth', logo: 'https://cdn-icons-png.flaticon.com/512/2853/2853965.png' , role:'viewer' as const}] }],
        role: 'user'
    }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        title: "", // Title is dynamic for 1-1
        is_group: false,
        last_message: "Sounds good. Also, the new wallpaper looks great!",
        unread_count: 1,
        updated_at: new Date(Date.now() - 3400000).toISOString(),
        users: [MOCK_USERS[0], MOCK_USERS[1]] // Admin & Mateo
    },
    {
        id: 2,
        title: "Project Alpha",
        is_group: true,
        last_message: "I uploaded the new specs.",
        unread_count: 0,
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        users: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]] // All three
    }
];

export const MOCK_MESSAGES: Message[] = [
    {
        id: 'm1',
        conversation_id: 1,
        sender_id: '2', // Mateo
        content: 'Hey Admin, have you checked the Vault settings?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'read'
    },
    {
        id: 'm2',
        conversation_id: 1,
        sender_id: '1', // Admin
        content: 'Not yet, I will look at it after lunch.',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        status: 'read'
    },
    {
        id: 'm3',
        conversation_id: 1,
        sender_id: '2', // Mateo
        content: 'Sounds good. Also, the new wallpaper looks great!',
        timestamp: new Date(Date.now() - 3400000).toISOString(),
        status: 'sent'
    },
    {
        id: 'm4',
        conversation_id: 2,
        sender_id: '3', // Sarah
        content: 'Can we review the designs?',
        timestamp: new Date(Date.now() - 90000000).toISOString(),
        status: 'read'
    },
    {
        id: 'm5',
        conversation_id: 2,
        sender_id: '1', // Admin
        content: 'I uploaded the new specs.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'read',
        attachments: [
            { id: '1', name: 'Project_Alpha_Specs.pdf', type: 'pdf', size: '2.4 MB', date: '2024-05-20', url: 'https://pdfobject.com/pdf/sample.pdf', status: 'Ready' }
        ]
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

// Sample Markdown Content
const readmeContent = `# MateOS Documentation

Welcome to **MateOS**! This is a simulated operating system built with React and Tailwind CSS.

## Features
- **Window Management**: Drag, drop, minimize, maximize windows just like a real OS.
- **App Ecosystem**: Integrated apps like Browser, Settings, Photos, and Copilot.
- **File System**: Simulated Vault for file management with support for various file types.
- **AI Integration**: Copilot powered by Google Gemini.

## Getting Started
1. Click on the *Start Menu* (Rocket icon) to launch apps.
2. Use *Copilot* for AI assistance.
3. Customize your experience in *Settings* (Themes, Wallpapers).

## Supported File Types
| Type | Extension | Viewer |
|------|-----------|--------|
| PDF | .pdf | DocViewer |
| Word | .docx | DocViewer |
| Markdown | .md | ReactMarkdown |
| Images | .jpg, .png | Photos |

> "The future is web-based."
`;

const readmeDataUrl = `data:text/markdown;base64,${btoa(readmeContent)}`;

// Mock Files for Vault
export const MOCK_FILES: FileItem[] = [
    { id: '1', name: 'Project_Alpha_Specs.pdf', type: 'pdf', size: '2.4 MB', date: '2024-05-20', url: 'https://pdfobject.com/pdf/sample.pdf', tags: ['Strategy', 'Work'], status: 'Ready' },
    { id: '2', name: 'Q3_Financials.xlsx', type: 'sheet', size: '45 KB', date: '2024-05-18', url: '#', tags: ['Financial', 'Work'], status: 'Ready' },
    { id: '3', name: 'Team_Outing.jpg', type: 'image', size: '3.1 MB', date: '2024-05-15', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=3432&auto=format&fit=crop', tags: ['Personal'], status: 'Ready' },
    { id: '4', name: 'Launch_Video.mp4', type: 'video', size: '45.2 MB', date: '2024-05-10', url: 'https://storage.googleapis.com/kagglesdsdata/datasets/5086844/8519760/Original_recording5.mp4?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260116%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260116T215706Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=4d46d9b6b4e0518746efbe6384228ce53f864cecb7edaf8e5f3cb086d0589fb30d4099fb51b6aa3b985d02635dc0ac1ec595f92e3dfd6207cb2aaec2a89f07cde7f899ba4c54163f2d1a1da0ca8a16bf1f45c1ae23c430363c1fe2471bf2e01418cd4147ea8eb2b18c875b33b262e41eb041673132cfea6f0465c8b7a9bc1367fcf48ee5d5f605ff3fb5cf8f013d8c66185b41abe8dc3c9e9ed3df306dd49d48fe6151f4d3144402f25f5e760cdb9bd18535cb4fd2d1136c586dd2dccb7c0c8931da98d56ef55e4ccae1c29954fe6c776a77e1672a0492f1d4d40a28e3d1525700fe47eea50557f3cccf1e3030f0f3724ee010020538e68f687b2caf56bb3708', tags: ['Marketing'], status: 'Indexing' },
    { id: '5', name: 'main.tsx', type: 'code', size: '2 KB', date: '2024-05-05', url: '#', tags: ['Work', 'Dev'], status: 'Ready' },
    { id: '6', name: 'Meeting_Notes.txt', type: 'doc', size: '1 KB', date: '2024-05-01', url: '#', tags: ['Work'], status: 'Ready' },
    { id: '7', name: 'README.md', type: 'markdown', size: '1 KB', date: '2024-05-22', url: readmeDataUrl, tags: ['Doc', 'Dev'], status: 'Ready' },
];

export const MOCK_ADMIN_CONSOLE = {
    workspaces: [
      { id: 1, name: 'Earth', logo: 'https://cdn-icons-png.flaticon.com/512/2853/2853965.png' }, 
      { id: 2, name: 'Mars', logo: 'https://cdn-icons-png.flaticon.com/512/2530/2530863.png' }, 
      { id: 3, name: 'Venus', logo: 'https://cdn-icons-png.flaticon.com/512/2530/2530871.png' }
    ],
    users:[{
        id: '1',
        name:'Admin',
        email:'admin@mateos.com',
        role: 'admin' as const,
        workspaces: [{ id: 1, role: 'admin'}, { id: 2, role: 'admin'}, { id: 3, role: 'admin'}],
    }]
};
