import { EventEmitter } from 'events';
import Peer from 'simple-peer';

import { logger } from '../../../utils/logger';

interface PeerConnection {
  peer: any;
  userId: string;
  sessionId: string;
}

export class WebRTCService extends EventEmitter {
  private peers = new Map<string, PeerConnection>();
  private streams = new Map<string, MediaStream>();

  /**
   * Crea una nueva conexión peer para una sesión
   */
  createPeerConnection(userId: string, sessionId: string, initiator: boolean): any {
    // Si ya existe una conexión para esta sesión, la cerramos primero
    this.closePeerConnection(sessionId);

    const peer = new Peer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // En producción, deberías usar tus propios servidores TURN/STUN
          // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
        ],
      },
    });

    // Asignar un ID único a esta conexión
    // connectionId removed as it was unused

    // Almacenar la conexión
    this.peers.set(sessionId, {
      peer,
      userId,
      sessionId,
    });

    // Manejar eventos del peer
    peer.on('signal', (data: any) => {
      logger.debug(
        `Señal de ${initiator ? 'iniciador' : 'receptor'} generada para sesión ${sessionId}`,
      );
      this.emit('signal', {
        type: initiator ? 'offer' : 'answer',
        sdp: data,
        userId,
        sessionId,
      });
    });

    peer.on('connect', () => {
      logger.info(`Conexión WebRTC establecida para la sesión ${sessionId}`);
      this.emit('connected', { userId, sessionId });
    });

    peer.on('data', (data: ArrayBuffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.emit('data', { userId, sessionId, data: message });
      } catch (error) {
        logger.error(error, 'Error al procesar datos del peer:');
      }
    });

    peer.on('stream', (stream: MediaStream) => {
      logger.info(`Stream recibido en la sesión ${sessionId}`);
      this.streams.set(sessionId, stream);
      this.emit('stream', { userId, sessionId, stream });
    });

    peer.on('error', (error: Error) => {
      logger.error(error, `Error en la conexión WebRTC (${sessionId})`);
      this.emit('error', { userId, sessionId, error });
      this.closePeerConnection(sessionId);
    });

    peer.on('close', () => {
      logger.info(`Conexión WebRTC cerrada para la sesión ${sessionId}`);
      this.peers.delete(sessionId);
      this.streams.delete(sessionId);
      this.emit('disconnected', { userId, sessionId });
    });

    return peer;
  }

  /**
   * Procesa una señal SDP (offer/answer) de un peer remoto
   */
  handleSignal(sessionId: string, signal: any): boolean {
    const connection = this.peers.get(sessionId);
    if (!connection) {
      logger.warn(`Intento de procesar señal para sesión no encontrada: ${sessionId}`);
      return false;
    }

    try {
      connection.peer.signal(signal);
      return true;
    } catch (error) {
      logger.error(error, 'Error al procesar señal');
      return false;
    }
  }

  /**
   * Envía datos a través de la conexión WebRTC
   */
  sendData(sessionId: string, data: any): boolean {
    const connection = this.peers.get(sessionId);
    if (!connection || connection.peer.destroyed) {
      return false;
    }

    try {
      connection.peer.send(JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error(error, 'Error al enviar datos a través de WebRTC');
      return false;
    }
  }

  /**
   * Agrega un stream de medios a la conexión
   */
  addStream(sessionId: string, stream: MediaStream): boolean {
    const connection = this.peers.get(sessionId);
    if (!connection) {
      return false;
    }

    try {
      connection.peer.addStream(stream);
      this.streams.set(sessionId, stream);
      return true;
    } catch (error) {
      logger.error(error, 'Error al agregar stream a la conexión WebRTC:');
      return false;
    }
  }

  /**
   * Cierra una conexión peer
   */
  closePeerConnection(sessionId: string): void {
    const connection = this.peers.get(sessionId);
    if (connection) {
      logger.info(`Cerrando conexión WebRTC para la sesión ${sessionId}`);
      connection.peer.destroy();
      this.peers.delete(sessionId);
      this.streams.delete(sessionId);
    }
  }

  /**
   * Obtiene el stream de una sesión
   */
  getStream(sessionId: string): MediaStream | undefined {
    return this.streams.get(sessionId);
  }

  /**
   * Verifica si una conexión está activa
   */
  isConnected(sessionId: string): boolean {
    const connection = this.peers.get(sessionId);
    return !!(connection && !connection.peer.destroyed && connection.peer.connected);
  }
}

export const webRTCService = new WebRTCService();
