import React, { useState } from 'react';
import { Bell, Search, Filter, Trash2, Clock, Calendar, Info } from 'lucide-react';
import { RecentItem } from '../../types';
import { RECENT_ITEMS } from '../../data/mock';

export const NotificationsApp: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<RecentItem[]>(RECENT_ITEMS);

  const handleDelete = (id: number | string) => {
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearAll = () => setItems([]);

  const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="flex flex-col h-full bg-[#f3f3f3] dark:bg-[#202020] text-gray-900 dark:text-gray-100">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#2b2b2b] border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2">
                <Bell className="text-blue-500" size={20} />
                <h2 className="font-semibold text-lg">Notifications</h2>
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                    {items.length}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={clearAll}
                    className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded transition-colors"
                >
                    <Trash2 size={14} />
                    Clear All
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-[#2b2b2b]/50 backdrop-blur-sm overflow-x-auto">
            {['all', 'calendar', 'file', 'image', 'system'].map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                        filter === f 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Bell size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">No notifications found</p>
                </div>
            ) : (
                filteredItems.map(item => (
                    <div key={item.id} className="group bg-white dark:bg-[#2b2b2b] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700">
                            {item.icon || <Info size={20} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{item.title}</h3>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Clock size={10} /> {item.timestamp}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{item.type}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all self-start p-1"
                        >
                            <XCircleIcon />
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

const XCircleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);
