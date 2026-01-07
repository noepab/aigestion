import { useCallback } from 'react';

import { useRole } from '../context/RoleContext';
import { AgentMessage,useAgentStore } from '../store/useAgentStore';

interface UseAgentReturn {
  messages: AgentMessage[];
  isLoading: boolean;
  isConnected: boolean;
  sendMessage: (prompt: string) => Promise<void>;
  clearHistory: () => void;
}

export const useAgent = (): UseAgentReturn => {
  const {
    messages,
    isLoading,
    isConnected,
    addMessage,
    updateLastMessage,
    setLoading,
    setConnected,
    clearHistory
  } = useAgentStore();

  const sendMessage = useCallback(async (prompt: string) => {
    setLoading(true);

    // Optimistic UI update
    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
    };
    addMessage(userMsg);

    try {
      const response = await fetch('/api/v1/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {throw new Error('Failed to connect to AI Agent');}

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      setConnected(true);

      const assistantMsgId = (Date.now() + 1).toString();
      addMessage({ id: assistantMsgId, role: 'assistant', content: '', type: 'text' });

      console.log('Sending stream request for:', prompt);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) {break;}

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {break;}

            try {
              const data = JSON.parse(dataStr);

              if (data.type === 'text') {
                updateLastMessage(msg => ({
                  ...msg,
                  content: msg.content + data.content
                }));
              } else if (data.type === 'a2ui') {
                // When we receive an a2ui signal, we push a new message of type a2ui
                addMessage({
                  id: (Date.now() + 2).toString(),
                  role: 'assistant',
                  content: '',
                  type: 'tool_call', // Use tool_call or a new type
                  toolCallData: { type: data.component, props: data.props }
                });
              } else if (data.type === 'tool_partial') {
                // Accumulate tool calls here in future iterations
              }
            } catch (e) {
              console.error('Error parsing stream chunks', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Agent Error:', error);
      addMessage({
        id: Date.now().toString(),
        role: 'system',
        content: 'Connection Error: Failed to reach Nexus AI.'
      });
    } finally {
      setLoading(false);
      setConnected(false);
    }
  }, [messages, addMessage, updateLastMessage, setLoading, setConnected]);

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearHistory
  };
};
