import { MOCK_USERS, MOCK_FILES } from '../data/mock';
import { User, FileItem, Organization } from '../types';

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

    public async login(email: string, password: string): Promise<AuthResponse> {
        console.log(`ApiService: Performing login for ${email}`);
        if (this.isMock) {
            await this.mockDelay();
            const user = MOCK_USERS.find(
                u => (u.name.toLowerCase() === email.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()) && u.password === password
            );

            if (user) {
                // Return user without password
                const { password: _, ...safeUser } = user;
                const mockToken = `mock-jwt-token-${Date.now()}`;
                // Fix: Cast to any then User to resolve assignment compatibility issues with the inferred mock object.
                return { success: true, user: { ...safeUser, token: mockToken } as any as User, token: mockToken };
            }
            return { success: false, message: 'Invalid credentials' };
        }

        // Production
        try {
            const response = await fetch(`${this.apiUrl}/auth/sign-in`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, password }), // Assuming backend handles identifier as username param
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
    public async resetPassword(email: string): Promise<ApiResponse> {
        console.log(`ApiService: Performing resetPassword for ${email}`);
        if (this.isMock) {
            await this.mockDelay();
            const user = MOCK_USERS.find(
                u => u.name.toLowerCase() === email.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
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
                body: JSON.stringify({ email }),
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

    public async changePassword(email: string, oldPassword: string, newPassword: string, token?: string): Promise<AuthResponse> {
        if (this.isMock) {
            await this.mockDelay();
            const userIndex = MOCK_USERS.findIndex(
                u => u.email.toLowerCase() === email.toLowerCase() && u.password === oldPassword
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
                body: JSON.stringify({ email, oldPassword, newPassword }),
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

    public async vaultContents(token: string): Promise<FileItem[]> {
        console.log('ApiService: vaultContents');
        if (this.isMock) {
            await this.mockDelay(500);
            return [...MOCK_FILES];
        }

        try {
             const response = await fetch(`${this.apiUrl}/vault/contents`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Vault content error:', error);
            return [];
        }
    }

    public async vaultRefresh(token: string, id: string): Promise<FileItem | null> {
        console.log(`ApiService: vaultRefresh for item ${id}`);
        if (this.isMock) {
            await this.mockDelay(300);
            const file = MOCK_FILES.find(f => f.id === id);
            if (file) {
                // In mock, if it was Indexing, 50% chance to become Ready on refresh
                return { 
                    ...file, 
                    status: file.status === 'Indexing' && Math.random() > 0.5 ? 'Ready' : file.status 
                };
            }
            return null;
        }

        try {
             const response = await fetch(`${this.apiUrl}/vault/${id}/refresh`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data || null;
        } catch (error) {
            console.error('Vault refresh error:', error);
            return null;
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