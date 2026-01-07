import * as Comlink from 'comlink';
import { useEffect, useRef, useState } from 'react';

import type { WorkerApi } from '../workers/data.worker';

export function useWorker() {
  const workerRef = useRef<Comlink.Remote<WorkerApi> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = Comlink.wrap<WorkerApi>(worker);
    setIsReady(true);

    return () => {
      worker.terminate();
    };
  }, []);

  return { worker: workerRef.current, isReady };
}
