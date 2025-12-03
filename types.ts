

export type MessageType = 'MANIFEST' | 'REQUEST_FILE' | 'START_FILE' | 'END_FILE' | 'ERROR' | 'VERIFY_PASSWORD' | 'PASSWORD_CORRECT' | 'PASSWORD_INCORRECT' | 'TEXT' | 'PING' | 'PONG' | 'NUDGE';

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ManifestPayload {
  locked: boolean;
  files?: FileMeta[];
}

export interface ProtocolMessage {
  type: MessageType;
  payload?: any;
}

export type DataPayload = ProtocolMessage | ArrayBuffer | Blob;

// For the event system
export interface IncomingData {
  data: DataPayload;
  connectionId: string;
  peerId: string;
}

export interface TextMessage {
  id: string;
  text: string;
  sender: 'self' | 'peer';
  timestamp: number;
}