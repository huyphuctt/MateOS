import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const CopilotApp: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hi there! I'm Copilot. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder for the AI response
    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMsgId, role: 'assistant', content: '' }]);

    try {
      const stream = await geminiService.sendMessageStream(userMsg.content);
      
      let fullText = '';
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
           fullText += c.text;
           setMessages(prev => prev.map(msg => 
             msg.id === botMsgId ? { ...msg, content: fullText } : msg
           ));
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, content: "Sorry, I encountered an error connecting to the service. Please check your API key." } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-[#2b2b2b]/50 flex items-center justify-between backdrop-blur-sm">
         <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500 fill-blue-500" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Copilot</h2>
         </div>
         <span className="text-xs text-green-600 bg-green-100/80 dark:bg-green-900/50 px-2 py-0.5 rounded-full">Gemini 3 Flash</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'assistant' 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
            }`}>
              {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed backdrop-blur-sm ${
              msg.role === 'user'
                ? 'bg-blue-600/90 text-white'
                : 'bg-white/80 dark:bg-[#333]/80 text-gray-800 dark:text-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1].role === 'user' && (
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                 <Bot size={18} />
               </div>
               <div className="bg-white/80 dark:bg-[#333]/80 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm backdrop-blur-sm">
                 <div className="flex gap-1">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
               </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white/50 dark:bg-[#2b2b2b]/50 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="w-full bg-white/50 dark:bg-black/30 text-gray-800 dark:text-white rounded-xl pl-4 pr-12 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-200/50 dark:border-gray-600/50"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">AI-generated content may be incorrect.</p>
        </div>
      </div>
    </div>
  );
};