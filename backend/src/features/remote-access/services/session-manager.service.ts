import { randomUUID } from 'node:crypto';

import { EventEmitter } from 'events';

import { logger } from '../../../utils/logger';
import { RemoteAccessRequest, RemoteSession } from '../types';
import { webRTCService } from './webrtc.service';

export class SessionManagerService extends EventEmitter {
  private activeSessions = new Map<string, RemoteSession>();
  private pendingRequests = new Map<string, RemoteAccessRequest>();
  private userSessions = new Map<string, Set<string>>(); // userId -> Set<sessionId>

  /**
   * Crea una nueva solicitud de acceso remoto
   */
  createRequest(fromUserId: string, toUserId: string, permissions: any): RemoteAccessRequest {
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
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.pendingRequests.set(request.id, request);

    // Programar expiración
    setTimeout(
      () => {
        if (this.pendingRequests.get(request.id)?.status === 'pending') {
          request.status = 'expired';
          request.updatedAt = new Date();
          this.emit('requestExpired', request);
        }
      },
      15 * 60 * 1000,
    );

    logger.info(`Nueva solicitud de acceso creada: ${request.id}`);
    this.emit('requestCreated', request);

    return request;
  }

  /**
   * Responde a una solicitud de acceso
   */
  respondToRequest(
    requestId: string,
    approve: boolean,
    userId: string,
  ): RemoteAccessRequest | null {
    const request = this.pendingRequests.get(requestId);
    if (request?.toUserId !== userId) {
      return null;
    }

    request.status = approve ? 'approved' : 'rejected';
    request.updatedAt = new Date();

    if (approve) {
      // Crear sesión automáticamente al aprobar
      this.createSession(request);
    }

    this.emit('requestUpdated', request);
    return request;
  }

  /**
   * Crea una nueva sesión a partir de una solicitud aprobada
   */
  private createSession(request: RemoteAccessRequest): RemoteSession {
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

    // Registrar la sesión para ambos usuarios
    this.registerUserSession(session.fromUserId, session.id);
    this.registerUserSession(session.toUserId, session.id);

    logger.info(`Nueva sesión de acceso remoto creada: ${session.id}`);
    this.emit('sessionCreated', session);

    return session;
  }

  /**
   * Registra una sesión para un usuario
   */
  private registerUserSession(userId: string, sessionId: string): void {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)?.add(sessionId);
  }

  /**
   * Finaliza una sesión activa
   */
  endSession(sessionId: string, userId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || (session.fromUserId !== userId && session.toUserId !== userId)) {
      return false;
    }

    // Cerrar la conexión WebRTC si existe
    webRTCService.closePeerConnection(sessionId);

    // Actualizar estado de la sesión
    session.status = 'ended';
    session.endedAt = new Date();

    // Eliminar de las sesiones activas
    this.activeSessions.delete(sessionId);

    // Eliminar referencias de usuario
    this.userSessions.get(session.fromUserId)?.delete(sessionId);
    this.userSessions.get(session.toUserId)?.delete(sessionId);

    logger.info(`Sesión finalizada: ${sessionId}`);
    this.emit('sessionEnded', session);

    return true;
  }

  /**
   * Obtiene las sesiones activas de un usuario
   */
  getUserSessions(userId: string): RemoteSession[] {
    const sessionIds = this.userSessions.get(userId) || [];
    return Array.from(sessionIds)
      .map(id => this.activeSessions.get(id))
      .filter((session): session is RemoteSession => session !== undefined);
  }

  /**
   * Verifica si un usuario tiene una sesión activa con otro usuario
   */
  hasActiveSession(userId1: string, userId2: string): boolean {
    const user1Sessions = this.userSessions.get(userId1) || new Set();

    for (const sessionId of user1Sessions) {
      const session = this.activeSessions.get(sessionId);
      if (session && (session.fromUserId === userId2 || session.toUserId === userId2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Obtiene una sesión por ID
   */
  getSession(sessionId: string): RemoteSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Obtiene una solicitud por ID
   */
  getRequest(requestId: string): RemoteAccessRequest | undefined {
    return this.pendingRequests.get(requestId);
  }

  /**
   * Inicializa la conexión WebRTC para una sesión
   */
  initializeWebRTC(userId: string, sessionId: string, initiator: boolean): void {
    const session = this.getSession(sessionId);
    if (!session || (session.fromUserId !== userId && session.toUserId !== userId)) {
      throw new Error('No autorizado o sesión no encontrada');
    }

    // Configurar manejadores de eventos WebRTC
    webRTCService.on('signal', data => {
      if (data.sessionId === sessionId) {
        this.emit('webrtcSignal', {
          ...data,
          toUserId: userId === session.fromUserId ? session.toUserId : session.fromUserId,
        });
      }
    });

    webRTCService.on('connected', () => {
      this.emit('webrtcConnected', { userId, sessionId });
    });

    webRTCService.on('stream', data => {
      this.emit('webrtcStream', data);
    });

    webRTCService.on('data', data => {
      this.emit('webrtcData', data);
    });

    webRTCService.on('error', error => {
      logger.error(`Error en WebRTC (${sessionId}):`, error);
      this.emit('webrtcError', { userId, sessionId, error });
    });

    webRTCService.on('disconnected', () => {
      this.emit('webrtcDisconnected', { userId, sessionId });
      this.endSession(sessionId, userId);
    });

    // Crear la conexión peer
    webRTCService.createPeerConnection(userId, sessionId, initiator);
  }

  /**
   * Procesa una señal WebRTC
   */
  handleWebRTCSignal(sessionId: string, signal: any, userId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session || (session.fromUserId !== userId && session.toUserId !== userId)) {
      return false;
    }
    return webRTCService.handleSignal(sessionId, signal);
  }

  /**
   * Envía datos a través de WebRTC
   */
  sendData(sessionId: string, data: any, userId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session || (session.fromUserId !== userId && session.toUserId !== userId)) {
      return false;
    }
    return webRTCService.sendData(sessionId, data);
  }

  /**
   * Agrega un stream de medios a una sesión
   */
  addStream(sessionId: string, stream: MediaStream, userId: string): boolean {
    const session = this.getSession(sessionId);
    if (session?.toUserId !== userId) {
      // Solo el destinatario puede compartir pantalla
      return false;
    }
    return webRTCService.addStream(sessionId, stream);
  }

  /**
   * Obtiene el stream de una sesión
   */
  getStream(sessionId: string): MediaStream | undefined {
    return webRTCService.getStream(sessionId);
  }

  /**
   * Verifica si una sesión está conectada a través de WebRTC
   */
  isConnected(sessionId: string): boolean {
    return webRTCService.isConnected(sessionId);
  }
}

export const sessionManager = new SessionManagerService();
