// src/types/express.d.ts
import { IUser } from '../models/User';

declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Optional authenticated user information attached by authentication middleware.
     */
    user?: { id: string; role?: string };
  }
}
