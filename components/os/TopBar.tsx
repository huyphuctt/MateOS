import React, { useState, useEffect } from 'react';
import { Apple, Wifi, Battery, Search, Command } from 'lucide-react';

interface TopBarProps {
  activeAppTitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ activeAppTitle = 'Finder' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-7 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-[9999] text-xs font-medium text-gray-800 dark:text-gray-100 select-none">
      <div className="flex items-center gap-4 h-full">
        <div className="hover:bg-white/20 px-2 py-1 rounded transition-colors cursor-pointer">
           <Apple size={14} className="fill-current" />
        </div>
        <span className="font-bold cursor-default">{activeAppTitle}</span>
      </div>

      <div className="flex items-center gap-3 h-full">
        <div className="flex items-center gap-3 px-2">
            <Battery size={16} className="rotate-90" />
            <Wifi size={14} />
            <Search size={14} />
            <Command size={14} />
        </div>
        <div className="flex items-center gap-2">
            <span>{formatDate(time)}</span>
            <span>{formatTime(time)}</span>
        </div>
      </div>
    </div>
  );
};