import { MOCK_USERS } from '../data/mock';
import { FileItem } from '../types';

interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    token?: string;
    wallpaper?: string;
}

interface AuthResponse {
    success: boolean;
    user?: User;
    message?: string;
    token?: string;
}
interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
}

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
const MOCK_FILES: FileItem[] = [
    { id: '1', name: 'Project_Alpha_Specs.pdf', type: 'pdf', size: '2.4 MB', date: '2024-05-20', url: 'https://pdfobject.com/pdf/sample.pdf', tags: ['Strategy', 'Work'], status: 'Ready' },
    { id: '2', name: 'Q3_Financials.xlsx', type: 'sheet', size: '45 KB', date: '2024-05-18', url: '#', tags: ['Financial', 'Work'], status: 'Ready' },
    { id: '3', name: 'Team_Outing.jpg', type: 'image', size: '3.1 MB', date: '2024-05-15', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=3432&auto=format&fit=crop', tags: ['Personal'], status: 'Ready' },
    { id: '4', name: 'Launch_Video.mp4', type: 'video', size: '45.2 MB', date: '2024-05-10', url: 'https://storage.googleapis.com/kagglesdsdata/datasets/5086844/8519760/Original_recording5.mp4?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20260116%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260116T215706Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=4d46d9b6b4e0518746efbe6384228ce53f864cecb7edaf8e5f3cb086d0589fb30d4099fb51b6aa3b985d02635dc0ac1ec595f92e3dfd6207cb2aaec2a89f07cde7f899ba4c54163f2d1a1da0ca8a16bf1f45c1ae23c430363c1fe2471bf2e01418cd4147ea8eb2b18c875b33b262e41eb041673132cfea6f0465c8b7a9bc1367fcf48ee5d5f605ff3fb5cf8f013d8c66185b41abe8dc3c9e9ed3df306dd49d48fe6151f4d3144402f25f5e760cdb9bd18535cb4fd2d1136c586dd2dccb7c0c8931da98d56ef55e4ccae1c29954fe6c776a77e1672a0492f1d4d40a28e3d1525700fe47eea50557f3cccf1e3030f0f3724ee010020538e68f687b2caf56bb3708', tags: ['Marketing'], status: 'Indexing' },
    { id: '5', name: 'main.tsx', type: 'code', size: '2 KB', date: '2024-05-05', url: '#', tags: ['Work', 'Dev'], status: 'Ready' },
    { id: '6', name: 'Meeting_Notes.txt', type: 'doc', size: '1 KB', date: '2024-05-01', url: '#', tags: ['Work'], status: 'Ready' },
    { id: '7', name: 'README.md', type: 'markdown', size: '1 KB', date: '2024-05-22', url: readmeDataUrl, tags: ['Doc', 'Dev'], status: 'Ready' },
];

class ApiService {
    private apiUrl: string | undefined;
    private isMock: boolean;

    constructor() {
        // Check for environment variable (supports standard process.env or Vite's import.meta.env)
        const envApiUrl = process.env.VITE_API_URL || (import.meta as any).env?.VITE_API_URL;

        this.apiUrl = envApiUrl;
        this.isMock = !this.apiUrl;

        if (this.isMock) {
            console.log('ApiService: Running in MOCK mode');
        } else {
            console.log(`ApiService: Running in PRODUCTION mode (${this.apiUrl})`);
        }
    }

    // --- Helpers ---

    private async mockDelay(ms: number = 800): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getHeaders(token?: string): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // --- Auth Functions ---

    public async login(identifier: string, password: string): Promise<AuthResponse> {
        console.log(`ApiService: Performing login for ${identifier}`);
        if (this.isMock) {
            await this.mockDelay();
            const user = MOCK_USERS.find(
                u => (u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase()) && u.password === password
            );

            if (user) {
                // Return user without password
                const { password: _, ...safeUser } = user;
                const mockToken = `mock-jwt-token-${Date.now()}`;
                return { success: true, user: { ...safeUser, token: mockToken }, token: mockToken };
            }
            return { success: false, message: 'Invalid credentials' };
        }

        // Production
        try {
            const response = await fetch(`${this.apiUrl}/auth/sign-in`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username: identifier, password }), // Assuming backend handles identifier as username param
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            return { success: true, user: data.user, token: data.token };
        } catch (error: any) {
            return { success: false, message: error.message || 'Network error' };
        }
    }
    public async resetPassword(identifier: string): Promise<ApiResponse> {
        console.log(`ApiService: Performing resetPassword for ${identifier}`);
        if (this.isMock) {
            await this.mockDelay();
            const user = MOCK_USERS.find(
                u => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase()
            );

            if (user) {
                return { success: true };
            }
            return { success: false, message: 'User not found' };
        }

        // Production
        try {
            const response = await fetch(`${this.apiUrl}/auth/reset-password`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username: identifier }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Reset failed');
            }
            return { success: true };
        } catch (error: any) {
            return { success: false, message: error.message || 'Network error' };
        }
    }

    public async logout(token?: string): Promise<boolean> {
        if (this.isMock) {
            return true; // Always succeed in mock
        }

        try {
            await fetch(`${this.apiUrl}/auth/sign-out`, {
                method: 'POST',
                headers: this.getHeaders(token),
            });
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    public async checkSession(token?: string): Promise<boolean> {
        console.log(`ApiService: Performing checkSession`);
        if (this.isMock) {
            return true; // Always succeed in mock
        }

        try {
            await fetch(`${this.apiUrl}/auth/check-session`, {
                method: 'POST',
                headers: this.getHeaders(token),
            });
            return true;
        } catch (error) {
            console.error('checkSession error:', error);
            return false;
        }
    }

    public async changePassword(username: string, oldPassword: string, newPassword: string, token?: string): Promise<AuthResponse> {
        if (this.isMock) {
            await this.mockDelay();
            const userIndex = MOCK_USERS.findIndex(
                u => u.username.toLowerCase() === username.toLowerCase() && u.password === oldPassword
            );

            if (userIndex !== -1) {
                // Update mock database in memory
                MOCK_USERS[userIndex].password = newPassword;
                return { success: true, message: 'Password updated successfully' };
            }
            return { success: false, message: 'Invalid current password' };
        }

        // Production
        try {
            const response = await fetch(`${this.apiUrl}/auth/change-password`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({ username, oldPassword, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to update password' };
            }
            return { success: true, message: 'Password updated' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Network error' };
        }
    }

    // --- Vault Functions ---

    public async getVaultContent(token?: string): Promise<FileItem[]> {
        console.log('ApiService: getVaultContent');
        if (this.isMock) {
            await this.mockDelay(500);
            return [...MOCK_FILES];
        }

        try {
             const response = await fetch(`${this.apiUrl}/vault/content`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('Vault content error:', error);
            return [];
        }
    }

    public async uploadVaultFile(file: File, token?: string): Promise<FileItem | null> {
        console.log('ApiService: uploadVaultFile', file.name);
        if (this.isMock) {
            await this.mockDelay(1500);
            
            // Determine type
            let type: FileItem['type'] = 'unknown';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type === 'application/pdf') type = 'pdf';
            else if (file.type === 'text/markdown' || file.name.endsWith('.md')) type = 'markdown';
            else if (file.type.includes('sheet') || file.type.includes('excel')) type = 'sheet';
            else if (file.type.includes('text') || file.type.includes('code')) type = 'code';
            else if (file.type.includes('document') || file.type.includes('word')) type = 'doc';

            // Randomly assign a tag for demo purposes
            const possibleTags = ['Financial', 'Strategy', 'Personal', 'Work', 'Marketing', 'Legal'];
            const randomTag = possibleTags[Math.floor(Math.random() * possibleTags.length)];

            const newFile: FileItem = {
                id: Date.now().toString(),
                name: file.name,
                type,
                size: `${(file.size / 1024).toFixed(1)} KB`,
                date: new Date().toISOString().split('T')[0],
                url: URL.createObjectURL(file), // Create temporary local URL
                tags: [randomTag],
                status: 'Indexing'
            };
            
            // In a real app with mock state persistence, we'd push to MOCK_FILES here
            // MOCK_FILES.push(newFile); 
            return newFile;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiUrl}/vault/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type header for FormData, browser sets boundary
                },
                body: formData
            });

            const data = await response.json();
            return data.file;
        } catch (error) {
            console.error('Vault upload error:', error);
            return null;
        }
    }
}

export const apiService = new ApiService();