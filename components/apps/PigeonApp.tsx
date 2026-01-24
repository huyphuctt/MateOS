
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Send, Search, User as UserIcon, MoreVertical, Phone, Video, 
    Loader2, MessageSquare, Plus, Users, Image as ImageIcon, 
    FileText, Paperclip, Check, CheckCheck, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { User, Message, Conversation, FileItem } from '../../types';

export const PigeonApp: React.FC = () => {
    const { user, token } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    
    // New Chat / Group Modal
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [selectedUsersForNewChat, setSelectedUsersForNewChat] = useState<User[]>([]);
    const [newGroupName, setNewGroupName] = useState('');

    // File Upload
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mentions
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionPosition, setMentionPosition] = useState<{top: number, left: number} | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Data Fetching ---

    const fetchConversations = async () => {
        if(!token || !user) return;
        const convs = await apiService.getConversations(token, user.id);
        setConversations(convs.sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
        setLoadingConvs(false);
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Poll for updates
        return () => clearInterval(interval);
    }, [token, user]);

    useEffect(() => {
        if (selectedConvId && token) {
            setLoadingMessages(true);
            apiService.getMessages(token, selectedConvId)
                .then(setMessages)
                .finally(() => setLoadingMessages(false));
            
            // Poll messages for active chat
            const interval = setInterval(() => {
                 apiService.getMessages(token, selectedConvId).then(setMessages);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedConvId, token]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- Search Users for New Chat ---
    useEffect(() => {
        if(isNewChatOpen && token) {
            apiService.searchUsers(token, userSearchTerm).then(users => {
                setFoundUsers(users.filter(u => u.id !== user?.id));
            });
        }
    }, [userSearchTerm, isNewChatOpen, token, user?.id]);


    // --- Handlers ---

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputText.trim() && !attachment) || !selectedConvId || !user || !token) return;

        setSending(true);
        try {
            const newMsg = await apiService.sendMessage(token, selectedConvId, inputText, user.id, attachment || undefined);
            if (newMsg) {
                setMessages(prev => [...prev, newMsg]);
                setInputText('');
                setAttachment(null);
                fetchConversations(); // Update last message in list
            }
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSending(false);
        }
    };

    const handleCreateConversation = async () => {
        if(selectedUsersForNewChat.length === 0 || !token || !user) return;

        const userIds = [user.id, ...selectedUsersForNewChat.map(u => u.id)];
        const title = selectedUsersForNewChat.length > 1 ? (newGroupName || 'New Group') : undefined;

        const newId = await apiService.createConversation(token, userIds, title);
        if(newId) {
            await fetchConversations();
            setSelectedConvId(newId);
            setIsNewChatOpen(false);
            setSelectedUsersForNewChat([]);
            setNewGroupName('');
        }
    };

    const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Detect @ mention trigger
        if (e.key === '@') {
             // Simple detection, could be improved with caret position logic
             setMentionQuery('');
             // Mock position logic
             setMentionPosition({ top: -100, left: 20 });
        } else if (mentionQuery !== null) {
            if (e.key === 'Escape' || e.key === ' ') {
                setMentionQuery(null);
            } else if (e.key.length === 1) {
                // simple append
            }
        }
    };

    const handleMentionSelect = (userName: string) => {
        setInputText(prev => prev + userName + ' ');
        setMentionQuery(null);
        inputRef.current?.focus();
    };

    // --- Render Helpers ---

    const getConversationDisplay = (conv: Conversation) => {
        if (conv.is_group) {
            return {
                title: conv.title || 'Group Chat',
                avatar: null, // Default group icon
                isGroup: true
            };
        }
        // Find the other user
        const otherUser = conv.users.find(u => u.id !== user?.id) || conv.users[0];
        return {
            title: otherUser?.name || 'Unknown User',
            avatar: otherUser?.avatar,
            isGroup: false
        };
    };

    const activeConv = conversations.find(c => c.id === selectedConvId);
    const activeConvDisplay = activeConv ? getConversationDisplay(activeConv) : null;
    
    // Get members for mention list
    const activeMembers = activeConv ? activeConv.users.filter(u => u.id !== user?.id) : [];

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-full bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 relative">
            
            {/* NEW CHAT MODAL */}
            {isNewChatOpen && (
                <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#2d2d2d] w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold">New Message</h3>
                            <button onClick={() => setIsNewChatOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X size={18}/></button>
                        </div>
                        <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
                             {/* Group Name Input if > 1 selected */}
                             {selectedUsersForNewChat.length > 1 && (
                                 <input 
                                    type="text"
                                    placeholder="Group Name (Optional)"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm"
                                 />
                             )}
                             
                             {/* Search */}
                             <div className="relative">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                 <input 
                                    type="text" 
                                    placeholder="Search people..."
                                    value={userSearchTerm}
                                    onChange={e => setUserSearchTerm(e.target.value)}
                                    className="w-full pl-9 p-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                 />
                             </div>

                             {/* Selected Pills */}
                             {selectedUsersForNewChat.length > 0 && (
                                 <div className="flex flex-wrap gap-2">
                                     {selectedUsersForNewChat.map(u => (
                                         <span key={u.id} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full flex items-center gap-1">
                                             {u.name}
                                             <button onClick={() => setSelectedUsersForNewChat(prev => prev.filter(pu => pu.id !== u.id))}><X size={12}/></button>
                                         </span>
                                     ))}
                                 </div>
                             )}

                             {/* List */}
                             <div className="flex-1 overflow-y-auto">
                                 {foundUsers.map(u => {
                                     const isSelected = selectedUsersForNewChat.some(su => su.id === u.id);
                                     return (
                                         <button 
                                            key={u.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedUsersForNewChat(prev => prev.filter(pu => pu.id !== u.id));
                                                else setSelectedUsersForNewChat(prev => [...prev, u]);
                                            }}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                                         >
                                             <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                 {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-2"/>}
                                             </div>
                                             <span className="flex-1 text-left text-sm font-medium">{u.name}</span>
                                             {isSelected && <Check size={16} className="text-blue-500" />}
                                         </button>
                                     )
                                 })}
                             </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                             <button 
                                disabled={selectedUsersForNewChat.length === 0}
                                onClick={handleCreateConversation}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
                             >
                                 {selectedUsersForNewChat.length > 1 ? 'Create Group' : 'Start Chat'}
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-[#1a1a1a] shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                             <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                                 <Send size={16} className="-rotate-45 translate-x-0.5" />
                             </div>
                             Pigeon
                        </h2>
                        <button onClick={() => setIsNewChatOpen(true)} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:opacity-80 transition-opacity">
                            <Plus size={18} />
                        </button>
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search conversations..." 
                            className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {loadingConvs ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">
                            No conversations yet.<br/>Start a new chat above!
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const info = getConversationDisplay(conv);
                            const isActive = selectedConvId === conv.id;
                            
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConvId(conv.id)}
                                    className={`w-full p-3 flex items-center gap-3 hover:bg-white dark:hover:bg-white/5 transition-colors text-left border-l-4 ${isActive ? 'bg-white dark:bg-white/5 border-blue-500 shadow-sm' : 'border-transparent'}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                                        {info.avatar ? (
                                            <img src={info.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : info.isGroup ? (
                                            <Users size={20} className="text-gray-500" />
                                        ) : (
                                            <UserIcon size={20} className="text-gray-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{info.title}</h3>
                                            <span className="text-[10px] text-gray-400">{formatTime(conv.updated_at)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {conv.last_message}
                                        </p>
                                    </div>
                                    {conv.unread_count > 0 && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                                            {conv.unread_count}
                                        </div>
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {activeConv && activeConvDisplay ? (
                <div className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-black/5 relative">
                    
                    {/* Header */}
                    <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-[#1e1e1e] shadow-sm z-10">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/10">
                                {activeConvDisplay.avatar ? (
                                    <img src={activeConvDisplay.avatar} alt="" className="w-full h-full object-cover" />
                                ) : activeConvDisplay.isGroup ? (
                                    <Users size={20} className="text-gray-500" />
                                ) : (
                                    <UserIcon size={20} className="text-gray-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{activeConvDisplay.title}</h3>
                                {activeConvDisplay.isGroup ? (
                                    <span className="text-xs text-gray-500">{activeConv.users.length} members</span>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                        <span className="text-xs text-gray-500">Online</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><Phone size={18} /></button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><Video size={18} /></button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><MoreVertical size={18} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {loadingMessages ? (
                             <div className="flex justify-center h-full items-center"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 opacity-60">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                    <MessageSquare size={32} />
                                </div>
                                <p>Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isMe = msg.sender_id === user?.id;
                                const sender = activeConv.users.find(u => u.id === msg.sender_id);
                                
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!isMe && activeConv.is_group && (
                                            <span className="text-[10px] text-gray-500 ml-2 mb-1">{sender?.name}</span>
                                        )}
                                        <div className={`max-w-[70%] rounded-2xl p-3 text-sm shadow-sm ${
                                            isMe 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-600'
                                        }`}>
                                            {/* Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mb-2 space-y-1">
                                                    {msg.attachments.map(file => (
                                                        <div key={file.id} className={`flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-gray-100 dark:bg-black/20'}`}>
                                                            {file.type === 'image' ? <ImageIcon size={16}/> : <FileText size={16}/>}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="truncate font-medium text-xs">{file.name}</div>
                                                                <div className="text-[10px] opacity-70">{file.size}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Text */}
                                            {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                            
                                            {/* Meta */}
                                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                                                {isMe && (
                                                    msg.status === 'read' ? <CheckCheck size={12} className="opacity-90"/> : <Check size={12} className="opacity-70"/>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Mentions Popover */}
                    {mentionQuery !== null && (
                        <div 
                            className="absolute bottom-20 left-6 bg-white dark:bg-[#2d2d2d] rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 w-48 overflow-hidden z-20 animate-in slide-in-from-bottom-2 fade-in duration-200"
                        >
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-white/5">Members</div>
                            {activeMembers.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => handleMentionSelect(`@${member.name}`)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-800 dark:text-gray-200 flex items-center gap-2"
                                >
                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                        {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover"/> : null}
                                    </div>
                                    {member.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-700">
                        {/* Attachment Preview */}
                        {attachment && (
                            <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 dark:bg-white/5 rounded-lg w-fit">
                                <FileText size={16} className="text-blue-500" />
                                <span className="text-xs font-medium">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)} className="p-0.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full"><X size={12}/></button>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                <Paperclip size={20} />
                            </button>
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                            />

                            <input 
                                ref={inputRef}
                                type="text" 
                                value={inputText}
                                onChange={e => {
                                    setInputText(e.target.value);
                                    if(mentionQuery !== null) setMentionQuery(e.target.value); // simple tracking
                                }}
                                onKeyDown={handleInputKey}
                                placeholder="Type a message... (@ to mention)" 
                                className="flex-1 bg-gray-100 dark:bg-black/20 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-black/40 transition-all text-sm max-h-32"
                            />
                            <button 
                                type="submit"
                                disabled={(!inputText.trim() && !attachment) || sending}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-full transition-colors shadow-sm flex items-center justify-center shrink-0"
                            >
                                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 dark:bg-black/10">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <Send size={40} className="-rotate-45 translate-x-1 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Welcome to Pigeon</h3>
                    <p className="max-w-xs text-center text-sm text-gray-500">
                        Secure messaging for your organization.
                        <br/>
                        Create a group, share files, and stay connected.
                    </p>
                    <button 
                        onClick={() => setIsNewChatOpen(true)}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 transform duration-200"
                    >
                        Start a Conversation
                    </button>
                </div>
            )}
        </div>
    );
};
