import { Router } from 'express';
import { getMe, login, register } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { validateBody, schemas } from '../middleware/validation.middleware';

const router = Router();

// Rutas públicas con rate limiting estricto + validación Zod
router.post('/register', authLimiter, validateBody(schemas.auth.register), register);
router.post('/login', authLimiter, validateBody(schemas.auth.login), login);

// Ruta protegida - Requiere autenticación
router.get('/me', protect, getMe);

export default router;
