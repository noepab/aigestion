import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Code, Loader2 } from 'lucide-react';
import { AIService } from '../../api/ai.api';
// Using a simple markdown parser for now or assuming text is mostly plain.
// In a real app we'd use 'react-markdown'. For now, we'll basic formatting via CSS/whitespace.

interface Message {
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
}

export function NexusChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        // Assistant message logic follows
        // Optimistic assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

        let fullText = '';

        await AIService.streamPrompt(userMsg, {
            onText: (text) => {
                fullText += text;
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = fullText;
                    }
                    return newMsgs;
                });
            },
            onDone: () => {
                setIsLoading(false);
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg) lastMsg.isStreaming = false;
                    return newMsgs;
                });
            },
            onError: (err) => {
                console.error(err);
                setIsLoading(false);
                setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error connecting to AI Agent.' }]);
            }
        });
    };

    // Helpert to render content with tree detection
    const renderContent = (content: string) => {
        // Detect ASCII Tree (starts with "Project Structure:")
        if (content.includes('Project Structure:')) {
            const [treePart, ...rest] = content.split('Here is the codebase context:');
            const mainContent = rest.join('Here is the codebase context:') || ''; // In case it's just the tree? unlikely

            return (
                <div className="space-y-2">
                    <div className="bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-cyan-300 overflow-x-auto max-h-48">
                        <div className="flex items-center gap-2 mb-1 text-slate-400 border-b border-slate-800 pb-1">
                            <Code size={12} />
                            <span>Context Tree</span>
                        </div>
                        <pre>{treePart.trim()}</pre>
                    </div>
                    <div className="whitespace-pre-wrap">{mainContent.trim()}</div>
                </div>
            );
        }
        return <div className="whitespace-pre-wrap">{content}</div>;
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 max-w-[90vw] h-[600px] max-h-[80vh] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center backdrop-blur">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="font-semibold text-white">Nexus Agent</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm italic">
                                <Bot size={32} className="mb-2 opacity-50" />
                                <p>Ask me anything about the system...</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                                    msg.role === 'user'
                                        ? 'bg-cyan-600 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                }`}>
                                    {renderContent(msg.content)}
                                    {msg.isStreaming && (
                                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-cyan-400 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/30 flex gap-2">
                        <input
                            title="chat"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            )}

            {/* Launcher */}
            <button
                id="assistant-widget"
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto p-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 group"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />}
            </button>
        </div>
    );
}
