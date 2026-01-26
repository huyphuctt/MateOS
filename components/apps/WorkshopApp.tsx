
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
    ReactFlow, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState, 
    MarkerType,
    Node,
    Edge,
    Handle,
    Position
} from '@xyflow/react';
import { 
    PenTool, Layers, FileText, Sparkles, Layout, 
    ChevronRight, ChevronLeft, Plus, History, 
    Maximize2, GitBranch, ArrowRight, Save, X, File as FileIcon, Loader2, LayoutGrid, CheckCircle2, Clock, Eye,
    PanelLeftClose, PanelLeft, Home
} from 'lucide-react';
import { WorkshopProject, WorkshopNode, WorkshopNodeType, FileItem, WorkshopModule } from '../../types';
import { geminiService } from '../../services/geminiService';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// --- Types ---

interface WorkshopTab {
    id: string;
    type: 'dashboard' | 'setup' | 'workspace';
    title: string;
    // Workspace State
    projectId?: string;
    activeNodeId?: string | null;
    currentLeafId?: string | null;
    // Setup State
    briefData?: {
        objective: string;
        audience: string;
        context: string;
        selectedFiles: string[];
    };
}

// Helper to map icon names string to components
const IconMap = {
    'Layout': Layout,
    'FileText': FileText,
    'Sparkles': Sparkles,
    'Layers': Layers
};

