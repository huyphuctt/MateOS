import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { RecentItem, AppId } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  recentItems: RecentItem[];
  onOpenNotificationsApp: () => void;
  theme: 'aero' | 'aqua';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
    isOpen, 
    onClose, 
    recentItems, 
    onOpenNotificationsApp,
    theme
}) => {
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

  // Adjust positioning based on theme
  // Aqua usually has a top bar, so we might want to respect that (top-7)
  // Aero is bottom-heavy, so full height is fine, or leave room for bottom taskbar?
  // Windows 11 Notification center usually floats above taskbar or is full height on side.
  // We'll stick to full height right-side panel for consistency.
  const topOffset = theme === 'aqua' ? 'top-7' : 'top-0';
  const bottomOffset = theme === 'aero' ? 'bottom-12' : 'bottom-0';

  return (
    <div 
        ref={panelRef}
        className={`fixed ${topOffset} right-0 ${bottomOffset} w-80 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-3xl border-l border-white/20 dark:border-gray-700/30 shadow-2xl z-[10000] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} mr-2 mt-2 mb-2 rounded-xl`}
    >
        <div className="p-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Notifications</h3>
                <div className="flex gap-1">
                    <button 
                        onClick={() => { onOpenNotificationsApp(); onClose(); }}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                        title="Open Notifications App"
                    >
                        <ExternalLink size={16} className="text-gray-500" />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Recent Items List */}
                {recentItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">No new notifications</div>
                ) : (
                    recentItems.map(item => (
                        <div key={item.id} className="bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 rounded-xl flex items-start gap-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-default shadow-sm group">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate pr-2">{item.title}</h4>
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{item.timestamp}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
                            </div>
                        </div>
                    ))
                )}

                {/* Widgets Section Mock */}
                <div className="pt-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Widgets</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="aspect-square bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white flex flex-col justify-between shadow-lg cursor-pointer hover:brightness-110 transition-all">
                            <span className="text-xs font-medium">Weather</span>
                            <div>
                                <span className="text-2xl font-bold">72°</span>
                                <p className="text-[10px] opacity-80">Sunny</p>
                            </div>
                        </div>
                        <div className="aspect-square bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col justify-between shadow-lg border border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                            <span className="text-xs font-medium text-gray-500">Stocks</span>
                            <div>
                                <span className="text-lg font-bold text-green-500">+1.2%</span>
                                <p className="text-[10px] text-gray-400">AAPL</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
