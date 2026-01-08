import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { NexusInput } from '../atoms/NexusInput';
import { NexusButton } from '../atoms/NexusButton';
import { NexusChatBubble, ChatMessage } from '../molecules/NexusChatBubble';

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = 'Ask Nexus AI...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className={`flex flex-col h-full w-full bg-slate-900/50 rounded-3xl border border-slate-700/50 backdrop-blur-sm shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white tracking-wide">Nexus Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-xs text-slate-400 font-medium">{isLoading ? 'Processing...' : 'Online'}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-2">
              <Sparkles className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm">Start a conversation with Nexus AI</p>
          </div>
        ) : (
          messages.map((msg) => (
            <NexusChatBubble
              key={msg.id}
              message={msg}
            />
          ))
        )}

        {/* Loading Bubble */}
        {isLoading && (
          <NexusChatBubble
            message={{
              id: 'loading-indicator',
              role: 'assistant',
              content: '',
              timestamp: Date.now()
            }}
            isTyping={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <NexusInput
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            fullWidth
            variant="glass"
            className="flex-1"
            disabled={isLoading}
          />
          <NexusButton
            type="submit"
            variant="primary"
            disabled={!inputValue.trim() || isLoading}
            className="!p-3 rounded-xl"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </NexusButton>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-slate-500">
            AI can make mistakes. Check important information.
          </span>
        </div>
      </div>
    </div>
  );
};
