import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, ShieldUser, Search, Building, Plus, X, Mail, UserIcon, Layers, Loader2, ChevronDown } from 'lucide-react';
import Select from 'react-select';
import { AdminConsoleData, Organization, Workspace } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface AdminConsoleProps {
    currentOrg: Organization;
    currentWorkspace?: Workspace;
}

type AdminUser = AdminConsoleData['users'][0];

export const AdminConsole: React.FC<AdminConsoleProps> = ({ currentOrg, currentWorkspace }) => {
    const { token, activeOrg } = useAuth();
    const [data, setData] = useState<AdminConsoleData>({ workspaces: [], users: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [workspaceFilter, setWorkspaceFilter] = useState<number | 'all'>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        workspaces: [] as { id: number; role: string }[]
    });
    
    // Workspace Creation Form State
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

    const isInitialMount = useRef(true);
    const lastFetchedToken = useRef<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    
    const loadData = useCallback(async (force = false) => {
        if (!force && token === lastFetchedToken.current && data.users.length > 0) {
            return;
        }
        setLoading(true);
        lastFetchedToken.current = token;
        try {
            const fetchedData = await apiService.adminConsole(token || '', activeOrg!.id);
            setData(fetchedData);
        } catch (e) {
            console.error("Failed to load admin content");
        } finally {
            setLoading(false);
        }
    }, [token, data.users.length, activeOrg]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadData();
        } else if (token !== lastFetchedToken.current) {
            loadData();
        }
    }, [loadData, token]);

    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({
            username: '',
            email: '',
            workspaces: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: AdminUser) => {
        setModalMode('edit');
        setEditingUserId(user.id);

        const userWorkspaces = user.workspaces ? user.workspaces.map(w => ({ id: w.id, role: w.role })) : [];

        setFormData({
            username: user.name,
            email: user.email,
            workspaces: userWorkspaces
        });
        setIsModalOpen(true);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        setIsModalOpen(false);
    };

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim() || !activeOrg) return;

        setIsCreatingWorkspace(true);
        try {
            const newWorkspace = await apiService.createWorkspace(token || '', activeOrg.id, newWorkspaceName);
            if (newWorkspace) {
                setData(prev => ({
                    ...prev,
                    workspaces: [...prev.workspaces, newWorkspace]
                }));
                setIsWorkspaceModalOpen(false);
                setNewWorkspaceName('');
            }
        } catch (error) {
            console.error('Failed to create workspace', error);
        } finally {
            setIsCreatingWorkspace(false);
        }
    };

    const handleWorkspaceRoleChange = (wkId: number, role: string) => {
        setFormData(prev => {
            const exists = prev.workspaces.find(w => w.id === wkId);
            if (role === 'none') {
                return { ...prev, workspaces: prev.workspaces.filter(w => w.id !== wkId) };
            }
            if (exists) {
                return {
                    ...prev,
                    workspaces: prev.workspaces.map(w => w.id === wkId ? { ...w, role } : w)
                };
            } else {
                return {
                    ...prev,
                    workspaces: [...prev.workspaces, { id: wkId, role }]
                };
            }
        });
    };

    const filterOptions = [
        { value: 'all', label: 'All Workspaces' },
        ...(data.workspaces || []).map(wk => ({ value: wk.id, label: wk.name }))
    ];

    const roleOptions = [
        { value: 'none', label: 'No Access' },
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'viewer', label: 'Viewer' }
    ];

    const currentFilterOption = filterOptions.find(opt => opt.value === workspaceFilter);
    const availableWorkspaces = data.workspaces || [];

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 relative">

            {/* Header */}
            <div className="bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700 p-6 shadow-sm flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                        <ShieldUser size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Admin Console</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Building size={12} />
                            {currentOrg.name}
                            {currentWorkspace && <span className="text-gray-400">/ {currentWorkspace.name}</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsWorkspaceModalOpen(true)}
                        className="flex items-center gap-2 bg-white dark:bg-[#3d3d3d] hover:bg-gray-50 dark:hover:bg-[#4d4d4d] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Layers size={16} />
                        Add Workspace
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Add User
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">

                {/* Toolbar */}
                <div className="flex flex-wrap gap-4 justify-between items-center mb-6 shrink-0">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users size={18} className="text-blue-500" />
                        User Management
                    </h2>

                    <div className="flex items-center gap-3">
                        {availableWorkspaces.length > 0 && (
                            <div className="w-[200px]">
                                <Select
                                    value={currentFilterOption}
                                    onChange={(option: any) => setWorkspaceFilter(option?.value)}
                                    options={filterOptions}
                                    unstyled
                                    classNames={{
                                        control: (state) => `pl-2 py-1 bg-white dark:bg-black/20 border rounded-md text-sm transition-all cursor-pointer flex items-center justify-between ${state.isFocused
                                                ? 'border-blue-500 ring-2 ring-blue-500/50'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                            }`,
                                        menu: () => "bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg mt-1 overflow-hidden z-50",
                                        option: (state) => `px-3 py-2 text-sm cursor-pointer ${state.isSelected
                                                ? 'bg-blue-600 text-white'
                                                : state.isFocused
                                                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100'
                                                    : 'text-gray-700 dark:text-gray-300'
                                            }`,
                                        singleValue: () => "text-gray-900 dark:text-gray-100",
                                        dropdownIndicator: () => "text-gray-400 p-1"
                                    }}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                    }}
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">
                        <div className="col-span-4">User</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-2">Organization Role</div>
                        <div className="col-span-2">Workspaces</div>
                        <div className="col-span-1 text-right">Access</div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                             <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                                <Loader2 size={32} className="animate-spin mb-2" />
                                <p>Loading users...</p>
                            </div>
                        ) : !data || !data.users || data.users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                                <Users size={48} className="mb-2 opacity-20" />
                                <p>No users found matching your filters.</p>
                            </div>
                        ) : (
                            data.users.map(user => {
                                const roleInOrg = user?.role || 'No Access';
                                return (
                                    <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-700/50 items-center hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors">
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
                                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{user.name}</div>
                                                <div className="text-xs text-gray-500">ID: {user.id}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-sm text-gray-600 dark:text-gray-300 truncate">
                                            {user.email}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${roleInOrg === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                    : roleInOrg === 'user'
                                                        ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {roleInOrg.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="flex flex-wrap gap-1">
                                                {user.workspaces?.map((wk) => (
                                                    <span key={wk.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                        {(availableWorkspaces.find(w => w.id === wk.id)?.name) || wk.id} ({wk.role})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(user)}
                                                className="text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded transition-colors border border-blue-200 dark:border-blue-800"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs text-gray-500 text-center flex justify-between items-center px-6 shrink-0">
                        <span>Displaying {data.users?.length || 0} users</span>
                        {workspaceFilter !== 'all' && (
                            <span>Filtered by Workspace: {availableWorkspaces.find(w => w.id === workspaceFilter)?.name}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* --- User Modal --- */}
            {isModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div
                        className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col max-h-[90%]"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleSaveUser} className="flex flex-col h-full min-h-0">

                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {modalMode === 'add' ? 'Add New User' : 'Manage User'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            {/* SCROLLABLE FORM AREA */}
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <UserIcon size={14} /> Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="e.g. John Doe"
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="e.g. john@company.com"
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <Building size={14} /> Workspace Access & Roles
                                    </label>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                                        {availableWorkspaces.length === 0 ? (
                                            <div className="p-3 text-sm text-gray-400 italic">No workspaces available in this organization.</div>
                                        ) : (
                                            availableWorkspaces.map(wk => {
                                                const userWorkspace = formData.workspaces.find(w => w.id === wk.id);
                                                const currentRole = userWorkspace ? userWorkspace.role : 'none';
                                                const currentRoleOption = roleOptions.find(opt => opt.value === currentRole);

                                                return (
                                                    <div
                                                        key={wk.id}
                                                        className={`flex items-center justify-between p-3 transition-colors ${currentRole !== 'none' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                                    >
                                                        <div className="flex flex-col min-w-0 mr-4">
                                                            <span className={`text-sm font-bold truncate ${currentRole !== 'none' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                {wk.name}
                                                            </span>
                                                        </div>
                                                        <div className="w-[140px] shrink-0">
                                                            <Select
                                                                value={currentRoleOption}
                                                                onChange={(option: any) => handleWorkspaceRoleChange(wk.id, option?.value)}
                                                                options={roleOptions}
                                                                unstyled
                                                                classNames={{
                                                                    control: (state) => `pl-3 pr-1 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                                                                        currentRole === 'none'
                                                                        ? 'bg-white dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-500'
                                                                        : 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                                    } ${state.isFocused ? 'ring-2 ring-blue-500/50' : ''}`,
                                                                    menu: () => "bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded-md shadow-xl mt-1 overflow-hidden z-50",
                                                                    option: (state) => `px-3 py-2 text-xs font-semibold cursor-pointer ${
                                                                        state.isSelected
                                                                        ? 'bg-blue-600 text-white'
                                                                        : state.isFocused
                                                                            ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100'
                                                                            : 'text-gray-700 dark:text-gray-300'
                                                                    }`,
                                                                    singleValue: () => currentRole === 'none' ? "text-gray-500 dark:text-gray-400" : "text-white",
                                                                    dropdownIndicator: () => `p-0.5 ${currentRole === 'none' ? 'text-gray-400' : 'text-white'}`
                                                                }}
                                                                menuPortalTarget={document.body}
                                                                styles={{
                                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">Grant specific permissions per workspace. "No Access" removes the user from that workspace.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                                >
                                    {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Add Workspace Modal --- */}
            {isWorkspaceModalOpen && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div
                        className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-600 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleCreateWorkspace}>
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    New Workspace
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsWorkspaceModalOpen(false)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <Layers size={14} /> Workspace Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newWorkspaceName}
                                        onChange={e => setNewWorkspaceName(e.target.value)}
                                        placeholder="e.g. Marketing, Development"
                                        autoFocus
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsWorkspaceModalOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    disabled={isCreatingWorkspace}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                                    className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                >
                                    {isCreatingWorkspace && <Loader2 size={14} className="animate-spin" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};