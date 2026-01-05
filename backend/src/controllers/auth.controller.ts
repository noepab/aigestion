import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { User } from '../models/User';
import { logger } from '../utils/logger';


export const register = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = _req.body;

    // Validar datos de entrada
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Por favor, proporcione email, contraseña y nombre',
      });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
      });
      return;
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user', // Por defecto, los nuevos usuarios son 'user'
    });

    await user.save();

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    // No devolver la contraseña en la respuesta
    const userResponse: any = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    logger.error(error, 'Error en el registro:');
    res.status(500).json({
      success: false,
      message: 'Error al registrar el usuario',
    });
  }
};

export const login = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = _req.body;

    // Validar datos de entrada
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Por favor, proporcione email y contraseña',
      });
      return;
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    // Verificar si la cuenta está bloqueada
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      res.status(403).json({
        success: false,
        message: `Cuenta bloqueada temporalmente. Intente de nuevo en ${remainingMinutes} minutos.`,
      });
      return;
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Incrementar intentos fallidos
      user.loginAttempts += 1;

      // Bloquear si excede 5 intentos
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Bloqueo de 30 min
        user.loginAttempts = 0; // Resetear intentos después del bloqueo
      }

      await user.save();

      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    // Login exitoso: Resetear intentos y actualizar lastLogin
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generar token JWT con fingerprint
    const fingerprint = {
      ip: _req.ip || 'unknown',
      userAgent: _req.headers['user-agent'] || 'unknown',
    };

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        fingerprint,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    // No devolver la contraseña en la respuesta
    const userResponse: any = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    logger.error(error, 'Error en el inicio de sesión:');
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // El usuario ya está disponible en req.user gracias al middleware de autenticación
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(error, 'Error al obtener perfil de usuario:');
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil de usuario',
    });
  }
};
