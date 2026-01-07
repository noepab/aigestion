import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UsageRecord extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  modelId: string;

  @Prop({ required: true })
  promptTokens: number;

  @Prop({ required: true })
  completionTokens: number;

  @Prop({ required: true })
  totalTokens: number;

  @Prop({ default: 0 })
  costEstimate: number;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const UsageRecordSchema = SchemaFactory.createForClass(UsageRecord);
