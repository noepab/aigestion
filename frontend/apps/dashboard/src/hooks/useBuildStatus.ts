import { useState, useEffect } from 'react';

export function useBuildStatus() {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setStatus('success');
  }, []);

  return { status, builds: [] };
}
