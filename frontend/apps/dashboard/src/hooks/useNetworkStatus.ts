import { useEffect,useState } from 'react';

interface NetworkStatus {
  online: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
  saveData: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    effectiveType: (navigator as any).connection?.effectiveType,
    saveData: (navigator as any).connection?.saveData || false,
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus({
        online: navigator.onLine,
        effectiveType: (navigator as any).connection?.effectiveType,
        saveData: (navigator as any).connection?.saveData || false,
      });
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}
