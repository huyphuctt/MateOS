import React, { useMemo } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { FileItem } from '../../types';

interface PreviewAppProps {
  tabs: FileItem[];
  activeTabId?: string;
  onUpdate: (newData: { tabs: FileItem[], activeTabId?: string }) => void;
}

const FileViewerContent: React.FC<{ file: FileItem }> = ({ file }) => {
    // Memoize DocViewer config (only used for Office docs now)
    const docs = useMemo(() => ([
        { uri: file.url, fileName: file.name }
    ]), [file.url, file.name]);

    const config = useMemo(() => ({
        header: {
            disableHeader: true,
            disableFileName: true,
            retainURLParams: false
        }
    }), []);

    const theme = useMemo(() => ({
        primary: "#5296d8",
        secondary: "#ffffff",
        tertiary: "#5296d899",
        text_primary: "#000000",
        text_secondary: "#ffffff",
        text_tertiary: "#00000099",
        disableThemeScrollbar: false,
    }), []);

    // Office Documents (Word, Excel) cannot be natively embedded without a viewer
    // We continue to use DocViewer for these specific types.
    if (file.type === 'doc' || file.type === 'sheet') {
         return (
            <div className="h-full w-full bg-white relative">
                <DocViewer 
                    documents={docs} 
                    pluginRenderers={DocViewerRenderers} 
                    style={{ height: '100%', width: '100%', overflowY: 'auto' }}
                    config={config}
                    theme={theme}
                />
            </div>
        );
    }

    // Determine MIME type hint for Embed
    // We set specific hints to ensure correct rendering behavior in the browser
    let typeHint: string | undefined = undefined;
    if (file.type === 'pdf') typeHint = 'application/pdf';
    // Force text/plain for markdown/code to ensure they display as text rather than downloading
    else if (file.type === 'markdown' || file.type === 'code' || file.type === 'unknown') typeHint = 'text/plain';
    
    // For images/videos, we let the browser sniff the type from the URL or headers to avoid mismatch

    return (
        <div className="h-full w-full bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center overflow-hidden">
            <embed 
                src={file.url} 
                type={typeHint}
                className="w-full h-full border-none block"
            />
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
                                 {tab.type === 'image' ? <ImageIcon size={12} className="text-purple-500" /> : <FileText size={12} className="text-blue-500" />}
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