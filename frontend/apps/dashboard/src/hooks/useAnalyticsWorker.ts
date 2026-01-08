import { useEffect, useRef, useState } from 'react';

// Define the worker type inline for simplicity in this context
interface AnalyticsWorker extends Worker {
  postMessage(message: { type: string; payload: any }): void;
}

export const useAnalyticsWorker = () => {
  const workerRef = useRef<AnalyticsWorker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Dynamically import the worker
    const worker = new Worker(new URL('../workers/analytics.worker.ts', import.meta.url), {
      type: 'module'
    }) as AnalyticsWorker;

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'DATASET_PROCESSED') {
        setData(payload);
        setIsProcessing(false);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const processDataset = (dataset: number[]) => {
    if (workerRef.current) {
      setIsProcessing(true);
      workerRef.current.postMessage({ type: 'PROCESS_DATASET', payload: dataset });
    }
  };

  return { processDataset, isProcessing, data };
};
