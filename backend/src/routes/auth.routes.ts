import { Router } from 'express';

import { getMe, login, register, enable2FA, verify2FA } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { schemas, validateBody } from '../middleware/validation.middleware';

const router = Router();

// Rutas públicas con rate limiting estricto + validación Zod
router.post('/register', authLimiter, validateBody(schemas.auth.register), register);
router.post('/login', authLimiter, validateBody(schemas.auth.login), login);
router.post('/2fa/enable', authLimiter, enable2FA);
router.post('/2fa/verify', authLimiter, verify2FA);

// Refresh Token (uses Cookie)
router.get('/refresh', authLimiter, (req, res, next) => {
    // @ts-ignore
    import('../controllers/auth.controller').then(c => c.refresh(req, res, next));
});

router.post('/logout', (req, res, next) => {
    // @ts-ignore
    import('../controllers/auth.controller').then(c => c.logout(req, res, next));
});

// Ruta protegida - Requiere autenticación
router.get('/me', protect, getMe);

export default router;
