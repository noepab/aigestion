import { create } from 'zustand';
import { createJSONStorage,persist } from 'zustand/middleware';

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
      addMessage: (message: AgentMessage) =>
        set((state: AgentState) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (updater: (msg: AgentMessage) => AgentMessage) =>
        set((state: AgentState) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = updater(newMessages[newMessages.length - 1]);
          }
          return { messages: newMessages };
        }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setConnected: (connected: boolean) => set({ isConnected: connected }),
      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: 'nexus-agent-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AgentState) => ({ messages: state.messages }), // Only persist message history
    }
  )
);
