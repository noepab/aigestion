import mongoose, { Document, Schema } from 'mongoose';

export interface IUsageRecord extends Document {
  userId: string;
  provider: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimate: number; // For internal auditing
  timestamp: Date;
}

const usageRecordSchema = new Schema<IUsageRecord>(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    modelId: { type: String, required: true },
    promptTokens: { type: Number, required: true },
    completionTokens: { type: Number, required: true },
    totalTokens: { type: Number, required: true },
    costEstimate: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

export const UsageRecord = mongoose.model<IUsageRecord>('UsageRecord', usageRecordSchema);
