import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  twoFactorSecret?: string;
  password: string;
  role: 'user' | 'admin' | 'dev' | 'sales' | 'god';
  lastLogin?: Date;
  isMfaEnabled: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  tokenVersion: number;
  lastPasswordChange: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;

  // Stripe fields
  stripeCustomerId?: string;
  subscriptionId?: string;
  stripeSubscriptionItemId?: string; // New: for metered billing items
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  subscriptionPlan?: string;

  // Refresh Tokens
  refreshTokens: {
    token: string; // Hashed in DB ideally, or just stored if handled by service
    expires: Date;
    familyId: string;
    ip: string;
    userAgent: string;
    createdAt: Date;
  }[];
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [50, 'El nombre no puede tener más de 50 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un correo electrónico válido'],
    },
    password: {
      type: String,
      required: false,
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false, // No devolver la contraseña por defecto
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'dev', 'sales', 'god'],
      default: 'user',
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        expires: { type: Date, required: true },
        familyId: { type: String, required: true },
        ip: { type: String, required: true },
        userAgent: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    twoFactorSecret: { type: String, select: false },
    isMfaEnabled: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    // Stripe Fields
    stripeCustomerId: { type: String, select: false },
    subscriptionId: { type: String, select: false },
    stripeSubscriptionItemId: { type: String, select: false },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'incomplete', 'trialing'],
    },
    subscriptionPlan: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete (ret as any).password; // No incluir la contraseña en las respuestas JSON
        return ret;
      },
    },
  }
);

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function (next) {
  // Solo hashear la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified('password')) { return next(); }

  try {
    const salt = await require('bcryptjs').genSalt(10);
    this.password = await require('bcryptjs').hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

const User = mongoose.model<IUser>('User', userSchema);

export { User };
