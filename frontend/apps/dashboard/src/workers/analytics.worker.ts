/* eslint-disable no-restricted-globals */

// This worker handles heavy analytics processing to keep the main thread fluid.
const ctx: Worker = self as any;

ctx.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'PROCESS_DATASET') {
    const result = processHeavyDataset(payload);
    ctx.postMessage({ type: 'DATASET_PROCESSED', payload: result });
  }
});

function processHeavyDataset(data: number[]): { average: number; max: number; min: number; trend: string } {
  // Simulate heavy computation
  const sorted = [...data].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const average = sum / sorted.length;
  const max = sorted[sorted.length - 1];
  const min = sorted[0];

  // Simple trend analysis
  const firstChunk = data.slice(0, Math.floor(data.length / 2));
  const secondChunk = data.slice(Math.floor(data.length / 2));
  const firstAvg = firstChunk.reduce((a, b) => a + b, 0) / firstChunk.length;
  const secondAvg = secondChunk.reduce((a, b) => a + b, 0) / secondChunk.length;

  return {
    average,
    max,
    min,
    trend: secondAvg > firstAvg ? 'UP' : 'DOWN'
  };
}

export {};
