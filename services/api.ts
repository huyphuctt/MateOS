
import { MOCK_USERS, MOCK_FILES, MOCK_ADMIN_CONSOLE, RECENT_ITEMS, MOCK_MESSAGES, MOCK_CONVERSATIONS } from '../data/mock';
import { User, FileItem, Organization, AdminConsoleData, Workspace, RecentItem, Message, Conversation } from '../types';
import { MessageSquare } from 'lucide-react';

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

    // --- Admin Console ---
    public async adminConsole(token: string, organization_id: number): Promise<AdminConsoleData> {
        console.log(`ApiService: adminConsole for org ${organization_id}`);
        if (this.isMock) {
            await this.mockDelay(500);
            return {...MOCK_ADMIN_CONSOLE} as AdminConsoleData;
        }

        try {
             const response = await fetch(`${this.apiUrl}/admin/${organization_id}/console`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Vault content error:', error);
            return { workspaces: [], users: [] };
        }
    }

    public async createWorkspace(token: string, organization_id: number, name: string): Promise<Workspace | null> {
        console.log(`ApiService: createWorkspace '${name}' for org ${organization_id}`);
        if (this.isMock) {
            await this.mockDelay(800);
            return {
                id: Date.now(),
                name: name
            };
        }

        try {
            const response = await fetch(`${this.apiUrl}/admin/${organization_id}/workspaces`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            return data.workspace;
        } catch (error) {
            console.error('Create workspace error:', error);
            return null;
        }
    }

    // --- Vault Functions ---

    public async vaultContents(token: string, workspace_id: number): Promise<FileItem[]> {
        console.log('ApiService: vaultContents');
        if (this.isMock) {
            await this.mockDelay(500);
            return [...MOCK_FILES];
        }

        try {
             const response = await fetch(`${this.apiUrl}/vault/${workspace_id}/contents`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Vault content error:', error);
            return [];
        }
    }

    public async vaultRefresh(token: string, fileId: string): Promise<FileItem | null> {
        console.log(`ApiService: vaultRefresh for item ${fileId}`);
        if (this.isMock) {
            await this.mockDelay(300);
            const file = MOCK_FILES.find(f => f.id === fileId);
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
             const response = await fetch(`${this.apiUrl}/vault/${fileId}/refresh`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data || null;
        } catch (error) {
            console.error('Vault refresh error:', error);
            return null;
        }
    }

    public async uploadVaultFile(file: File, workspace_id: number, token?: string): Promise<FileItem | null> {
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

            const response = await fetch(`${this.apiUrl}/vault/${workspace_id}/upload`, {
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

    // --- Notifications & Recent Items ---

    public async getNotifications(token: string): Promise<RecentItem[]> {
        console.log('ApiService: getNotifications');
        if (this.isMock) {
            await this.mockDelay(500);
            // Return system or calendar events as notifications
            return RECENT_ITEMS.filter(i => ['system', 'calendar'].includes(i.type));
        }

        try {
             const response = await fetch(`${this.apiUrl}/notifications/refresh`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('getNotifications error:', error);
            return [];
        }
    }

    public async getRecentItems(token: string): Promise<RecentItem[]> {
        console.log('ApiService: getRecentItems');
        if (this.isMock) {
            await this.mockDelay(500);
            // Return files or images as recent items
            return RECENT_ITEMS.filter(i => ['file', 'image'].includes(i.type));
        }

        try {
             const response = await fetch(`${this.apiUrl}/recently/refresh`, {
                headers: this.getHeaders(token),
            });
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('getRecentItems error:', error);
            return [];
        }
    }

    // --- Pigeon (Messaging) Full Feature Set ---

    // 1. List user conversations
    public async getConversations(token: string, userId: string): Promise<Conversation[]> {
        console.log('ApiService: getConversations');
        if (this.isMock) {
            await this.mockDelay(500);
            return MOCK_CONVERSATIONS.filter(c => c.users.some(u => u.id === userId));
        }
        try {
            const response = await fetch(`${this.apiUrl}/api/conversations`, { headers: this.getHeaders(token) });
            return await response.json();
        } catch(e) { return []; }
    }

    // 2. Create conversation
    public async createConversation(token: string, userIds: string[], title?: string): Promise<number | null> {
         console.log('ApiService: createConversation', userIds, title);
         if (this.isMock) {
             await this.mockDelay(600);
             const newId = Date.now();
             const users = MOCK_USERS.filter(u => userIds.includes(u.id));
             
             // Check if it's a group or 1-1
             const isGroup = userIds.length > 2; // sender + >1 receiver

             const newConv: Conversation = {
                 id: newId,
                 title: title || '',
                 is_group: isGroup,
                 last_message: 'Conversation started',
                 unread_count: 0,
                 updated_at: new Date().toISOString(),
                 users: users as any
             };
             MOCK_CONVERSATIONS.push(newConv);
             return newId;
         }
         try {
             const response = await fetch(`${this.apiUrl}/api/conversations`, {
                 method: 'POST',
                 headers: this.getHeaders(token),
                 body: JSON.stringify({ user_ids: userIds, title })
             });
             const data = await response.json();
             return data.conversation_id;
         } catch(e) { return null; }
    }

    // 6. Fetch messages
    public async getMessages(token: string, conversationId: number): Promise<Message[]> {
        console.log(`ApiService: getMessages for conv ${conversationId}`);
        if (this.isMock) {
            await this.mockDelay(300);
            return MOCK_MESSAGES
                .filter(m => m.conversation_id === conversationId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
         try {
            const response = await fetch(`${this.apiUrl}/api/conversations/${conversationId}/messages`, { headers: this.getHeaders(token) });
            const json = await response.json();
            return json.data;
        } catch(e) { return []; }
    }

    // 7. Send message (with file support)
    public async sendMessage(token: string, conversationId: number, content: string, senderId: string, file?: File): Promise<Message | null> {
         console.log(`ApiService: sendMessage to ${conversationId}`);
         if (this.isMock) {
             await this.mockDelay(400);
             
             let attachments: FileItem[] = [];
             if (file) {
                 // Simulate file upload
                 attachments.push({
                    id: Date.now().toString() + '-file',
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : 'doc',
                    size: '1.2 MB',
                    date: new Date().toISOString(),
                    url: URL.createObjectURL(file),
                    status: 'Ready'
                 });
             }

             const newMessage: Message = {
                 id: Date.now().toString(),
                 conversation_id: conversationId,
                 sender_id: senderId,
                 content,
                 timestamp: new Date().toISOString(),
                 status: 'sent',
                 attachments: attachments.length > 0 ? attachments : undefined
             };
             
             MOCK_MESSAGES.push(newMessage);
             
             // Update conversation last message
             const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
             if (conv) {
                 conv.last_message = file ? `Sent a file: ${file.name}` : content;
                 conv.updated_at = newMessage.timestamp;
             }

             return newMessage;
         }
         try {
             const formData = new FormData();
             formData.append('conversation_id', conversationId.toString());
             formData.append('message', content); // This mocks the structure in the prompt slightly for FormData compatibility
             if(file) formData.append('file', file);
             
             const response = await fetch(`${this.apiUrl}/api/messages`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${token}` }, // No content-type for FormData
                 body: formData
             });
             const data = await response.json();
             return data.message;
         } catch(e) { return null; }
    }
    
    // Search Users for New Chat
    public async searchUsers(token: string, query: string): Promise<User[]> {
        console.log(`ApiService: searchUsers ${query}`);
        if(this.isMock) {
             await this.mockDelay(300);
             if(!query) return MOCK_USERS as unknown as User[];
             return MOCK_USERS.filter(u => 
                 u.name.toLowerCase().includes(query.toLowerCase()) || 
                 u.email.toLowerCase().includes(query.toLowerCase())
             ) as unknown as User[];
        }
        try {
            const response = await fetch(`${this.apiUrl}/api/users?search=${query}`, { headers: this.getHeaders(token) });
            return await response.json();
        } catch(e) { return []; }
    }
}

export const apiService = new ApiService();
