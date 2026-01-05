import { useState } from 'react';
import { useWorker } from '../../hooks/useWorker';
import { motion } from 'framer-motion';

export function HeavyComputationWidget() {
  const { worker, isReady } = useWorker();
  const [result, setResult] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const handleCalculate = async () => {
    if (!worker) return;
    setCalculating(true);
    setResult(null);
    setDuration(null);

    const start = performance.now();
    try {
      // Calculate Fibonacci of 42 (very slow recursively)
      const res = await worker.expensiveCalculation(42);
      setResult(res);
      setDuration(performance.now() - start);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
    >
      <h2 className="text-2xl font-bold text-pink-400 mb-4">⚡ Neural Processor (Web Worker)</h2>
      <div className="space-y-4">
        <p className="text-gray-400 text-sm">
          Offload heavy computations to a background thread to keep the UI responsive (60 FPS).
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleCalculate}
            disabled={!isReady || calculating}
            className={`
              px-6 py-3 rounded-lg font-bold transition-all
              ${
                calculating
                  ? 'bg-pink-500/20 text-pink-300 cursor-wait'
                  : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {calculating ? 'Processing...' : 'Run Heavy Task'}
          </button>

          {duration && (
            <span className="text-green-400 font-mono text-sm">
              Completed in {(duration / 1000).toFixed(2)}s
            </span>
          )}
        </div>

        {result !== null && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-pink-500/20">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Result</div>
            <div className="text-2xl font-mono text-white">{result.toLocaleString()}</div>
          </div>
        )}

        <div className="text-xs text-gray-600">
          * Calculates Fibonacci(42) recursively. Without worker, this would freeze the browser.
        </div>
      </div>
    </motion.div>
  );
}
