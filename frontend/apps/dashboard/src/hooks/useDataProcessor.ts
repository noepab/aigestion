import * as Comlink from 'comlink';
import { useEffect, useRef, useState } from 'react';

import type { DataProcessor } from '../workers/dataProcessor.worker';

export function useDataProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const processorRef = useRef<Comlink.Remote<DataProcessor> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/dataProcessor.worker.ts', import.meta.url), {
      type: 'module',
    });
    processorRef.current = Comlink.wrap<DataProcessor>(workerRef.current);
    setIsReady(true);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { processor: processorRef.current, isReady };
}
