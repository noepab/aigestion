import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  path: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  type?: string;
  tags?: string[];
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      unique: true,
    },
    path: {
      type: String,
      required: [true, 'Please provide the project path'],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    type: {
      type: String,
      trim: true,
    },
    tags: [String],
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster search
ProjectSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
