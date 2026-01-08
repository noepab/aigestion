// Stub implementation for task_queues to prevent runtime import errors.
// This file provides no‑op functions that can be safely called when the real
// queue system is unavailable (e.g., Docker services are down).

export const startAll = async (): Promise<void> => {
  // No operation – placeholder for starting background queue workers.
};

export const stopAll = async (): Promise<void> => {
  // No operation – placeholder for stopping background queue workers.
};

export const enqueue = async (_name: string, _payload: any): Promise<void> => {
  // No operation – placeholder for adding a job to a queue.
};

export const processQueue = async (
  _name: string,
  _handler: (payload: any) => Promise<void>,
): Promise<void> => {
  // No operation – placeholder for processing a queue.
};