// --- Custom Graph Node ---
const CustomNode = ({ data }: { data: { label: string, type: WorkshopNodeType, isSelected: boolean, isInPath: boolean, content: string } }) => {
    const getBorderColor = () => {
        if (data.isSelected) return 'border-indigo-500 ring-4 ring-indigo-500/20';
        if (data.isInPath) return 'border-indigo-400 dark:border-indigo-500 border-2';
        return 'border-gray-200 dark:border-gray-700';
    };

    const getOpacity = () => {
        if (data.isSelected || data.isInPath) return 'opacity-100';
        return 'opacity-80 hover:opacity-100 transition-opacity';
    };

    const getIcon = () => {
        switch(data.type) {
            case 'brief': return <FileIcon size={12} />;
            case 'outline': return <Layout size={12} />;
            case 'draft': return <FileText size={12} />;
            case 'refine': return <Sparkles size={12} />;
            default: return <Layers size={12} />;
        }
    };

    return (
        <div className={`group relative px-4 py-2 shadow-md rounded-lg bg-white dark:bg-[#2d2d2d] border ${getBorderColor()} ${getOpacity()} min-w-[150px] transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!bg-gray-400" />
            
            {/* Node Content */}
            <div className="flex items-center gap-2 mb-1">
                <span className={`p-1 rounded ${data.isInPath ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300'}`}>
                    {getIcon()}
                </span>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${data.isInPath ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{data.type}</div>
            </div>
            <div className={`text-xs font-medium truncate ${data.isInPath ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{data.label}</div>
            
            {/* Popover Tooltip */}
            <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-64 bg-gray-900 text-white dark:bg-white dark:text-gray-900 p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[1000] scale-95 group-hover:scale-100 origin-bottom">
                <div className="flex items-center gap-2 mb-2 border-b border-white/20 dark:border-gray-200/20 pb-2">
                    {getIcon()}
                    <span className="font-bold text-xs uppercase tracking-wider">{data.type}</span>
                </div>
                <h4 className="font-bold text-sm mb-1">{data.label}</h4>
                <p className="text-[10px] opacity-80 line-clamp-4 leading-relaxed font-mono">
                    {data.content || "No content"}
                </p>
                {/* Arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 dark:bg-white rotate-45"></div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
        </div>
    );
};

const nodeTypes = { custom: CustomNode };

// --- SUB-COMPONENTS ---

// 1. Dashboard View
const DashboardView = ({ 
    projects, 
    onOpenProject, 
    onNewWorkshop 
}: { 
    projects: WorkshopProject[], 
    onOpenProject: (p: WorkshopProject) => void,
    onNewWorkshop: () => void
}) => {
    return (
        <div className="h-full bg-gray-50 dark:bg-[#1e1e1e] p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
                        <PenTool size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workshop</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base max-w-md mx-auto text-center">
                        Transform raw ideas into polished content with AI-powered branching pipelines.
                    </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button 
                        onClick={onNewWorkshop}
                        className="group p-6 bg-white dark:bg-[#2d2d2d] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all text-left flex flex-col h-full"
                    >
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">New Workshop</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Start from a blank brief</p>
                    </button>

                    {/* Recent Projects List */}
                    <div className="md:col-span-2 bg-white dark:bg-[#2d2d2d] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">Recent Projects</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[300px] overflow-y-auto">
                            {projects.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <History size={24} className="mb-2 opacity-50 mx-auto" />
                                    <span className="text-sm font-medium">No recent projects</span>
                                </div>
                            ) : (
                                projects.map(proj => (
                                    <button 
                                        key={proj.id}
                                        onClick={() => onOpenProject(proj)}
                                        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${proj.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{proj.title}</h4>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Clock size={10} /> Updated {new Date(proj.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                                proj.status === 'completed' 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                            }`}>
                                                {proj.status}
                                            </span>
                                            <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. Setup View
const SetupView = ({ 
    briefData, 
    onUpdateBrief, 
    onCreateProject, 
    vaultFiles 
}: { 
    briefData: NonNullable<WorkshopTab['briefData']>, 
    onUpdateBrief: (data: WorkshopTab['briefData']) => void,
    onCreateProject: () => void,
    vaultFiles: FileItem[]
}) => {
    return (
        <div className="h-full bg-white dark:bg-[#1e1e1e] flex flex-col">
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Objective</label>
                        <input 
                            type="text" 
                            placeholder="What are we building today?"
                            className="w-full p-4 text-lg bg-gray-50 dark:bg-black/20 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                            value={briefData.objective}
                            onChange={e => onUpdateBrief({...briefData, objective: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Target Audience</label>
                            <textarea 
                                className="w-full p-4 h-32 bg-gray-50 dark:bg-black/20 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder-gray-400"
                                placeholder="Who is this for?"
                                value={briefData.audience}
                                onChange={e => onUpdateBrief({...briefData, audience: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Context & Constraints</label>
                            <textarea 
                                className="w-full p-4 h-32 bg-gray-50 dark:bg-black/20 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder-gray-400"
                                placeholder="Tone, style, required elements..."
                                value={briefData.context}
                                onChange={e => onUpdateBrief({...briefData, context: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Select Assets from Vault</label>
                        <div className="grid grid-cols-3 gap-3">
                            {vaultFiles.length === 0 ? (
                                <div className="col-span-3 p-4 text-center text-gray-400 bg-gray-50 dark:bg-black/10 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                    Vault is empty
                                </div>
                            ) : (
                                vaultFiles.map(file => {
                                    const isSelected = briefData.selectedFiles.includes(file.name);
                                    return (
                                        <div 
                                            key={file.id}
                                            onClick={() => {
                                                const newSelection = isSelected 
                                                    ? briefData.selectedFiles.filter(f => f !== file.name)
                                                    : [...briefData.selectedFiles, file.name];
                                                onUpdateBrief({...briefData, selectedFiles: newSelection});
                                            }}
                                            className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                                                isSelected 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-sm' 
                                                : 'bg-white dark:bg-[#2d2d2d] border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                            }`}
                                        >
                                            <FileIcon size={16} className={isSelected ? 'text-indigo-500' : 'text-gray-400'} />
                                            <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={onCreateProject}
                            disabled={!briefData.objective}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all"
                        >
                            Start Workshop
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};

// 3. Workspace View
const WorkspaceView = ({
    project,
    modules,
    initialActiveNodeId,
    initialCurrentLeafId,
    onStateChange,
    onProjectUpdate
}: {
    project: WorkshopProject,
    modules: WorkshopModule[],
    initialActiveNodeId?: string | null,
    initialCurrentLeafId?: string | null,
    onStateChange: (active: string | null, leaf: string | null) => void,
    onProjectUpdate: (p: WorkshopProject) => void
}) => {
    // Local State
    const [workspaceView, setWorkspaceView] = useState<'focus' | 'branches'>('focus');
    const [showContext, setShowContext] = useState(true);
    const [showFocusContext, setShowFocusContext] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationCount, setGenerationCount] = useState(1);
    
    // Tab Persistence State
    const [activeNodeId, setActiveNodeId] = useState<string | null>(initialActiveNodeId || project.rootNodeId);
    const [currentLeafId, setCurrentLeafId] = useState<string | null>(initialCurrentLeafId || project.rootNodeId);

    // Graph State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Sync state up to parent tab
    useEffect(() => {
        onStateChange(activeNodeId, currentLeafId);
    }, [activeNodeId, currentLeafId, onStateChange]);

    // Helpers
    const getAncestors = (nodeId: string, proj: WorkshopProject): WorkshopNode[] => {
        if (!proj.nodes[nodeId]) return [];
        const path: WorkshopNode[] = [];
        let current = proj.nodes[nodeId];
        while (current) {
            path.unshift(current);
            if (!current.parentId) break;
            current = proj.nodes[current.parentId];
        }
        return path;
    };

    const getPathIds = (targetId: string, proj: WorkshopProject): Set<string> => {
        const path = new Set<string>();
        if (!proj.nodes[targetId]) return path;
        let current = proj.nodes[targetId];
        while (current) {
            path.add(current.id);
            if (!current.parentId) break;
            current = proj.nodes[current.parentId];
        }
        return path;
    };

    const isDescendant = (descendantId: string, ancestorId: string, proj: WorkshopProject): boolean => {
        if (descendantId === ancestorId) return true;
        let current = proj.nodes[descendantId];
        while (current) {
            if (current.id === ancestorId) return true;
            if (!current.parentId) break;
            current = proj.nodes[current.parentId];
        }
        return false;
    };

    const findSmartLeaf = (startNodeId: string, proj: WorkshopProject): string => {
        let currentId = startNodeId;
        while (true) {
            const node = proj.nodes[currentId];
            if (!node || node.childrenIds.length === 0) {
                return currentId;
            }
            if (node.childrenIds.length > 1) {
                return currentId; 
            }
            currentId = node.childrenIds[0];
        }
    };

    const getModuleIcon = (type: WorkshopNodeType) => {
        switch(type) {
            case 'brief': return <FileIcon size={14} />;
            case 'outline': return <Layout size={14} />;
            case 'draft': return <FileText size={14} />;
            case 'refine': return <Sparkles size={14} />;
            default: return <Layers size={14} />;
        }
    };

    const handleGenerate = async (moduleType: string) => {
        if (!project || !activeNodeId) return;
        
        setIsGenerating(true);
        const parentNode = project.nodes[activeNodeId];
        
        const ancestors = getAncestors(activeNodeId, project);
        const contextStr = ancestors.map(n => `--- ${n.type.toUpperCase()} ---\n${n.content}`).join('\n\n');
        const briefNode = project.nodes[project.rootNodeId];

        try {
            const promises = Array(generationCount).fill(0).map(() => 
                geminiService.generateWorkshopContent(
                    moduleType as any, 
                    contextStr, 
                    briefNode.content
                )
            );

            const results = await Promise.all(promises);

            const newNodes: Record<string, WorkshopNode> = { ...project.nodes };
            const newChildrenIds: string[] = [];
            const moduleLabel = modules.find(m => m.id === moduleType)?.label || 'Generated Content';

            results.forEach((content, idx) => {
                const newId = `node-${Date.now()}-${idx}`;
                newNodes[newId] = {
                    id: newId,
                    parentId: activeNodeId,
                    type: moduleType as WorkshopNodeType,
                    title: `${moduleLabel} (V${idx + 1})`,
                    content: content,
                    timestamp: new Date().toISOString(),
                    childrenIds: []
                };
                newChildrenIds.push(newId);
            });

            newNodes[activeNodeId] = {
                ...parentNode,
                childrenIds: [...parentNode.childrenIds, ...newChildrenIds]
            };

            const updatedProject = { ...project, nodes: newNodes, updatedAt: new Date().toISOString() };
            onProjectUpdate(updatedProject);
            
            // Auto-select first new child
            setActiveNodeId(newChildrenIds[0]);
            setCurrentLeafId(newChildrenIds[0]);
            
        } catch (e) {
            console.error("Generation failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    // Graph Layout Effect
    useEffect(() => {
        if (!project) return;

        const activePath = activeNodeId ? getPathIds(activeNodeId, project) : new Set<string>();
        
        const NODE_WIDTH = 220;
        const NODE_HEIGHT = 180;
        const GAP = 20;

        const subtreeWidths = new Map<string, number>();

        const calculateSubtreeWidth = (nodeId: string): number => {
            const node = project.nodes[nodeId];
            if (!node) return 0;
            
            if (node.childrenIds.length === 0) {
                const width = NODE_WIDTH;
                subtreeWidths.set(nodeId, width);
                return width;
            }

            let width = 0;
            node.childrenIds.forEach(childId => {
                width += calculateSubtreeWidth(childId);
            });
            width += (node.childrenIds.length - 1) * GAP;
            
            width = Math.max(width, NODE_WIDTH);
            
            subtreeWidths.set(nodeId, width);
            return width;
        };

        const nodePositions = new Map<string, { x: number, y: number }>();
        
        const assignPositions = (nodeId: string, x: number, y: number) => {
            const node = project.nodes[nodeId];
            if (!node) return;

            const totalWidth = subtreeWidths.get(nodeId) || NODE_WIDTH;
            const nodeX = x + (totalWidth / 2) - (150 / 2); 
            
            nodePositions.set(nodeId, { x: nodeX, y });

            let currentChildX = x;
            node.childrenIds.forEach(childId => {
                const childWidth = subtreeWidths.get(childId) || NODE_WIDTH;
                assignPositions(childId, currentChildX, y + NODE_HEIGHT);
                currentChildX += childWidth + GAP;
            });
        };

        if (project.rootNodeId) {
            calculateSubtreeWidth(project.rootNodeId);
            assignPositions(project.rootNodeId, 0, 0);
        }

        const gNodes: Node[] = [];
        const gEdges: Edge[] = [];

        Object.values(project.nodes).forEach(node => {
            const pos = nodePositions.get(node.id) || { x: 0, y: 0 };
            const isInPath = activePath.has(node.id);
            
            gNodes.push({
                id: node.id,
                type: 'custom',
                position: pos,
                data: { 
                    label: node.title, 
                    type: node.type,
                    isSelected: node.id === activeNodeId,
                    isInPath: isInPath,
                    content: node.content
                }
            });

            if (node.parentId) {
                const isEdgeInPath = isInPath && activePath.has(node.parentId);
                
                gEdges.push({
                    id: `e-${node.parentId}-${node.id}`,
                    source: node.parentId,
                    target: node.id,
                    type: 'default',
                    markerEnd: { 
                        type: MarkerType.ArrowClosed,
                        color: isEdgeInPath ? '#6366f1' : '#94a3b8'
                    },
                    style: { 
                        stroke: isEdgeInPath ? '#6366f1' : '#94a3b8',
                        strokeWidth: isEdgeInPath ? 3 : 1,
                        opacity: isEdgeInPath ? 1 : 0.5
                    },
                    animated: isEdgeInPath
                });
            }
        });

        setNodes(gNodes);
        setEdges(gEdges);

    }, [project, activeNodeId, setNodes, setEdges]);

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        if (!project || !currentLeafId) return;

        if (isDescendant(currentLeafId, node.id, project)) {
            setActiveNodeId(node.id);
        } else {
            const newLeafId = findSmartLeaf(node.id, project);
            setActiveNodeId(node.id);
            setCurrentLeafId(newLeafId);
        }
    };

    const activeNode = activeNodeId ? project.nodes[activeNodeId] : null;
    const lineagePath = (project && currentLeafId) ? getAncestors(currentLeafId, project) : [];
    const activePathSet = (project && activeNodeId) ? getPathIds(activeNodeId, project) : new Set();
    const activeAncestors = (project && activeNodeId) ? getAncestors(activeNodeId, project) : [];

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Workspace Toolbar */}
            <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-gray-50 dark:bg-[#252525]">
                <div className="flex bg-gray-200 dark:bg-black/30 p-0.5 rounded-lg">
                    <button 
                        onClick={() => setWorkspaceView('focus')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${workspaceView === 'focus' ? 'bg-white dark:bg-[#3d3d3d] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                    >
                        <Maximize2 size={12} /> Focus
                    </button>
                    <button 
                        onClick={() => setWorkspaceView('branches')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${workspaceView === 'branches' ? 'bg-white dark:bg-[#3d3d3d] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                    >
                        <GitBranch size={12} /> Branches
                    </button>
                </div>

                <button onClick={() => setShowContext(!showContext)} className={`p-1.5 rounded-lg transition-colors ${showContext ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                    <History size={16} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Lineage Sidebar */}
                {showContext && (
                    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1a1a1a] flex flex-col shrink-0">
                        <div className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <History size={14} /> Lineage
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {lineagePath.map((node) => {
                                const isActive = activePathSet.has(node.id);
                                return (
                                    <div key={node.id} className={`relative pl-4 border-l-2 transition-all duration-300 ${isActive ? 'border-indigo-200 dark:border-indigo-900/50 opacity-100' : 'border-gray-200 dark:border-gray-800 opacity-50 grayscale'}`}>
                                        <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-indigo-400' : 'bg-gray-400'}`}></div>
                                        <div className={`text-xs font-bold mb-1 uppercase ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>{node.type}</div>
                                        <div className="text-sm font-semibold mb-2">{node.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 leading-relaxed font-mono bg-white dark:bg-black/20 p-2 rounded border border-gray-200 dark:border-gray-700">
                                            {node.content.slice(0, 150)}...
                                        </div>
                                        <button 
                                            onClick={() => setActiveNodeId(node.id)}
                                            className={`mt-2 text-[10px] font-bold flex items-center gap-1 transition-colors ${isActive ? 'text-gray-400 hover:text-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Jump to this version <ArrowRight size={10}/>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {workspaceView === 'focus' ? (
                        <div className="flex flex-row h-full">
                            {/* Accumulated Context */}
                            {showFocusContext && (
                                <div className="w-[35%] min-w-[300px] border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] overflow-y-auto animate-in slide-in-from-left-2 duration-200">
                                    <div className="sticky top-0 z-20 bg-gray-50 dark:bg-[#1a1a1a] px-8 pt-8 pb-4 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                            <History size={14} /> Previous Context
                                        </h3>
                                    </div>
                                    <div className="px-8 pt-6 pb-8 max-w-2xl mx-auto space-y-6">
                                        {activeAncestors.slice(0, -1).length > 0 ? (
                                            activeAncestors.slice(0, -1).map(node => (
                                                <div key={node.id} className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                                                    <div className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
                                                        <span className="text-indigo-500 dark:text-indigo-400">
                                                            {getModuleIcon(node.type)}
                                                        </span>
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                            {node.type}
                                                        </span>
                                                        <span className="ml-auto text-[10px] text-gray-400">
                                                            {new Date(node.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 prose prose-sm prose-slate dark:prose-invert max-w-none">
                                                        <ReactMarkdown>{node.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-400 italic text-center py-8">
                                                This is the start of the journey.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Active Editor */}
                            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1e1e1e] relative transition-all duration-300">
                                <div className="sticky top-0 z-20 bg-white dark:bg-[#1e1e1e] px-8 pt-8 pb-4 border-b border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-2">
                                            <button 
                                                onClick={() => setShowFocusContext(!showFocusContext)}
                                                className="p-1.5 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors mr-2"
                                                title={showFocusContext ? "Hide Context Panel" : "Show Context Panel"}
                                            >
                                                {showFocusContext ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                                            </button>
                                            <PenTool size={14} /> Current Module Output
                                        </h3>
                                    </div>
                                </div>
                                
                                <div className="px-8 pt-6 pb-32 max-w-3xl mx-auto min-h-full">
                                    {activeNode ? (
                                        <article className="prose prose-slate dark:prose-invert max-w-none">
                                            <h1 className="mb-2">{activeNode.title}</h1>
                                            <div className="flex items-center gap-2 mb-8 text-xs text-gray-400 font-mono">
                                                <span className="uppercase bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">{activeNode.type}</span>
                                                <span>{new Date(activeNode.timestamp).toLocaleString()}</span>
                                            </div>
                                            <ReactMarkdown>{activeNode.content}</ReactMarkdown>
                                        </article>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-gray-400">Select a node to view content</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-gray-50 dark:bg-[#121212]">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onNodeClick={onNodeClick}
                                nodeTypes={nodeTypes}
                                fitView
                                minZoom={0.5}
                                maxZoom={1.5}
                            >
                                <Background className="dark:bg-[#121212]" color="#888" gap={20} size={1} />
                                <Controls className="dark:bg-[#2d2d2d] dark:border-gray-700 dark:fill-white" />
                            </ReactFlow>
                        </div>
                    )}

                    {/* Generator Bar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#2d2d2d]/90 backdrop-blur-md border border-gray-200 dark:border-gray-600 p-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300 z-10">
                        {isGenerating ? (
                            <div className="px-6 py-2 flex items-center gap-3 text-indigo-500 font-bold">
                                <Loader2 size={18} className="animate-spin" />
                                Generating Content...
                            </div>
                        ) : (
                            <>
                                {modules.map(mod => {
                                    const Icon = IconMap[mod.iconName] || Layers;
                                    return (
                                        <button
                                            key={mod.id}
                                            onClick={() => handleGenerate(mod.id)}
                                            className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors min-w-[80px]"
                                            title={mod.description}
                                        >
                                            <Icon size={20} className="text-gray-600 dark:text-gray-300" />
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{mod.label.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                                <div className="w-[1px] h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                                <div className="flex items-center gap-2 px-2">
                                    <span className="text-xs font-bold text-gray-500">Options:</span>
                                    <select 
                                        value={generationCount}
                                        onChange={(e) => setGenerationCount(Number(e.target.value))}
                                        className="bg-gray-100 dark:bg-black/20 rounded border-none text-xs font-bold p-1 focus:ring-0 cursor-pointer"
                                    >
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---

export const WorkshopApp: React.FC = () => {
    const { token, activeWorkspace } = useAuth();
    
    // Global State
    const [projects, setProjects] = useState<WorkshopProject[]>([]);
    const [modules, setModules] = useState<WorkshopModule[]>([]);
    const [vaultFiles, setVaultFiles] = useState<FileItem[]>([]);

    // Tab Management
    const [tabs, setTabs] = useState<WorkshopTab[]>([{ id: 'dashboard', type: 'dashboard', title: 'Dashboard' }]);
    const [activeTabId, setActiveTabId] = useState('dashboard');

    // Initial Fetch
    useEffect(() => {
        if (token) {
            apiService.getWorkshopModules(token).then(setModules);
            apiService.getWorkshopProjects(token).then(setProjects);
            if (activeWorkspace) {
                apiService.vaultContents(token, activeWorkspace.id).then(setVaultFiles);
            }
        }
    }, [token, activeWorkspace]);

    // Tab Handlers
    const addTab = (tab: WorkshopTab) => {
        setTabs(prev => [...prev, tab]);
        setActiveTabId(tab.id);
    };

    const closeTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        
        if (activeTabId === id) {
            const index = tabs.findIndex(t => t.id === id);
            const nextTab = newTabs[Math.max(0, index - 1)];
            setActiveTabId(nextTab.id);
        }
    };

    const updateTab = (id: string, updates: Partial<WorkshopTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    // Action Handlers
    const handleOpenProject = (proj: WorkshopProject) => {
        // Check if already open
        const existingTab = tabs.find(t => t.projectId === proj.id);
        if (existingTab) {
            setActiveTabId(existingTab.id);
            return;
        }

        addTab({
            id: `proj-${proj.id}`,
            type: 'workspace',
            title: proj.title,
            projectId: proj.id,
            activeNodeId: proj.rootNodeId,
            currentLeafId: proj.rootNodeId
        });
    };

    const handleNewWorkshop = () => {
        const id = `setup-${Date.now()}`;
        addTab({
            id,
            type: 'setup',
            title: 'New Workshop',
            briefData: { objective: '', audience: '', context: '', selectedFiles: [] }
        });
    };

    const handleCreateProject = async (tabId: string, briefData: any) => {
        if (!token) return;
        const newProject = await apiService.createWorkshopProject(token, briefData);
        if (newProject) {
            setProjects(prev => [newProject, ...prev]);
            // Replace Setup tab with Workspace tab
            setTabs(prev => prev.map(t => t.id === tabId ? {
                id: `proj-${newProject.id}`,
                type: 'workspace',
                title: newProject.title,
                projectId: newProject.id,
                activeNodeId: newProject.rootNodeId,
                currentLeafId: newProject.rootNodeId,
                briefData: undefined // clear Setup data
            } : t));
            setActiveTabId(`proj-${newProject.id}`);
        }
    };

    const handleProjectUpdate = (updatedProject: WorkshopProject) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    };

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Tab Bar */}
            <div className="h-9 flex items-center px-2 pt-1 gap-1 bg-[#f3f3f3] dark:bg-[#202020] border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar shrink-0">
                 {tabs.map(tab => {
                     const isActive = tab.id === activeTabId;
                     const isDashboard = tab.type === 'dashboard';
                     return (
                         <div 
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={`
                                group relative flex items-center gap-2 pl-3 pr-2 h-8 min-w-[120px] max-w-[200px] rounded-t-lg text-xs cursor-default select-none transition-colors
                                ${isActive 
                                    ? 'bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 shadow-sm z-10' 
                                    : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'
                                }
                            `}
                         >
                             {/* Icon */}
                             <div className="shrink-0 opacity-70">
                                 {isDashboard ? <Home size={12} /> : (tab.type === 'setup' ? <Plus size={12} /> : <FileIcon size={12} />)}
                             </div>
                             
                             {/* Title */}
                             <span className="truncate flex-1 font-medium">{tab.title}</span>

                             {/* Close Button (Not for Dashboard) */}
                             {!isDashboard && (
                                 <button 
                                    onClick={(e) => closeTab(e, tab.id)}
                                    className={`
                                        p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity
                                        ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                    `}
                                 >
                                     <X size={12} />
                                 </button>
                             )}
                             
                             {/* Divider */}
                             {!isActive && (
                                 <div className="absolute right-0 top-2 bottom-2 w-[1px] bg-gray-300 dark:bg-gray-700 group-hover:hidden" />
                             )}
                         </div>
                     );
                 })}
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {activeTab.type === 'dashboard' && (
                    <DashboardView 
                        projects={projects}
                        onOpenProject={handleOpenProject}
                        onNewWorkshop={handleNewWorkshop}
                    />
                )}

                {activeTab.type === 'setup' && activeTab.briefData && (
                    <SetupView 
                        briefData={activeTab.briefData}
                        onUpdateBrief={(data) => updateTab(activeTab.id, { briefData: data })}
                        onCreateProject={() => handleCreateProject(activeTab.id, activeTab.briefData)}
                        vaultFiles={vaultFiles}
                    />
                )}

                {activeTab.type === 'workspace' && activeTab.projectId && (
                    <WorkspaceView 
                        key={activeTab.id} // Force remount on tab switch to ensure clean graph state
                        project={projects.find(p => p.id === activeTab.projectId)!}
                        modules={modules}
                        initialActiveNodeId={activeTab.activeNodeId}
                        initialCurrentLeafId={activeTab.currentLeafId}
                        onStateChange={(active, leaf) => updateTab(activeTab.id, { activeNodeId: active, currentLeafId: leaf })}
                        onProjectUpdate={handleProjectUpdate}
                    />
                )}
            </div>
        </div>
    );
};
