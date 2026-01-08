import React, { useMemo } from 'react';
import { Bot, User } from 'lucide-react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface NexusChatBubbleProps {
    message: ChatMessage;
    isTyping?: boolean;
}

export const NexusChatBubble: React.FC<NexusChatBubbleProps> = ({ message, isTyping }) => {
    const isUser = message.role === 'user';

    const timeString = useMemo(() => {
        return new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [message.timestamp]);

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-violet-600 shadow-lg shadow-violet-500/20'}
        `}>
                    {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`
                relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-md
                ${isUser
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white/5 backdrop-blur-md border border-white/10 text-slate-200 rounded-tl-none'
                        }
            `}>
                        {/* Typing Indicator */}
                        {isTyping && !message.content ? (
                            <div className="flex space-x-1 h-5 items-center">
                                <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></div>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap font-sans">
                                {/* We will add Markdown support later via a specialized renderer */}
                                {message.content}
                            </div>
                        )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                        {timeString}
                    </span>
                </div>
            </div>
        </div>
    );
};
