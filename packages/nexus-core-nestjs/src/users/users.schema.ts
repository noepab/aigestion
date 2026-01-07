import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ select: false })
  password: string;

  @Prop({ enum: ['user', 'admin', 'dev', 'sales', 'god'], default: 'user' })
  role: string;

  @Prop({ type: String, select: false })
  stripeCustomerId: string;

  @Prop({ type: String, select: false })
  subscriptionId: string;

  @Prop({ type: String, select: false })
  stripeSubscriptionItemId: string;

  @Prop({ enum: ['active', 'past_due', 'canceled', 'incomplete', 'trialing'], default: 'incomplete' })
  subscriptionStatus: string;

  @Prop()
  subscriptionPlan: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
