import React, { useState } from 'react';
import { Users, Shield, CheckCircle, XCircle, Search, Building } from 'lucide-react';
import { Organization, Workspace } from '../../types';
import { MOCK_USERS } from '../../data/mock';

interface AdminPanelProps {
  currentOrg: Organization;
  currentWorkspace?: Workspace;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentOrg, currentWorkspace }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // In a real app, this would fetch users belonging to currentOrg
  // For mock, we just display all mock users and simulate "permission" management
  const users = MOCK_USERS.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-2">
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
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                User Management
            </h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-12 gap-4 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">User</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Org Role</div>
                <div className="col-span-3 text-right">Access</div>
            </div>
            
            <div className="overflow-y-auto flex-1">
                {users.map(user => {
                    const userInOrg = user.organizations.find(o => o.id === currentOrg.id);
                    const roleInOrg = userInOrg?.role || 'No Access';

                    return (
                        <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-700/50 items-center hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors">
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.username}</div>
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
                                <button className="text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded transition-colors">
                                    Revoke
                                </button>
                                <button className="text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded transition-colors border border-blue-200 dark:border-blue-800">
                                    Manage
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs text-gray-500 text-center">
                Displaying {users.length} users in {currentOrg.name}
            </div>
        </div>
      </div>
    </div>
  );
};