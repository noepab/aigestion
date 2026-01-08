import React, { useState, useCallback } from 'react';
const generateId = () => Math.random().toString(36).substring(2, 10);
import { ChatInterface } from '@shared/design-system/organisms/ChatInterface';
import { ChatMessage } from '@shared/design-system/molecules/NexusChatBubble';
import { AIService } from '../api/ai.api';

const ChatPage: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome-msg',
            role: 'assistant',
            content: 'Hello! I am Nexus AI. How can I facilitate your work today?',
            timestamp: Date.now()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = useCallback(async (content: string) => {
        const userMsg: ChatMessage = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now()
        };

        // 1. Add User Message
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // 2. Prepare AI Message Placeholder
        const aiMsgId = generateId();
        const aiMsg: ChatMessage = {
            id: aiMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);

        // 3. Helper to update AI message content
        const updateAiMessage = (chunk: string) => {
            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId
                    ? { ...msg, content: msg.content + chunk }
                    : msg
            ));
        };

        // 4. Stream response
        const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

        await AIService.streamChat(history, {
            onText: (text) => updateAiMessage(text),
            onDone: () => setIsLoading(false),
            onError: (err) => {
                console.error('Chat Error:', err);
                setIsLoading(false);
                updateAiMessage('\n\n[Error: Failed to get response]');
            }
        });

    }, [messages]);

    return (
        <div className="h-full flex flex-col p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Nexus Chat</h1>
            <div className="flex-1 min-h-0">
                <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default ChatPage;
