import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'tool_call';
  toolCallData?: any;
}

interface AgentState {
  messages: AgentMessage[];
  isLoading: boolean;
  isConnected: boolean;
  addMessage: (message: AgentMessage) => void;
  updateLastMessage: (updater: (msg: AgentMessage) => AgentMessage) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  clearHistory: () => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      isConnected: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (updater) =>
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = updater(newMessages[newMessages.length - 1]);
          }
          return { messages: newMessages };
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      setConnected: (connected) => set({ isConnected: connected }),
      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: 'nexus-agent-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ messages: state.messages }), // Only persist message history
    }
  )
);
