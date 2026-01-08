
export interface AIStreamCallbacks {
    onText: (text: string) => void;
    onDone: () => void;
    onError: (err: any) => void;
}

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const AIService = {
    streamPrompt: async (prompt: string, callbacks: AIStreamCallbacks) => {
        try {
            const response = await fetch(`${API_URL}/ai/prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {throw new Error('No reader available');}

            while (true) {
                const { done, value } = await reader.read();
                if (done) {break;}

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') {
                            callbacks.onDone();
                            return;
                        }

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.type === 'text') {
                                callbacks.onText(data.content);
                            }
                        } catch (e) {
                            console.warn('Failed to parse chunk', e);
                        }
                    }
                }
            }
        } catch (error) {
            callbacks.onError(error);
        }
    },

    streamChat: async (messages: { role: string; content: string }[], callbacks: AIStreamCallbacks) => {
        try {
            const prompt = messages[messages.length - 1].content;
            const history = messages.slice(0, -1);

            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // TODO: Add auth token if needed
                },
                body: JSON.stringify({ prompt, history }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) { throw new Error('No reader available'); }

            while (true) {
                const { done, value } = await reader.read();
                if (done) { break; }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') {
                            callbacks.onDone();
                            return;
                        }

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.type === 'text') {
                                callbacks.onText(data.content);
                            } else if (data.type === 'error') {
                                callbacks.onError(new Error(data.content));
                            }
                        } catch (e) {
                            console.warn('Failed to parse chunk', e);
                        }
                    }
                }
            }
        } catch (error) {
            callbacks.onError(error);
        }
    }
};
