export interface RemoteAccessRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  permissions: {
    screenShare: boolean;
    remoteControl: boolean;
    fileTransfer: boolean;
    terminalAccess: boolean;
  };
  authorizationCode?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemoteSession {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  status: 'active' | 'ended' | 'error';
  startedAt: Date;
  endedAt?: Date;
  permissions: {
    screenShare: boolean;
    remoteControl: boolean;
    fileTransfer: boolean;
    terminalAccess: boolean;
  };
}

export interface WebRTCOffer {
  type: 'offer';
  sdp: string;
  fromUserId: string;
  toUserId: string;
  sessionId: string;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: string;
  fromUserId: string;
  toUserId: string;
  sessionId: string;
}

export interface ICECandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  fromUserId: string;
  toUserId: string;
  sessionId: string;
}

export type WebRTCMessage = WebRTCOffer | WebRTCAnswer | ICECandidate;

// Eventos del servidor de señalización
export interface ServerToClientEvents {
  'remote-access:request': (request: RemoteAccessRequest) => void;
  'remote-access:request-updated': (request: RemoteAccessRequest) => void;
  'remote-access:session-started': (session: RemoteSession) => void;
  'remote-access:session-ended': (sessionId: string) => void;
  'webrtc:offer': (data: WebRTCOffer) => void;
  'webrtc:answer': (data: WebRTCAnswer) => void;
  'webrtc:ice-candidate': (data: ICECandidate) => void;
  'webrtc:error': (error: string) => void;
}

// Eventos del cliente al servidor
export interface ClientToServerEvents {
  'remote-access:request': (
    data: Omit<RemoteAccessRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    callback: (response: {
      success: boolean;
      request?: RemoteAccessRequest;
      error?: string;
    }) => void
  ) => void;

  'remote-access:respond-to-request': (
    data: { requestId: string; approve: boolean; authorizationCode?: string },
    callback: (response: {
      success: boolean;
      request?: RemoteAccessRequest;
      error?: string;
    }) => void
  ) => void;

  'remote-access:start-session': (
    data: { requestId: string },
    callback: (response: { success: boolean; session?: RemoteSession; error?: string }) => void
  ) => void;

  'remote-access:end-session': (
    data: { sessionId: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  'webrtc:offer': (data: WebRTCOffer) => void;
  'webrtc:answer': (data: WebRTCAnswer) => void;
  'webrtc:ice-candidate': (data: ICECandidate) => void;
}
