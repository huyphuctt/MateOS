import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutGrid, List, Search, Upload, File, Image, FileVideo, 
    FileText, FileSpreadsheet, FileCode, FolderClosed, MoreVertical,
    Clock, HardDrive, Download, ChevronRight, Home, Cloud, Plus
} from 'lucide-react';
import { apiService } from '../../services/api';
import { FileItem } from '../../types';

interface VaultAppProps {
    onOpenFile: (file: FileItem) => void;
}

type Category = 'All' | 'Images' | 'Videos' | 'Docs' | 'Sheets' | 'PDF';

export const VaultApp: React.FC<VaultAppProps> = ({ onOpenFile }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const data = await apiService.getVaultContent();
            setFiles(data);
        } catch (e) {
            console.error("Failed to load vault content");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const newFile = await apiService.uploadVaultFile(file);
            if (newFile) {
                setFiles(prev => [newFile, ...prev]);
            }
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Filters
    const getFilteredFiles = () => {
        let filtered = files;

        // Category Filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(f => {
                if (selectedCategory === 'Images') return f.type === 'image';
                if (selectedCategory === 'Videos') return f.type === 'video';
                if (selectedCategory === 'Docs') return f.type === 'doc';
                if (selectedCategory === 'Sheets') return f.type === 'sheet';
                if (selectedCategory === 'PDF') return f.type === 'pdf';
                return true;
            });
        }

        // Search Filter
        if (searchTerm) {
            filtered = filtered.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return filtered;
    };

    const filteredFiles = getFilteredFiles();

    // Icons Helper
    const getFileIcon = (type: FileItem['type']) => {
        switch (type) {
            case 'image': return <Image className="text-purple-500" size={32} />;
            case 'video': return <FileVideo className="text-red-500" size={32} />;
            case 'doc': return <FileText className="text-blue-500" size={32} />;
            case 'sheet': return <FileSpreadsheet className="text-green-500" size={32} />;
            case 'pdf': return <FileText className="text-red-400" size={32} />; // Using FileText for PDF generally
            case 'code': return <FileCode className="text-yellow-500" size={32} />;
            default: return <File className="text-gray-400" size={32} />;
        }
    };

    return (
        <div className="flex h-full bg-[#f9f9f9] dark:bg-[#202020] text-gray-800 dark:text-gray-100 font-sans">
            
            {/* Sidebar */}
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
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categories</h3>
                    {(['All', 'Images', 'Videos', 'Docs', 'Sheets', 'PDF'] as Category[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedCategory === cat 
                                ? 'bg-white dark:bg-white/10 shadow-sm font-medium' 
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {cat === 'All' && <Home size={16} />}
                            {cat === 'Images' && <Image size={16} />}
                            {cat === 'Videos' && <FileVideo size={16} />}
                            {cat === 'Docs' && <FileText size={16} />}
                            {cat === 'Sheets' && <FileSpreadsheet size={16} />}
                            {cat === 'PDF' && <FileText size={16} />}
                            <span>{cat}</span>
                        </button>
                    ))}

                    <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Locations</h3>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400">
                        <HardDrive size={16} />
                        <span>This PC</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400">
                        <Cloud size={16} />
                        <span>OneDrive</span>
                    </button>
                     <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400">
                        <Download size={16} />
                        <span>Downloads</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Header / Toolbar */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525]">
                    
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="hover:bg-gray-100 dark:hover:bg-white/10 px-2 py-1 rounded cursor-pointer">Vault</span>
                        <ChevronRight size={14} className="text-gray-400" />
                        <span className="font-medium hover:bg-gray-100 dark:hover:bg-white/10 px-2 py-1 rounded cursor-pointer">{selectedCategory}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
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

                        {/* View Toggle */}
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

                {/* File Area */}
                <div className="flex-1 overflow-y-auto p-4" onClick={() => {}}>
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
                                    className="group flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-white/10 border border-transparent hover:border-blue-100 dark:hover:border-white/5 cursor-pointer transition-all"
                                >
                                    <div className="w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm group-hover:shadow-md transition-shadow relative overflow-hidden">
                                        {file.type === 'image' ? (
                                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                        ) : (
                                            getFileIcon(file.type)
                                        )}
                                    </div>
                                    <span className="text-xs text-center font-medium truncate w-full px-1">{file.name}</span>
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
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Modified</th>
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
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {file.date}
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
                
                {/* Footer status bar */}
                <div className="bg-white dark:bg-[#252525] border-t border-gray-200 dark:border-gray-700 px-4 py-1 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{filteredFiles.length} items</span>
                    <span>All items synchronized</span>
                </div>
            </div>
        </div>
    );
};