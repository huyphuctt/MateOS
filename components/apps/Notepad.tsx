import React, { useState } from 'react';

export const NotepadApp: React.FC = () => {
  const [text, setText] = useState('Welcome to Notepad.\n\nType your notes here...');

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex gap-2 p-1 text-sm border-b border-gray-200/30 dark:border-gray-700/30 bg-white/40 dark:bg-black/20 backdrop-blur-sm">
        {['File', 'Edit', 'Format', 'View', 'Help'].map(item => (
            <button key={item} className="px-2 py-0.5 hover:bg-white/40 dark:hover:bg-white/10 rounded text-gray-700 dark:text-gray-300 cursor-default transition-colors">
                {item}
            </button>
        ))}
      </div>
      <textarea
        className="flex-1 w-full h-full p-4 resize-none focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm placeholder-gray-400 dark:placeholder-gray-600"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
      <div className="h-6 bg-white/40 dark:bg-[#007acc]/80 text-gray-600 dark:text-white text-xs flex items-center px-2 justify-end gap-4 border-t border-gray-200/30 dark:border-gray-700/30">
        <span>Ln {text.split('\n').length}, Col {text.length}</span>
        <span>UTF-8</span>
        <span>Windows (CRLF)</span>
      </div>
    </div>
  );
};