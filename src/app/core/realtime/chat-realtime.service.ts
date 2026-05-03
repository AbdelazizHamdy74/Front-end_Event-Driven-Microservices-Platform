import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { TokenStorage } from '../auth/token-storage';
import type { ChatMessageDto } from '../api/api.models';

export interface NotificationToast {
  message: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tokenStorage = inject(TokenStorage);

  private socket: Socket | null = null;
  /** Bearer token last used for a connected socket (must reconnect when it changes). */
  private connectedAuthToken: string | null = null;

  readonly toast = signal<NotificationToast | null>(null);
  readonly unreadBellCount = signal(0);
  readonly messageRequestReceived$ = new Subject<void>();

  ensureConnected(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = this.tokenStorage.getToken();
    if (!raw) {
      this.disconnect();
      return;
    }

    const token = raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;

    if (this.socket?.connected && this.connectedAuthToken === token) {
      return;
    }

    this.disconnect();

    this.socket = io(environment.chatSocketUrl, {
      auth: { token },
      extraHeaders: { Authorization: token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connectedAuthToken = token;
    });

    this.socket.on('connect_error', (err: Error) => {
      console.warn('[chat-realtime] connect_error', err?.message || err);
    });

    this.socket.on('notification:new', (payload: { message?: string; type?: string }) => {
      if (payload?.message) {
        this.toast.set({ message: payload.message, type: payload.type });
        this.unreadBellCount.update((n) => n + 1);
      }
    });

    this.socket.on('message:request', () => {
      this.messageRequestReceived$.next();
    });
  }

  onChatNew(handler: (msg: ChatMessageDto) => void): () => void {
    this.ensureConnected();
    if (!this.socket) return () => {};
    const fn = (msg: ChatMessageDto) => handler(msg);
    this.socket.on('chat:new', fn);
    return () => {
      this.socket?.off('chat:new', fn);
    };
  }

  dismissToast(): void {
    this.toast.set(null);
  }

  clearBell(): void {
    this.unreadBellCount.set(0);
  }

  disconnect(): void {
    this.connectedAuthToken = null;
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }
}
