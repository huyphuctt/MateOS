import React, { useEffect, useState } from 'react';
import { Command } from 'lucide-react';

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500; // 2.5 seconds boot time
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Slight delay after full bar
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[10000]">
      <div className="mb-16">
        <Command size={80} className="text-white" />
      </div>
      
      {/* Boot Progress Bar */}
      <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};