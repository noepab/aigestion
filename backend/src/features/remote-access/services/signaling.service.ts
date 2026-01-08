import { randomUUID } from 'node:crypto';

import { Server, Socket } from 'socket.io';

import {
  ClientToServerEvents,
  RemoteAccessRequest,
  RemoteSession,
  ServerToClientEvents,
  WebRTCMessage,
} from '../types';

export class SignalingService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private activeSessions = new Map<string, RemoteSession>();
  private pendingRequests = new Map<string, RemoteAccessRequest>();
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      // Manejar autenticación del usuario
      socket.on('authenticate', (userId: string) => {
        this.userSockets.set(userId, socket.id);
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
      });

      // Manejar solicitudes de acceso remoto
      socket.on('remote-access:request', async (data, callback) => {
        try {
          const request: RemoteAccessRequest = {
            ...data,
            id: randomUUID(),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos para responder
          };

          this.pendingRequests.set(request.id, request);

          // Notificar al usuario objetivo
          const targetSocketId = this.userSockets.get(request.toUserId);
          if (targetSocketId) {
            this.io.to(targetSocketId).emit('remote-access:request', request);
            callback({ success: true, request });
          } else {
            throw new Error('El usuario objetivo no está conectado');
          }
        } catch (error) {
          console.error('Error al procesar la solicitud de acceso remoto:', error);
          callback({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      });

      // Manejar respuestas a solicitudes de acceso
      socket.on('remote-access:respond-to-request', async (data, callback) => {
        try {
          const request = this.pendingRequests.get(data.requestId);
          if (!request) {
            throw new Error('Solicitud no encontrada');
          }

          if (request.status !== 'pending') {
            throw new Error('La solicitud ya fue procesada');
          }

          const updatedRequest: RemoteAccessRequest = {
            ...request,
            status: data.approve ? 'approved' : 'rejected',
            updatedAt: new Date(),
            authorizationCode: data.authorizationCode,
          };

          this.pendingRequests.set(request.id, updatedRequest);

          // Notificar al solicitante
          const requesterSocketId = this.userSockets.get(request.fromUserId);
          if (requesterSocketId) {
            this.io.to(requesterSocketId).emit('remote-access:request-updated', updatedRequest);
          }

          // Si se aprobó, crear una sesión
          if (data.approve) {
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

            // Notificar a ambos usuarios sobre la sesión iniciada
            const targetSocketId = this.userSockets.get(request.toUserId);
            if (requesterSocketId) {
              this.io.to(requesterSocketId).emit('remote-access:session-started', session);
            }
            if (targetSocketId) {
              this.io.to(targetSocketId).emit('remote-access:session-started', session);
            }
          }

          callback({ success: true, request: updatedRequest });
        } catch (error) {
          console.error('Error al procesar la respuesta a la solicitud:', error);
          callback({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      });

      // Manejar mensajes WebRTC
      socket.on('webrtc:offer', (data: WebRTCMessage) => {
        const targetSocketId = this.userSockets.get(data.toUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:offer', data as any);
        }
      });

      socket.on('webrtc:answer', (data: WebRTCMessage) => {
        const targetSocketId = this.userSockets.get(data.toUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:answer', data as any);
        }
      });

      socket.on('webrtc:ice-candidate', (data: any) => {
        const targetSocketId = this.userSockets.get(data.toUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:ice-candidate', data);
        }
      });

      // Manejar cierre de conexión
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Eliminar el mapeo de usuario a socket
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            break;
          }
        }
      });
    });
  }

  // Métodos públicos para interactuar con el servicio
  public getActiveSessions(): RemoteSession[] {
    return Array.from(this.activeSessions.values());
  }

  public getPendingRequests(): RemoteAccessRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  public endSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'ended';
    session.endedAt = new Date();
    this.activeSessions.delete(sessionId);

    // Notificar a los usuarios sobre el fin de la sesión
    const fromSocketId = this.userSockets.get(session.fromUserId);
    const toSocketId = this.userSockets.get(session.toUserId);

    if (fromSocketId) {
      this.io.to(fromSocketId).emit('remote-access:session-ended', sessionId);
    }
    if (toSocketId) {
      this.io.to(toSocketId).emit('remote-access:session-ended', sessionId);
    }

    return true;
  }
}

export default SignalingService;
