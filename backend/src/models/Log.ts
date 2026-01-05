import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
  source: string;
  timestamp: Date;
}

const logSchema = new Schema<ILog>(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    source: {
      type: String,
      default: 'system',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true, // Index for sorting/filtering by time
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete logs older than 30 days
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Log = mongoose.model<ILog>('Log', logSchema);

export default Log;
