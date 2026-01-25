
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
    PanelLeftClose, PanelLeft
} from 'lucide-react';
import { WorkshopProject, WorkshopNode, WorkshopNodeType, FileItem, WorkshopModule } from '../../types';
import { geminiService } from '../../services/geminiService';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// --- Types & Constants ---

type ViewMode = 'dashboard' | 'setup' | 'workspace';
type WorkspaceView = 'focus' | 'branches';

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

export const WorkshopApp: React.FC = () => {
    const { token, activeWorkspace } = useAuth();
    
    // App State
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [project, setProject] = useState<WorkshopProject | null>(null);
    const [projects, setProjects] = useState<WorkshopProject[]>([]);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [currentLeafId, setCurrentLeafId] = useState<string | null>(null); // New state to track the "tip" of the current branch
    
    const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('focus');
    const [showContext, setShowContext] = useState(true); // Navigation Lineage Sidebar
    const [showFocusContext, setShowFocusContext] = useState(true); // Focus Mode Side-by-Side Context
    const [vaultFiles, setVaultFiles] = useState<FileItem[]>([]);
    const [modules, setModules] = useState<WorkshopModule[]>([]);
    
    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationCount, setGenerationCount] = useState(1);

    // Setup Form State
    const [briefData, setBriefData] = useState({
        objective: '',
        audience: '',
        context: '',
        selectedFiles: [] as string[]
    });

    // Graph State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // --- Initial Fetch ---
    useEffect(() => {
        if (token) {
            apiService.getWorkshopModules(token).then(setModules);
            apiService.getWorkshopProjects(token).then(setProjects);
        }
    }, [token]);

    // --- Helpers ---

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

    // Check if `descendantId` is truly a descendant of `ancestorId` (or the same node)
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

    // Find the furthest smart leaf node starting from a given node.
    // It traverses down ONLY if there is a single, unambiguous path.
    // If it hits a branching point (>1 child), it stops, treating that node as the end of the context.
    const findSmartLeaf = (startNodeId: string, proj: WorkshopProject): string => {
        let currentId = startNodeId;
        while (true) {
            const node = proj.nodes[currentId];
            if (!node || node.childrenIds.length === 0) {
                return currentId;
            }
            // If branching (multiple children), we stop here to avoid ambiguity in Lineage.
            if (node.childrenIds.length > 1) {
                return currentId; 
            }
            // Prefer the single child
            currentId = node.childrenIds[0];
        }
    };

    const getActiveNode = () => project && activeNodeId ? project.nodes[activeNodeId] : null;

    // --- Actions ---

    const startNewProject = () => {
        setBriefData({ objective: '', audience: '', context: '', selectedFiles: [] });
        setViewMode('setup');
        // Fetch vault files for selection
        if (token && activeWorkspace) {
            apiService.vaultContents(token, activeWorkspace.id).then(setVaultFiles);
        }
    };

    const openProject = (proj: WorkshopProject) => {
        setProject(proj);
        // Ensure we open to the absolute latest tip of the project
        const latestLeaf = findSmartLeaf(proj.rootNodeId, proj);
        setActiveNodeId(latestLeaf);
        setCurrentLeafId(latestLeaf);
        setViewMode('workspace');
    };

    const createProject = async () => {
        if (!token) return;
        const newProject = await apiService.createWorkshopProject(token, briefData);
        if (newProject) {
            setProject(newProject);
            setActiveNodeId(newProject.rootNodeId);
            setCurrentLeafId(newProject.rootNodeId);
            setProjects(prev => [newProject, ...prev]);
            setViewMode('workspace');
        }
    };

    const handleGenerate = async (moduleType: string) => {
        if (!project || !activeNodeId) return;
        
        setIsGenerating(true);
        const parentNode = project.nodes[activeNodeId];
        
        // Construct Context from Ancestors
        const ancestors = getAncestors(activeNodeId, project);
        const contextStr = ancestors.map(n => `--- ${n.type.toUpperCase()} ---\n${n.content}`).join('\n\n');
        const briefNode = project.nodes[project.rootNodeId]; // Brief is always root

        try {
            // Generate multiple variations
            const promises = Array(generationCount).fill(0).map(() => 
                geminiService.generateWorkshopContent(
                    moduleType as any, 
                    contextStr, 
                    briefNode.content
                )
            );

            const results = await Promise.all(promises);

            // Update Project State
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

            // Update parent
            newNodes[activeNodeId] = {
                ...parentNode,
                childrenIds: [...parentNode.childrenIds, ...newChildrenIds]
            };

            const updatedProject = { ...project, nodes: newNodes, updatedAt: new Date().toISOString() };
            setProject(updatedProject);
            
            // Auto-select the first new node and update leaf to it
            setActiveNodeId(newChildrenIds[0]);
            setCurrentLeafId(newChildrenIds[0]);
            
        } catch (e) {
            console.error("Generation failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    // Update Graph when Project changes
    useEffect(() => {
        if (!project) return;

        const gNodes: Node[] = [];
        const gEdges: Edge[] = [];
        
        const activePath = activeNodeId ? getPathIds(activeNodeId, project) : new Set<string>();

        // BFS to layout nodes (simplified tree layout)
        const levels: Record<number, WorkshopNode[]> = {};
        const queue: { node: WorkshopNode, level: number }[] = [{ node: project.nodes[project.rootNodeId], level: 0 }];

        while(queue.length > 0) {
            const { node, level } = queue.shift()!;
            if(!levels[level]) levels[level] = [];
            levels[level].push(node);
            
            node.childrenIds.forEach(childId => {
                queue.push({ node: project.nodes[childId], level: level + 1 });
            });
        }

        // Create React Flow Nodes
        Object.entries(levels).forEach(([levelStr, nodesInLevel]) => {
            const level = parseInt(levelStr);
            const totalWidth = nodesInLevel.length * 200;
            const startX = -totalWidth / 2;

            nodesInLevel.forEach((node, idx) => {
                const isInPath = activePath.has(node.id);
                
                gNodes.push({
                    id: node.id,
                    type: 'custom',
                    position: { x: startX + (idx * 200), y: level * 150 },
                    data: { 
                        label: node.title, 
                        type: node.type,
                        isSelected: node.id === activeNodeId,
                        isInPath: isInPath,
                        content: node.content // Passing content for Tooltip
                    }
                });

                if (node.parentId) {
                    const isEdgeInPath = isInPath && activePath.has(node.parentId);
                    
                    gEdges.push({
                        id: `e-${node.parentId}-${node.id}`,
                        source: node.parentId,
                        target: node.id,
                        type: 'smoothstep',
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
        });

        setNodes(gNodes);
        setEdges(gEdges);

    }, [project, activeNodeId, setNodes, setEdges]);

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        if (!project || !currentLeafId) return;

        // Smart Branch Selection Logic:
        // 1. If clicked node is on current active path (it's an ancestor of current leaf):
        //    Just move focus back in time. Do not change the leaf (preserve future context).
        if (isDescendant(currentLeafId, node.id, project)) {
            setActiveNodeId(node.id);
        } else {
            // 2. If clicked node is NOT on current path (switching branches):
            //    We need to determine the new path.
            //    - If the node has multiple children ("2 connectors"), we STOP there. 
            //      This prevents ambiguity in the lineage sidebar.
            //    - If the node has a single unambiguous path forward, we follow it to the leaf.
            const newLeafId = findSmartLeaf(node.id, project);
            setActiveNodeId(node.id);
            setCurrentLeafId(newLeafId);
        }
    };

    // --- Views ---

    if (viewMode === 'dashboard') {
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
                            onClick={startNewProject}
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
                                            onClick={() => openProject(proj)}
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
    }

    if (viewMode === 'setup') {
        return (
            <div className="h-full bg-white dark:bg-[#1e1e1e] flex flex-col">
                <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                    <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300"/>
                    </button>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Workshop Brief</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Objective</label>
                            <input 
                                type="text" 
                                placeholder="What are we building today?"
                                className="w-full p-4 text-lg bg-gray-50 dark:bg-black/20 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                                value={briefData.objective}
                                onChange={e => setBriefData({...briefData, objective: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Target Audience</label>
                                <textarea 
                                    className="w-full p-4 h-32 bg-gray-50 dark:bg-black/20 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder-gray-400"
                                    placeholder="Who is this for?"
                                    value={briefData.audience}
                                    onChange={e => setBriefData({...briefData, audience: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Context & Constraints</label>
                                <textarea 
                                    className="w-full p-4 h-32 bg-gray-50 dark:bg-black/20 text-black dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder-gray-400"
                                    placeholder="Tone, style, required elements..."
                                    value={briefData.context}
                                    onChange={e => setBriefData({...briefData, context: e.target.value})}
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
                                        const isSelected = briefData.selectedFiles.includes(file.name); // Using name as simplistic ID for prompt
                                        return (
                                            <div 
                                                key={file.id}
                                                onClick={() => {
                                                    const newSelection = isSelected 
                                                        ? briefData.selectedFiles.filter(f => f !== file.name)
                                                        : [...briefData.selectedFiles, file.name];
                                                    setBriefData({...briefData, selectedFiles: newSelection});
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
                                onClick={createProject}
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
    }

    const activeNode = getActiveNode();
    
    // --- Lineage Logic ---
    // We want to show the full path from root to currentLeafId
    // But we highlight only up to activeNodeId
    const lineagePath = (project && currentLeafId) ? getAncestors(currentLeafId, project) : [];
    const activePathSet = (project && activeNodeId) ? getPathIds(activeNodeId, project) : new Set();
    
    // Construct context only from the ACTIVE path (root -> active node)
    const activeAncestors = (project && activeNodeId) ? getAncestors(activeNodeId, project) : [];
    const previousContext = activeAncestors.slice(0, -1).map(n => {
        return `### ${n.title} (${n.type})\n${n.content}`;
    }).join('\n\n---\n\n');

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Top Bar */}
            <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-gray-50 dark:bg-[#252525]">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('dashboard')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg">
                        <LayoutGrid size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="h-6 w-[1px] bg-gray-300 dark:bg-gray-600"></div>
                    <h2 className="font-bold text-sm truncate max-w-[200px]">{project?.title}</h2>
                </div>

                <div className="flex bg-gray-200 dark:bg-black/30 p-1 rounded-lg">
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

                <button onClick={() => setShowContext(!showContext)} className={`p-2 rounded-lg transition-colors ${showContext ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                    <History size={18} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Context Sidebar (Standard Lineage List) */}
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

                {/* Main Stage */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {workspaceView === 'focus' ? (
                        <div className="flex flex-row h-full">
                            {/* Panel 1: Accumulated Context (ReadOnly) - Left Side */}
                            {showFocusContext && (
                                <div className="w-[35%] min-w-[300px] border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] overflow-y-auto animate-in slide-in-from-left-2 duration-200">
                                    <div className="sticky top-0 z-20 bg-gray-50 dark:bg-[#1a1a1a] px-8 pt-8 pb-4 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                            <History size={14} /> Previous Context
                                        </h3>
                                    </div>
                                    <div className="px-8 pt-6 pb-8 max-w-2xl mx-auto">
                                        {previousContext ? (
                                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none opacity-80">
                                                <ReactMarkdown>{previousContext}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 italic">This is the root node. No previous context available.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Panel 2: Current Output (Editable/Active) - Right Side */}
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

                    {/* Bottom Action Bar */}
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
