import Peer, { DataConnection } from 'peerjs';
import { DataPayload, IncomingData } from '../types';

type EventCallback = (data: any) => void;

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private listeners: Map<string, EventCallback[]> = new Map();
  private initializedId: string | null = null;

  on(event: 'status' | 'connection' | 'data' | 'error', callback: EventCallback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)?.push(callback);
  }

  off(event: 'status' | 'connection' | 'data' | 'error', callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  initialize(customId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.peer && !this.peer.disconnected && !this.peer.destroyed) {
         if ((customId && this.initializedId === customId) || (!customId && this.initializedId)) {
             resolve(this.initializedId!);
             return;
         }
      }
      this.destroy();
      this.peer = new Peer(customId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });
      (this.peer as any).on('open', (id: string) => {
        this.initializedId = id;
        this.emit('status', { status: 'ready', id });
        resolve(id);
      });
      (this.peer as any).on('connection', (conn: DataConnection) => this.handleNewConnection(conn));
      (this.peer as any).on('error', (err: any) => this.emit('error', err));
    });
  }

  connect(hostId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(hostId, { reliable: true, serialization: 'binary' });
    this.handleNewConnection(conn);
  }

  private handleNewConnection(conn: DataConnection) {
    this.connections.set(conn.connectionId, conn);
    (conn as any).on('open', () => {
      this.emit('connection', conn);
      this.emit('status', { status: 'connected', peerId: conn.peer, connectionId: conn.connectionId });
    });
    (conn as any).on('data', (data: any) => {
      this.emit('data', {
          data: data as DataPayload,
          connectionId: conn.connectionId,
          peerId: conn.peer
      });
    });
    (conn as any).on('close', () => {
      this.connections.delete(conn.connectionId);
      this.emit('status', { status: 'disconnected', peerId: conn.peer, connectionId: conn.connectionId });
    });
    (conn as any).on('error', (err: any) => {
      this.emit('error', err);
      this.connections.delete(conn.connectionId);
    });
  }

  sendTo(connectionId: string, data: DataPayload) {
    const conn = this.connections.get(connectionId);
    if (conn && conn.open) {
      try { conn.send(data); } catch (e) {}
    }
  }

  // Sends to all connected peers
  broadcast(data: DataPayload) {
    this.connections.forEach(conn => {
        if (conn.open) {
            try { conn.send(data); } catch (e) {}
        }
    });
  }

  async waitForBuffer(connectionId: string): Promise<void> {
      const conn = this.connections.get(connectionId);
      if (!conn) throw new Error("Connection lost");
      // Increased buffer threshold for better throughput on high-latency links
      if (conn.dataChannel.bufferedAmount < 12 * 1024 * 1024) return;
      return new Promise((resolve, reject) => {
          const check = setInterval(() => {
              const c = this.connections.get(connectionId);
              if (!c || !c.open) { clearInterval(check); reject(new Error("Connection closed")); return; }
              if (c.dataChannel.bufferedAmount < 1 * 1024 * 1024) { clearInterval(check); resolve(); }
          }, 5);
      });
  }

  // Helper to calculate latency (RTT)
  // Logic mostly handled in components via PING/PONG, but this method ensures the connection is valid for measurement
  getLatency(connectionId: string): boolean {
      const conn = this.connections.get(connectionId);
      return conn ? conn.open : false;
  }

  destroy() {
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    if (this.peer) this.peer.destroy();
    this.peer = null;
    this.initializedId = null;
  }
}
export const peerService = new PeerService();