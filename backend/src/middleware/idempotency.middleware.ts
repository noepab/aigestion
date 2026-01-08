import type { NextFunction, Request, Response } from 'express-serve-static-core';
import { cache } from '../utils/cacheManager';
import { logger } from '../utils/logger';

/**
 * Middleware de Idempotencia
 * Garantiza que peticiones repetidas con el mismo 'Idempotency-Key' retornen el mismo resultado
 * sin ejecutar la lógica de negocio múltiples veces.
 */
export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  // Solo aplicar si hay una clave y NO es un GET (las lecturas son idempotentes por naturaleza)
  if (!idempotencyKey || req.method === 'GET') {
    return next();
  }

  // Si el usuario está autenticado, incluimos su ID en el prefijo para evitar colisiones entre usuarios
  const userId = (req as any).user?.id || 'anonymous';
  const cacheKey = `idempotency:${userId}:${idempotencyKey}`;

  try {
    // 1. Intentar recuperar respuesta previa del caché (L1 o L2)
    const cachedResponse = await cache.get(cacheKey);

    if (cachedResponse) {
      logger.info({ cacheKey, path: req.path }, 'Idempotency HIT: Retornando respuesta cacheada');
      res.setHeader('X-Idempotency-Hit', 'true');
      return res.status(cachedResponse.status).json(cachedResponse.body);
    }

    // 2. Interceptar res.json para guardar la respuesta antes de enviarla
    const originalJson = res.json;

    res.json = function (body: any): Response {
      // Restauramos el método original
      res.json = originalJson;

      // Guardar en caché solo si la respuesta es exitosa o error de cliente (2xx, 4xx)
      // Evitamos cachear errores de servidor (5xx) para permitir reintentos inmediatos
      if (res.statusCode < 500) {
        // TTL de 24 horas por defecto para llaves de idempotencia
        cache
          .set(
            cacheKey,
            {
              status: res.statusCode,
              body,
            },
            { ttl: 86400 },
          )
          .catch(err => {
            logger.error({ err, cacheKey }, 'Error al guardar respuesta de idempotencia');
          });
      }

      return originalJson.call(this, body);
    };

    res.setHeader('X-Idempotency-Hit', 'false');
    next();
  } catch (error) {
    logger.error({ error, cacheKey }, 'Error en middleware de idempotencia');
    next();
  }
};
