import mongoose, { Document, Schema } from 'mongoose';

/** Representa una instantánea de una métrica en el tiempo */
export interface IMetricSnapshot extends Document {
  metric: string; // nombre de la métrica (p. ej. "cpu", "requests")
  value: number; // valor numérico
  timestamp: Date; // cuándo se tomó la muestra
}

const MetricSnapshotSchema = new Schema<IMetricSnapshot>({
  metric: { type: String, required: true },
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Added composite index for HistoryService.getHistory
// MetricSnapshotSchema.index({ metric: 1, timestamp: -1 }); // Disabled due to test environment issue

export const MetricSnapshot = mongoose.model<IMetricSnapshot>(
  'MetricSnapshot',
  MetricSnapshotSchema,
);
