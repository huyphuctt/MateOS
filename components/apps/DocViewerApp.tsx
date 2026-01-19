import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, FileText, Image as ImageIcon, Video, FileCode, File, FileSpreadsheet, Download } from 'lucide-react';
import { FileItem } from '../../types';

interface PreviewAppProps {
  tabs: FileItem[];
  activeTabId?: string;
  onUpdate: (newData: { tabs: FileItem[], activeTabId?: string }) => void;
}

const FileViewerContent: React.FC<{ file: FileItem }> = ({ file }) => {
    const [textContent, setTextContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Fetch text content for Markdown or Code/Text files
    useEffect(() => {
        if (file.type === 'markdown' || file.type === 'code' || file.type === 'unknown' || file.name.endsWith('.txt')) {
             setLoading(true);
             fetch(file.url)
                .then(res => res.text())
                .then(text => {
                    setTextContent(text);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load text content", err);
                    setLoading(false);
                });
        }
    }, [file]);

    // Image Viewer
    if (file.type === 'image') {
        return (
             <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-auto p-4">
                 <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain shadow-lg" />
             </div>
        )
    }

    // Video Viewer
    if (file.type === 'video') {
        return (
            <div className="h-full w-full flex items-center justify-center bg-black">
                <video src={file.url} controls className="max-w-full max-h-full" />
            </div>
        )
    }

    // Markdown Viewer
    if (file.type === 'markdown') {
        return (
            <div className="h-full w-full bg-white dark:bg-[#1e1e1e] relative overflow-y-auto">
                <div className="max-w-4xl mx-auto p-8 lg:p-12">
                    <article className="prose prose-slate dark:prose-invert max-w-none">
                        {loading ? 'Loading...' : <ReactMarkdown>{textContent}</ReactMarkdown>}
                    </article>
                </div>
            </div>
        );
    }

    // Code / Text Viewer
    if (file.type === 'code' || file.type === 'unknown') {
         return (
            <div className="h-full w-full bg-white dark:bg-[#1e1e1e] relative overflow-y-auto p-4">
                 <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {loading ? 'Loading...' : textContent}
                 </pre>
            </div>
        );
    }
    
    // PDF Viewer (Native Embed)
    if (file.type === 'pdf') {
         return (
            <div className="h-full w-full bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center overflow-hidden">
                <embed 
                    src={file.url} 
                    type="application/pdf" 
                    className="w-full h-full border-none block"
                />
            </div>
        );
    }

    // Office Documents (Word, Excel) - Download Interface
    if (file.type === 'doc' || file.type === 'sheet') {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4">
                <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    {file.type === 'doc' ? (
                        <FileText size={48} className="text-blue-500"/>
                    ) : (
                        <FileSpreadsheet size={48} className="text-green-500"/>
                    )} 
                </div>
                <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center">
                    This file type cannot be previewed directly. Please download it to view on your device.
                </p>
                <a 
                    href={file.url} 
                    download={file.name}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all font-medium text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                    <Download size={18} />
                    Download File
                </a>
            </div>
        );
    }

    // Fallback for any other unexpected types
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
             <File size={48} className="mb-4 opacity-50" />
             <p>No preview available</p>
        </div>
    );
};

export const PreviewApp: React.FC<PreviewAppProps> = ({ tabs, activeTabId, onUpdate }) => {
    
    // If no tabs, show empty state
    if (tabs.length === 0) {
        return (
            <div className="h-full w-full bg-[#f3f3f3] dark:bg-[#202020] flex items-center justify-center text-gray-500">
                No open files
            </div>
        );
    }

    const activeFile = tabs.find(t => t.id === activeTabId) || tabs[0];

    const handleTabClick = (fileId: string) => {
        onUpdate({ tabs, activeTabId: fileId });
    };

    const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== fileId);
        
        let newActiveId = activeTabId;
        if (activeTabId === fileId) {
             // If closing active tab, select the one before it, or the first one
             if (newTabs.length > 0) {
                 const index = tabs.findIndex(t => t.id === fileId);
                 newActiveId = newTabs[Math.max(0, index - 1)].id;
             } else {
                 newActiveId = undefined;
             }
        }

        onUpdate({ tabs: newTabs, activeTabId: newActiveId });
    };

    // Helper to get icon for file type
    const getTabIcon = (type: FileItem['type']) => {
        switch (type) {
            case 'image': return <ImageIcon size={12} className="text-purple-500" />;
            case 'video': return <Video size={12} className="text-red-500" />;
            case 'code': return <FileCode size={12} className="text-yellow-500" />;
            case 'pdf': return <FileText size={12} className="text-red-400" />;
            case 'markdown': return <FileText size={12} className="text-blue-400" />;
            case 'sheet': return <FileSpreadsheet size={12} className="text-green-500" />;
            case 'doc': return <FileText size={12} className="text-blue-500" />;
            default: return <FileText size={12} className="text-gray-500" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f3f3f3] dark:bg-[#202020]">
            
            {/* Tab Bar */}
            <div className="h-9 flex items-center px-2 pt-1 gap-1 bg-[#f3f3f3] dark:bg-[#202020] border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
                 {tabs.map(tab => {
                     const isActive = tab.id === activeTabId;
                     return (
                         <div 
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`
                                group relative flex items-center gap-2 pl-3 pr-2 h-8 min-w-[120px] max-w-[200px] rounded-t-lg text-xs cursor-default select-none transition-colors
                                ${isActive 
                                    ? 'bg-white dark:bg-[#2b2b2b] text-gray-900 dark:text-gray-100 shadow-sm z-10' 
                                    : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'
                                }
                            `}
                         >
                             {/* Icon */}
                             <div className="shrink-0 opacity-70">
                                 {getTabIcon(tab.type)}
                             </div>
                             
                             {/* Title */}
                             <span className="truncate flex-1 font-medium">{tab.name}</span>

                             {/* Close Button */}
                             <button 
                                onClick={(e) => handleCloseTab(e, tab.id)}
                                className={`
                                    p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity
                                    ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                `}
                             >
                                 <X size={12} />
                             </button>
                             
                             {/* Divider for inactive tabs */}
                             {!isActive && (
                                 <div className="absolute right-0 top-2 bottom-2 w-[1px] bg-gray-300 dark:bg-gray-700 group-hover:hidden" />
                             )}
                         </div>
                     );
                 })}
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-white dark:bg-[#1e1e1e] overflow-hidden">
                {activeFile ? (
                    <FileViewerContent key={activeFile.id} file={activeFile} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Select a file to preview
                    </div>
                )}
            </div>
        </div>
    );
};