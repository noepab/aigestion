import type { NextFunction, Request, Response } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';

import { config } from '../config';
import { User } from '../models/User';
import { logger } from '../utils/logger';

// Extender la interfaz Request para incluir la propiedad user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Obtener el token del encabezado Authorization
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Obtener el token de las cookies (opcional)
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // Verificar si existe el token
  if (!token) {
    (res as any).status(401).json({
      success: false,
      message: 'No autorizado. Por favor inicie sesión para continuar.',
    });
    return;
  }

  try {
    // 1. Verificar firma del token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
      iat: number;
      tokenVersion?: number;
      fingerprint?: {
        ip: string;
        userAgent: string;
      };
    };

    // 2. Verificar fingerprint (Zero Trust)
    if (decoded.fingerprint) {
      const currentUserAgent = req.headers['user-agent'] || 'unknown';

      // Nota: En producción real, la IP puede cambiar en móviles, usar con caución o lógica de rangos.
      // Aquí asumimos entorno controlado (Office/VPN)
      if (
        process.env.NODE_ENV === 'production' &&
        decoded.fingerprint.userAgent !== currentUserAgent
      ) {
        logger.warn(
          `UA Mismatch: ${decoded.id}. Token: ${decoded.fingerprint.userAgent} vs Req: ${currentUserAgent}`,
        );
        (res as any).status(401).json({ success: false, message: 'Sesión inválida.' });
        return;
      }
    }

    // 3. Verificar persistencia en DB (CRÍTICO)
    const user = await User.findById(decoded.id).select('+tokenVersion +lastPasswordChange');

    if (!user) {
      (res as any).status(401).json({ success: false, message: 'El usuario ya no existe.' });
      return;
    }

    // 4. Verificar versión del token (Revocación Instantánea)
    // Si el usuario incrementó su versión (logout global), tokens viejos mueren.
    if (user.tokenVersion && decoded.tokenVersion !== undefined) {
      if (decoded.tokenVersion !== user.tokenVersion) {
        (res as any)
          .status(401)
          .json({ success: false, message: 'Token revocado. Inicie sesión nuevamente.' });
        return;
      }
    }

    // 5. Verificar cambio de contraseña reciente
    // Si la contraseña cambió después de emitir el token, revocar.
    if (user.lastPasswordChange) {
      const changedTimestamp = Math.floor(user.lastPasswordChange.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        (res as any).status(401).json({
          success: false,
          message: 'Contraseña cambiada recientemente. Inicie sesión nuevamente.',
        });
        return;
      }
    }

    // Añadir usuario al objeto request
    (req as any).user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error(error, 'Auth Middleware Error');
    (res as any).status(401).json({
      success: false,
      message: 'Sesión inválida o expirada.',
    });
    return;
  }
};

// Middleware para verificar roles de usuario
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user || !roles.includes((req as any).user.role)) {
      (res as any).status(403).json({
        success: false,
        message: `El rol ${(req as any).user?.role} no tiene permiso para realizar esta acción.`,
      });
      return;
    }
    next();
  };
};
export const requireAuth = protect;
