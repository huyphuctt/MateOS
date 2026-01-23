
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    LayoutGrid, List, Search, Plus, File, Image, FileVideo, 
    FileText, FileSpreadsheet, FileCode, FolderClosed, 
    Home, Tag, CheckCircle2, Loader2, AlertCircle, ChevronRight
} from 'lucide-react';
import { apiService } from '../../services/api';
import { FileItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface VaultAppProps {
    onOpenFile: (file: FileItem) => void;
}

type Category = 'All' | 'Images' | 'Videos' | 'Docs' | 'Spreadsheets' | 'PDF' | 'Presentation';

export const VaultApp: React.FC<VaultAppProps> = ({ onOpenFile }) => {
    const { token, activeWorkspace } = useAuth();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialMount = useRef(true);
    const lastFetchedToken = useRef<string | undefined>(undefined);

    const loadFiles = useCallback(async (force = false) => {
        // Prevent duplicate calls if token hasn't changed, unless forced
        if (!force && token === lastFetchedToken.current && files.length > 0) {
            return;
        }

        setLoading(true);
        lastFetchedToken.current = token;
        
        try {
            const data = await apiService.vaultContents(token || '', activeWorkspace?.id || 0);
            setFiles(data);
        } catch (e) {
            console.error("Failed to load vault content");
        } finally {
            setLoading(false);
        }
    }, [token, files.length, activeWorkspace]);

    // Initial Load
    useEffect(() => {
        // In React 18 Strict Mode, useEffect runs twice in dev. 
        // This check ensures we only fire the actual fetch once per mount/token change.
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadFiles();
        } else if (token !== lastFetchedToken.current) {
            loadFiles();
        }
    }, [loadFiles, token]);

    // Polling for non-ready files status updates
    useEffect(() => {
        const nonReadyFiles = files.filter(f => f.status && f.status !== 'Ready');
        if (nonReadyFiles.length === 0 || !token) return;

        const pollInterval = setInterval(async () => {
            // Re-evaluate list of files that still need refreshing
            // We use functional update to ensure we don't hold stale 'files'
            // but for the iterator we need the IDs.
            for (const file of nonReadyFiles) {
                try {
                    const refreshedItem = await apiService.vaultRefresh(token, file.id);
                    if (refreshedItem) {
                        setFiles(prev => prev.map(f => f.id === refreshedItem.id ? refreshedItem : f));
                    }
                } catch (err) {
                    console.error(`Failed to refresh status for file ${file.id}:`, err);
                }
            }
        }, 10000); // 10 seconds interval

        return () => clearInterval(pollInterval);
    }, [files, token]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const newFile = await apiService.uploadVaultFile(file, activeWorkspace?.id || 0, token);
            if (newFile) {
                setFiles(prev => [newFile, ...prev]);
            }
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleCategoryClick = (cat: Category) => {
        setSelectedCategory(cat);
        setSelectedTag(null);
    };

    const handleTagClick = (tag: string | null) => {
        setSelectedTag(tag);
        setSelectedCategory('All');
    };

    const allTags = Array.from(new Set(files.flatMap(f => f.tags || []))).sort();

    const getFilteredFiles = () => {
        let filtered = files;
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(f => {
                if (selectedCategory === 'Images') return f.type === 'image';
                if (selectedCategory === 'Videos') return f.type === 'video';
                if (selectedCategory === 'Docs') return f.type === 'doc';
                if (selectedCategory === 'Spreadsheets') return f.type === 'sheet';
                if (selectedCategory === 'Presentation') return f.type === 'presentation';
                if (selectedCategory === 'PDF') return f.type === 'pdf';
                return true;
            });
        }
        if (selectedTag) {
            filtered = filtered.filter(f => f.tags?.includes(selectedTag));
        }
        if (searchTerm) {
            filtered = filtered.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    };

    const filteredFiles = getFilteredFiles();

    const getFileIcon = (type: FileItem['type']) => {
        switch (type) {
            case 'image': return <Image className="text-purple-500" size={32} />;
            case 'video': return <FileVideo className="text-red-500" size={32} />;
            case 'doc': return <FileText className="text-blue-500" size={32} />;
            case 'sheet': return <FileSpreadsheet className="text-green-500" size={32} />;
            case 'presentation': return <FileSpreadsheet className="text-green-500" size={32} />;
            case 'pdf': return <FileText className="text-red-400" size={32} />;
            case 'code': return <FileCode className="text-yellow-500" size={32} />;
            default: return <File className="text-gray-400" size={32} />;
        }
    };

    const getStatusBadge = (status?: string, mode: 'icon' | 'full' = 'icon') => {
        if (!status) return null;
        if (status === 'Indexing') {
            return (
                <div className={`flex items-center gap-1.5 ${mode === 'full' ? 'px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs' : ''}`} title="Indexing">
                    <Loader2 size={mode === 'full' ? 12 : 14} className="animate-spin text-yellow-500" />
                    {mode === 'full' && <span>Indexing</span>}
                </div>
            );
        }
        if (status === 'Ready') {
             if (mode === 'icon') return null;
             return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">
                    <CheckCircle2 size={12} />
                    <span>Ready</span>
                </div>
            );
        }
        if (status === 'Error') {
             return (
                <div className={`flex items-center gap-1.5 ${mode === 'full' ? 'px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs' : ''}`} title="Error">
                    <AlertCircle size={mode === 'full' ? 12 : 14} className="text-red-500" />
                    {mode === 'full' && <span>Error</span>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex h-full bg-[#f9f9f9] dark:bg-[#202020] text-gray-800 dark:text-gray-100 font-sans">
            <div className="w-56 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-[#f3f3f3] dark:bg-[#1a1a1a] pt-4">
                <div className="px-4 mb-6">
                    <button 
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2 shadow-sm transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {uploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Plus size={16} />
                        )}
                        <span>New Upload</span>
                    </button>
                    <input type="file" accept="*/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categories</h3>
                    {(['All', 'Images', 'Videos', 'Docs', 'Spreadsheets', 'Presentation', 'PDF'] as Category[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedCategory === cat && !selectedTag
                                ? 'bg-white dark:bg-white/10 shadow-sm font-medium' 
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {cat === 'All' && <Home size={16} />}
                            {cat === 'Images' && <Image size={16} />}
                            {cat === 'Videos' && <FileVideo size={16} />}
                            {cat === 'Docs' && <FileText size={16} />}
                            {cat === 'Spreadsheets' && <FileSpreadsheet size={16} />}
                            {cat === 'Presentation' && <FileText size={16} />}
                            {cat === 'PDF' && <FileText size={16} />}
                            <span>{cat}</span>
                        </button>
                    ))}

                    <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedTag === tag 
                                ? 'bg-white dark:bg-white/10 shadow-sm font-medium' 
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <Tag size={16} className={selectedTag === tag ? 'text-blue-500' : 'text-gray-400'} />
                            <span>{tag}</span>
                        </button>
                    ))}
                    {allTags.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400 italic">No tags found</div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525]">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span 
                            className="hover:bg-gray-100 dark:hover:bg-white/10 px-2 py-1 rounded cursor-pointer"
                            onClick={() => { setSelectedCategory('All'); setSelectedTag(null); }}
                        >
                            Vault
                        </span>
                        {selectedCategory !== 'All' && (
                            <>
                                <ChevronRight size={14} className="text-gray-400" />
                                <span className="font-medium hover:bg-gray-100 dark:hover:bg-white/10 px-2 py-1 rounded cursor-default">{selectedCategory}</span>
                            </>
                        )}
                        {selectedTag && (
                            <>
                                <ChevronRight size={14} className="text-gray-400" />
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                    <Tag size={10} />
                                    {selectedTag}
                                </span>
                            </>
                        )}
                        {selectedCategory === 'All' && !selectedTag && (
                             <>
                                <ChevronRight size={14} className="text-gray-400" />
                                <span className="font-medium px-2 py-1 rounded cursor-default">All Files</span>
                             </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group mr-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={14} />
                            <input 
                                type="text"
                                placeholder="Search Vault"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-48 bg-gray-100 dark:bg-black/20 border border-transparent focus:bg-white dark:focus:bg-black/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1.5 pl-8 pr-3 text-sm transition-all focus:outline-none placeholder-gray-500"
                            />
                        </div>
                        <div className="flex bg-gray-100 dark:bg-black/20 rounded-md p-0.5 border border-gray-200 dark:border-white/5">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                             <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                             <span className="text-sm">Loading content...</span>
                         </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <FolderClosed size={48} className="opacity-20" />
                            <p>No files found.</p>
                            <button onClick={handleUploadClick} className="text-blue-500 text-sm hover:underline">Upload a file</button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {filteredFiles.map(file => (
                                <div 
                                    key={file.id}
                                    onDoubleClick={() => onOpenFile(file)}
                                    className="group flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-white/10 border border-transparent hover:border-blue-100 dark:hover:border-white/5 cursor-pointer transition-all relative"
                                >
                                    <div className="w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm group-hover:shadow-md transition-shadow relative overflow-hidden">
                                        {file.type === 'image' ? (
                                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                        ) : (
                                            getFileIcon(file.type)
                                        )}
                                        {file.status && file.status !== 'Ready' && (
                                            <div className="absolute top-1 right-1">
                                                {getStatusBadge(file.status, 'icon')}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-center font-medium truncate w-full px-1">{file.name}</span>
                                    {file.tags && file.tags.length > 0 && (
                                        <div className="flex gap-1 overflow-hidden max-w-full px-1 h-3.5">
                                            {file.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[9px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1 rounded-sm leading-none flex items-center">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="min-w-full inline-block align-middle">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-[#252525]">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Modified</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredFiles.map(file => (
                                            <tr 
                                                key={file.id} 
                                                onDoubleClick={() => onOpenFile(file)}
                                                className="hover:bg-blue-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                                                            {React.cloneElement(getFileIcon(file.type) as React.ReactElement<any>, { size: 20 })}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm">
                                                    {getStatusBadge(file.status, 'full')}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {file.date}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                     <div className="flex gap-1">
                                                        {file.tags?.map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                    {file.type}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {file.size}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="bg-white dark:bg-[#252525] border-t border-gray-200 dark:border-gray-700 px-4 py-1 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{filteredFiles.length} items</span>
                    <span>All items synchronized</span>
                </div>
            </div>
        </div>
    );
};
