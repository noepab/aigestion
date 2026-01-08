import { randomUUID } from 'node:crypto';

import type { Request, Response } from 'express-serve-static-core';

import { logger } from '../../utils/logger';
import { RemoteAccessRequest, RemoteSession } from './types';

export class RemoteAccessController {
  private pendingRequests = new Map<string, RemoteAccessRequest>();
  private activeSessions = new Map<string, RemoteSession>();

  // Solicitar acceso remoto
  async requestAccess(req: Request, res: Response): Promise<void> {
    try {
      const { fromUserId, toUserId, permissions } = req.body;

      // Validar permisos
      if (!permissions || typeof permissions !== 'object') {
        (res as any).status(400).json({
          success: false,
          error: 'Se deben especificar los permisos',
        });
        return;
      }

      // Crear solicitud
      const request: RemoteAccessRequest = {
        id: randomUUID(),
        fromUserId,
        toUserId,
        status: 'pending',
        permissions: {
          screenShare: !!permissions.screenShare,
          remoteControl: !!permissions.remoteControl,
          fileTransfer: !!permissions.fileTransfer,
          terminalAccess: !!permissions.terminalAccess,
        },
        authorizationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos para responder
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.pendingRequests.set(request.id, request);

      // En una implementación real, aquí notificaríamos al usuario objetivo
      logger.info(`Solicitud de acceso remoto creada: ${request.id}`);

      (res as any).status(201).json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error(error, 'Error al procesar la solicitud de acceso:');
      (res as any).status(500).json({
        success: false,
        error: 'Error al procesar la solicitud de acceso',
      });
    }
  }

  // Responder a una solicitud de acceso
  async respondToRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { approve, userId } = req.body;

      const request = this.pendingRequests.get(requestId);
      if (!request) {
        (res as any).status(404).json({
          success: false,
          error: 'Solicitud no encontrada',
        });
        return;
      }

      // Verificar que el usuario que responde es el destinatario
      if (request.toUserId !== userId) {
        (res as any).status(403).json({
          success: false,
          error: 'No autorizado para responder a esta solicitud',
        });
        return;
      }

      // Actualizar estado de la solicitud
      request.status = approve ? 'approved' : 'rejected';
      request.updatedAt = new Date();

      // Si se aprueba, crear una sesión
      if (approve) {
        const session: RemoteSession = {
          id: randomUUID(),
          requestId: request.id,
          fromUserId: request.fromUserId,
          toUserId: request.toUserId,
          status: 'active',
          startedAt: new Date(),
          permissions: { ...request.permissions },
        };

        this.activeSessions.set(session.id, session);

        logger.info(`Sesión de acceso remoto iniciada: ${session.id}`);

        (res as any).status(200).json({
          success: true,
          data: {
            request,
            session,
          },
        });
      } else {
        (res as any).status(200).json({
          success: true,
          data: { request },
        });
      }
    } catch (error) {
      logger.error(error, 'Error al procesar la respuesta a la solicitud:');
      (res as any).status(500).json({
        success: false,
        error: 'Error al procesar la respuesta a la solicitud',
      });
    }
  }

  // Obtener sesiones activas
  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const sessions = Array.from(this.activeSessions.values()).filter(
        session => session.fromUserId === userId || session.toUserId === userId,
      );

      (res as any).status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error(error, 'Error al obtener sesiones activas:');
      (res as any).status(500).json({
        success: false,
        error: 'Error al obtener sesiones activas',
      });
    }
  }

  // Finalizar una sesión
  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { userId } = req.body;

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        (res as any).status(404).json({
          success: false,
          error: 'Sesión no encontrada',
        });
        return;
      }

      // Verificar que el usuario que finaliza es participante
      if (session.fromUserId !== userId && session.toUserId !== userId) {
        (res as any).status(403).json({
          success: false,
          error: 'No autorizado para finalizar esta sesión',
        });
        return;
      }

      // Actualizar estado de la sesión
      session.status = 'ended';
      session.endedAt = new Date();
      this.activeSessions.delete(sessionId);

      logger.info(`Sesión de acceso remoto finalizada: ${sessionId}`);

      (res as any).status(200).json({
        success: true,
        message: 'Sesión finalizada correctamente',
      });
    } catch (error) {
      logger.error(error, 'Error al finalizar la sesión:');
      (res as any).status(500).json({
        success: false,
        error: 'Error al finalizar la sesión',
      });
    }
  }
}

export default new RemoteAccessController();
