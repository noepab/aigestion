import * as Comlink from 'comlink';

const workerApi = {
  processLargeData: (data: any[]) => {
    // Simulate heavy processing
    return data.map((item) => ({
      ...item,
      processed: true,
      timestamp: Date.now(),
    }));
  },
  expensiveCalculation: (n: number) => {
    // Simulate expensive calculation (e.g., Fibonacci)
    const fib = (num: number): number => {
      if (num <= 1) {return 1;}
      return fib(num - 1) + fib(num - 2);
    };
    return fib(n);
  },
};

Comlink.expose(workerApi);

export type WorkerApi = typeof workerApi;
