import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Search, X } from 'lucide-react';

export const BrowserApp: React.FC = () => {
  const [url, setUrl] = useState('https://bing.com');
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000); // Simulate load
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
        {/* Tab Strip */}
        <div className="flex items-end px-2 pt-2 gap-1 bg-gray-200/50 dark:bg-[#1a1a1a]/50 border-b border-white/10">
            <div className="bg-white/80 dark:bg-[#333]/80 px-3 py-2 rounded-t-lg text-xs flex items-center gap-2 min-w-[150px] shadow-sm text-gray-800 dark:text-gray-200 backdrop-blur-sm">
                <span className="flex-1 truncate">New Tab</span>
                <X size={12} className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5 cursor-pointer"/>
            </div>
            <div className="px-2 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 cursor-pointer">+</div>
        </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-3 p-2 bg-white/60 dark:bg-[#333]/60 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md">
        <div className="flex gap-2">
            <button className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-400 transition-colors"><ArrowLeft size={16} /></button>
            <button className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-400 transition-colors"><ArrowRight size={16} /></button>
            <button className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-400 transition-colors" onClick={() => setIsLoading(true)}><RotateCw size={16} /></button>
        </div>
        
        <form onSubmit={handleNavigate} className="flex-1">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={14} />
                </div>
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-black/5 dark:bg-black/20 text-gray-800 dark:text-gray-200 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow border border-transparent focus:border-blue-500/30 placeholder-gray-500"
                />
            </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white/90 dark:bg-[#1a1a1a]">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10 backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
        <iframe 
            src="https://www.bing.com/search?q=mateos+desktop" 
            className="w-full h-full border-none"
            title="Browser Content"
            sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
};