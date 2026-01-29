
import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, Bell, Clock, Calendar, Info } from 'lucide-react';
import { useGlobal } from '../../contexts/GlobalContext';
import { NotificationItem } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotificationsApp: () => void;
  onItemClick?: (item: NotificationItem, isNotification: boolean) => void;
  theme: 'aero' | 'aqua';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
    isOpen, 
    onClose, 
    onOpenNotificationsApp,
    onItemClick,
    theme
}) => {
  const { notifications, recentItems } = useGlobal();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
            // Check if the click was on a trigger button
            const target = event.target as HTMLElement;
            if (!target.closest('[data-panel-trigger]')) {
                onClose();
            }
        }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleItemClick = (item: NotificationItem, isNotification: boolean) => {
      if (onItemClick) {
          onItemClick(item, isNotification);
          onClose();
      }
  };

  const topOffset = theme === 'aqua' ? 'top-7' : 'top-0';
  const bottomOffset = theme === 'aero' ? 'bottom-12' : 'bottom-0';

  return (
    <div 
        ref={panelRef}
        className={`fixed ${topOffset} right-0 ${bottomOffset} w-96 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-3xl border-l border-white/20 dark:border-gray-700/30 shadow-2xl z-[10000] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] transform ${isOpen ? 'translate-x-0 mr-2' : 'translate-x-full'} mt-2 mb-2 rounded-xl flex flex-col overflow-hidden`}
    >
        <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
             <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                Action Center
             </h3>
             <div className="flex gap-1">
                <button 
                    onClick={() => { onOpenNotificationsApp(); onClose(); }}
                    className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    title="Open Notifications App"
                >
                    <ExternalLink size={16} className="text-gray-500" />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={16} className="text-gray-500" />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            
            {/* NOTIFICATIONS SECTION */}
            <div className="mb-6">
                 <div className="flex items-center justify-between mb-3">
                     <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Bell size={12} /> Notifications
                     </h4>
                     <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
                         {notifications.length}
                     </span>
                 </div>

                 {notifications.length === 0 ? (
                    <div className="text-center py-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20 dark:border-white/5">
                        <p className="text-sm text-gray-500">No new notifications</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.slice(0, 5).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => handleItemClick(item, true)}
                                className="bg-white/60 dark:bg-[#2b2b2b]/60 border border-white/40 dark:border-white/5 p-3 rounded-xl flex items-start gap-3 hover:bg-white/90 dark:hover:bg-[#2b2b2b] transition-colors shadow-sm group cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-white/10">
                                    {item.icon || <Info size={16} className="text-blue-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs truncate pr-2">{item.title}</h4>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap opacity-70">{item.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5 leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                         {notifications.length > 5 && (
                             <button 
                                onClick={() => { onOpenNotificationsApp(); onClose(); }}
                                className="w-full py-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                             >
                                 View all {notifications.length} notifications
                             </button>
                         )}
                    </div>
                )}
            </div>

            {/* RECENT ACTIVITY SECTION */}
            <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock size={12} /> Recent Activity
                </h4>
                
                {recentItems.length === 0 ? (
                     <div className="text-center py-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20 dark:border-white/5">
                        <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentItems.slice(0, 5).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => handleItemClick(item, false)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors shadow-sm">
                                    {item.icon || <Clock size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.title}</div>
                                    <div className="text-xs text-gray-500 truncate">{item.description} • {item.timestamp}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

