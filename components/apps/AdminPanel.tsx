import React, { useState } from 'react';
import { Users, Shield, CheckCircle, XCircle, Search, Building, Plus, Filter, X, Check, Mail, User } from 'lucide-react';
import { Organization, Workspace } from '../../types';
import { MOCK_USERS } from '../../data/mock';

interface AdminPanelProps {
  currentOrg: Organization;
  currentWorkspace?: Workspace;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentOrg, currentWorkspace }) => {
  // Local state for users to simulate persistence within session
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<number | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    workspaceIds: [] as number[]
  });

  // --- Handlers ---

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
        username: '',
        email: '',
        workspaceIds: [] // Default to none
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: typeof MOCK_USERS[0]) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    
    // Get user's workspaces for this org
    const userOrgData = user.organizations.find(o => o.id === currentOrg.id);
    const existingWorkspaceIds = userOrgData ? userOrgData.workspaces.map(w => w.id) : [];

    setFormData({
        username: user.username,
        email: user.email,
        workspaceIds: existingWorkspaceIds
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'add') {
        const newUser = {
            id: Date.now().toString(),
            username: formData.username,
            email: formData.email,
            password: 'password', // Default
            avatar: `https://ui-avatars.com/api/?name=${formData.username.replace(' ', '+')}&background=random`,
            role: 'user',
            organizations: [
                {
                    id: currentOrg.id,
                    name: currentOrg.name,
                    role: 'user',
                    workspaces: currentOrg.workspaces.filter(w => formData.workspaceIds.includes(w.id))
                }
            ]
        };
        // In a real app, this would be an API call
        setUsers(prev => [...prev, newUser as any]);
    } else if (modalMode === 'edit' && editingUserId) {
        setUsers(prev => prev.map(u => {
            if (u.id === editingUserId) {
                // Preserve other orgs
                const otherOrgs = u.organizations.filter(o => o.id !== currentOrg.id);
                // Update current org data
                const currentOrgData = u.organizations.find(o => o.id === currentOrg.id) || { id: currentOrg.id, name: currentOrg.name, role: 'user' };
                
                const updatedOrgData = {
                    ...currentOrgData,
                    workspaces: currentOrg.workspaces.filter(w => formData.workspaceIds.includes(w.id))
                };

                return {
                    ...u,
                    username: formData.username,
                    email: formData.email,
                    organizations: [...otherOrgs, updatedOrgData]
                };
            }
            return u;
        }));
    }

    setIsModalOpen(false);
  };

  const toggleWorkspaceSelection = (wkId: number) => {
      setFormData(prev => {
          if (prev.workspaceIds.includes(wkId)) {
              return { ...prev, workspaceIds: prev.workspaceIds.filter(id => id !== wkId) };
          } else {
              return { ...prev, workspaceIds: [...prev.workspaceIds, wkId] };
          }
      });
  };

  const handleRevoke = (userId: string) => {
      if (confirm('Are you sure you want to remove this user from the organization?')) {
          setUsers(prev => prev.filter(u => u.id !== userId));
      }
  };
  
  // Filter Logic
  const filteredUsers = users.filter(u => {
      // Basic Search
      const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Must belong to current Org
      const userOrgData = u.organizations.find(o => o.id === currentOrg.id);
      if (!userOrgData) return false;

      // Workspace Filter
      if (workspaceFilter !== 'all') {
          return userOrgData.workspaces.some(w => w.id === workspaceFilter);
      }

      return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 relative">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700 p-6 shadow-sm flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Shield size={24} />
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
        
        {/* Add User Button */}
        <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
            <Plus size={16} />
            Add User
        </button>
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
                {/* Workspace Filter */}
                {currentOrg.workspaces.length > 1 && (
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Filter size={14} />
                        </div>
                        <select
                            value={workspaceFilter}
                            onChange={(e) => setWorkspaceFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="pl-9 pr-8 py-2 bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="all">All Workspaces</option>
                            {currentOrg.workspaces.map(wk => (
                                <option key={wk.id} value={wk.id}>{wk.name}</option>
                            ))}
                        </select>
                         {/* Custom Arrow for select */}
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                             <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
                         </div>
                    </div>
                )}

                {/* Search */}
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
                <div className="col-span-2">Org Role</div>
                <div className="col-span-3 text-right">Access</div>
            </div>
            
            <div className="overflow-y-auto flex-1">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                        <Users size={48} className="mb-2 opacity-20" />
                        <p>No users found matching your filters.</p>
                    </div>
                ) : (
                    filteredUsers.map(user => {
                        const userInOrg = user.organizations.find(o => o.id === currentOrg.id);
                        const roleInOrg = userInOrg?.role || 'No Access';

                        return (
                            <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-700/50 items-center hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{user.username}</div>
                                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                                    </div>
                                </div>
                                <div className="col-span-3 text-sm text-gray-600 dark:text-gray-300 truncate">
                                    {user.email}
                                </div>
                                <div className="col-span-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                        roleInOrg === 'admin' 
                                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                                        : roleInOrg === 'user' 
                                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                        {roleInOrg.toUpperCase()}
                                    </span>
                                </div>
                                <div className="col-span-3 flex justify-end gap-2">
                                    <button 
                                        onClick={() => handleRevoke(user.id)}
                                        className="text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded transition-colors"
                                    >
                                        Revoke
                                    </button>
                                    <button 
                                        onClick={() => handleOpenEdit(user)}
                                        className="text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded transition-colors border border-blue-200 dark:border-blue-800"
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs text-gray-500 text-center flex justify-between items-center px-6 shrink-0">
                <span>Displaying {filteredUsers.length} users</span>
                {workspaceFilter !== 'all' && (
                    <span>Filtered by Workspace: {currentOrg.workspaces.find(w => w.id === workspaceFilter)?.name}</span>
                )}
            </div>
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
              <div 
                  className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col max-h-[85vh]"
                  onClick={e => e.stopPropagation()}
              >
                  {/* Modal Body (Wraps Header, Content, Footer to ensure full height) */}
                  <form onSubmit={handleSaveUser} className="flex flex-col h-full min-h-0">
                      
                      {/* Modal Header */}
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

                      {/* Content */}
                      <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                          
                          {/* Name Input */}
                          <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <User size={14} /> Name
                              </label>
                              <input 
                                  type="text" 
                                  required
                                  value={formData.username}
                                  onChange={e => setFormData({...formData, username: e.target.value})}
                                  placeholder="e.g. John Doe"
                                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                          </div>

                          {/* Email Input */}
                          <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <Mail size={14} /> Email Address
                              </label>
                              <input 
                                  type="email" 
                                  required
                                  value={formData.email}
                                  onChange={e => setFormData({...formData, email: e.target.value})}
                                  placeholder="e.g. john@company.com"
                                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                          </div>

                          {/* Workspace Selection */}
                          <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <Building size={14} /> Workspaces
                              </label>
                              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                                  {currentOrg.workspaces.length === 0 ? (
                                      <div className="p-3 text-sm text-gray-400 italic">No workspaces available in this organization.</div>
                                  ) : (
                                      currentOrg.workspaces.map(wk => {
                                          const isSelected = formData.workspaceIds.includes(wk.id);
                                          return (
                                              <div 
                                                  key={wk.id}
                                                  onClick={() => toggleWorkspaceSelection(wk.id)}
                                                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                              >
                                                  <span className={`text-sm ${isSelected ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                      {wk.name}
                                                  </span>
                                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                      isSelected 
                                                      ? 'bg-blue-500 border-blue-500 text-white' 
                                                      : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-transparent'
                                                  }`}>
                                                      {isSelected && <Check size={12} />}
                                                  </div>
                                              </div>
                                          );
                                      })
                                  )}
                              </div>
                              <p className="text-[10px] text-gray-400">Selected users will only have access to checked workspaces.</p>
                          </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0">
                          <button 
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                          >
                              {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};