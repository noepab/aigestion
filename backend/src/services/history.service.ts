import { injectable } from 'inversify';

import { IMetricSnapshot, MetricSnapshot } from '../models/metric-snapshot.model';

@injectable()
export class HistoryService {
  /**
   * Persiste una nueva instantánea.
   */
  async pushSnapshot(data: Partial<IMetricSnapshot>): Promise<IMetricSnapshot> {
    const snapshot = await MetricSnapshot.create(data);
    return snapshot;
  }

  /**
   * Obtiene el historial de una métrica concreta.
   */
  async getHistory(metric: string): Promise<IMetricSnapshot[]> {
    return MetricSnapshot.find({ metric })
      .sort({ timestamp: -1 })
      .lean() as unknown as IMetricSnapshot[];
  }
}
