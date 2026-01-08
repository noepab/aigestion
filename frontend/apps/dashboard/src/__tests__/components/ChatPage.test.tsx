// src/__tests__/components/ChatPage.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPage from '../../pages/ChatPage';
import * as aiApi from '../../api/ai.api';

// Mock the streamChat method to return an async generator of SSE chunks
jest.mock('../../api/ai.api', () => ({
  AIService: {
    streamChat: jest.fn(),
  },
}));

function* mockStream() {
  // First token
  yield { type: 'text', content: 'Hello' } as any;
  // Second token
  yield { type: 'text', content: ', world!' } as any;
}

describe('ChatPage streaming integration', () => {
  beforeEach(() => {
    // Reset mock before each test
    (aiApi.AIService.streamChat as jest.Mock).mockImplementation((_messages, callbacks) => {
      const gen = mockStream();
      (async () => {
        for (const chunk of gen) {
          callbacks.onText(chunk.content);
        }
        callbacks.onDone();
      })();
    });
  });

  it('streams AI response tokens and displays them in real time', async () => {
    render(<ChatPage />);

    const input = screen.getByPlaceholderText('Ask Nexus AI...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type a prompt and submit
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.click(sendButton);

    // User message should appear immediately
    expect(screen.getByText('Hi')).toBeInTheDocument();

    // Wait for streamed tokens to appear in the assistant bubble
    await waitFor(() => {
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });
  });
});
