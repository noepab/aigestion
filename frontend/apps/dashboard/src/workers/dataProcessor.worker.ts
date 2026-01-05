import * as Comlink from 'comlink';

export interface DataProcessor {
  processLargeDataset(data: any[]): Promise<any[]>;
  filterLogs(logs: any[], filter: string): Promise<any[]>;
  calculateStatistics(data: number[]): Promise<{ mean: number; median: number; stdDev: number }>;
}

const processor: DataProcessor = {
  async processLargeDataset(data: any[]) {
    // Simulate heavy processing
    const start = performance.now();
    const processed = data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now(),
      hash: Math.random().toString(36).substring(7),
    }));
    const end = performance.now();
    console.log(`[Worker] Processed ${data.length} items in ${(end - start).toFixed(2)}ms`);
    return processed;
  },

  async filterLogs(logs: any[], filter: string) {
    if (!filter) return logs;
    const lowerFilter = filter.toLowerCase();
    return logs.filter(log =>
      log.mensaje.toLowerCase().includes(lowerFilter) ||
      log.nivel.toLowerCase().includes(lowerFilter) ||
      log.fuente.toLowerCase().includes(lowerFilter)
    );
  },

  async calculateStatistics(data: number[]) {
    if (data.length === 0) return { mean: 0, median: 0, stdDev: 0 };

    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / data.length;

    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]!
      : (sorted[mid - 1]! + sorted[mid]!) / 2;

    const squareDiffs = data.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    return { mean, median, stdDev };
  }
};

Comlink.expose(processor);
