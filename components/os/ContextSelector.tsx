import React, { useState, useEffect } from 'react';
import { Building, Layers, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { User, Organization, Workspace } from '../../types';

interface ContextSelectorProps {
  user: User;
  onComplete: (orgId: number, wkId: number) => void;
  savedOrgId: number | null;
  savedWorkspaceId: number | null;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({ 
  user, 
  onComplete, 
  savedOrgId, 
  savedWorkspaceId 
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<number>(() => {
    // Default to saved, or first org
    if (savedOrgId && user.organizations.some(o => o.id === savedOrgId)) return savedOrgId;
    return user.organizations[0]?.id;
  });

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number>(() => {
    // We will validate this effect-side mostly, but initial state helps
    return savedWorkspaceId || 0;
  });

  // Get current Org Object
  const selectedOrg = user.organizations.find(o => o.id === selectedOrgId) || user.organizations[0];
  
  // Update workspace selection when Org changes
  useEffect(() => {
    const org = user.organizations.find(o => o.id === selectedOrgId);
    if (org) {
       // If the previously selected workspace exists in this org, keep it. Otherwise default to first.
       const validWorkspace = org.workspaces.find(w => w.id === selectedWorkspaceId);
       if (!validWorkspace && org.workspaces.length > 0) {
           setSelectedWorkspaceId(org.workspaces[0].id);
       }
    }
  }, [selectedOrgId, user.organizations, selectedWorkspaceId]);

  const handleContinue = () => {
    onComplete(selectedOrgId, selectedWorkspaceId);
  };

  return (
    <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 backdrop-blur-md">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg border-2 border-white/20">
                <Building className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Select Environment</h2>
            <p className="text-white/60 text-sm">Choose where you want to start working today.</p>
        </div>

        <div className="space-y-6">
            {/* Organization Selector */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider ml-1">Organization</label>
                <div className="grid grid-cols-1 gap-2">
                    {user.organizations.map(org => (
                        <button
                            key={org.id}
                            onClick={() => setSelectedOrgId(org.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group text-left ${
                                selectedOrgId === org.id 
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Building size={18} className={selectedOrgId === org.id ? 'text-white' : 'text-white/50'} />
                                <span className="font-medium">{org.name}</span>
                            </div>
                            {selectedOrgId === org.id && <Check size={18} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Workspace Selector */}
            {selectedOrg && selectedOrg.workspaces.length > 0 && (
                <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider ml-1">Workspace</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none z-10">
                            <Layers size={16} />
                        </div>
                        <select
                            value={selectedWorkspaceId}
                            onChange={(e) => setSelectedWorkspaceId(Number(e.target.value))}
                            className="w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-200 text-sm appearance-none bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 cursor-pointer"
                        >
                            {selectedOrg.workspaces.map(wk => (
                                <option key={wk.id} value={wk.id} className="bg-[#1e1e1e] text-white">
                                    {wk.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none z-10">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-10">
            <button 
                onClick={handleContinue}
                className="w-full py-3.5 bg-white text-gray-900 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2 group"
            >
                Launch MateOS
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

      </div>
      
      {/* Footer User Info */}
      <div className="absolute bottom-10 flex items-center gap-3 text-white/50 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
        <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />
        <span className="text-xs">Logged in as <span className="text-white font-medium">{user.username}</span></span>
      </div>
    </div>
  );
};