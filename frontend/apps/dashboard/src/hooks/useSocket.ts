import { useEffect,useState } from 'react';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    // Mock socket connection
    setIsConnected(true);
    setLastMessage(null); // Fix unused var
  }, []);

  return {
    isConnected,
    lastMessage,
    socket: {
      emit: (..._args: any[]) => {},
      on: (..._args: any[]) => {},
      off: (..._args: any[]) => {},
    },
  };
}
