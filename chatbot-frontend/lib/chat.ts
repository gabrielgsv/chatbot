import { io, Socket } from 'socket.io-client';
import { telemetry } from './telemetry';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: object;
}

export class ChatService {
  private socket: Socket | null = null;
  private apiUrl: string;
  private messageListeners: ((message: ChatMessage) => void)[] = [];
  private responseListeners: ((response: { content: string; metadata?: object }) => void)[] = [];
  private typingListeners: ((data: { userId: string; typing: boolean }) => void)[] = [];
  private errorListeners: ((error: { message: string }) => void)[] = [];

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
  }

  connect(token: string, sessionId?: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(`${this.apiUrl}/chat`, {
      auth: {
        token,
        sessionId,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      // Connection established - no specific telemetry needed
    });

    this.socket.on('session', (data: { sessionId: string }) => {
      telemetry.setSessionId(data.sessionId);
    });

    this.socket.on('chat:response', (data: { content: string; metadata?: object; timestamp: string }) => {
      const source = data.metadata && 'source' in data.metadata ? (data.metadata.source as 'ai' | 'mock') : 'mock';
      // Response time is tracked in sendMessage
      telemetry.trackBotResponse(data.content, source);

      this.responseListeners.forEach(listener => listener(data));
    });

    this.socket.on('user:typing', (data: { userId: string; typing: boolean }) => {
      this.typingListeners.forEach(listener => listener(data));
    });

    this.socket.on('chat:history', (data: { messages: ChatMessage[] }) => {
      data.messages.forEach(msg => {
        this.messageListeners.forEach(listener => listener(msg));
      });
    });

    this.socket.on('error', (error: { message: string }) => {
      this.errorListeners.forEach(listener => listener(error));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(content: string) {
    if (!this.socket?.connected) return;

    const startTime = Date.now();
    this.socket.emit('chat:message', { content });

    // Track user message
    telemetry.trackUserMessage(content);

    // Track response time when response arrives
    const checkResponse = (data: { content: string }) => {
      const responseTimeMs = Date.now() - startTime;
      const source = 'ai' as const;
      telemetry.trackBotResponse(data.content, source, responseTimeMs);
    };

    this.once('response', checkResponse);
  }

  sendTypingIndicator(typing: boolean) {
    this.socket?.emit('chat:typing', { typing });
  }

  requestHistory() {
    this.socket?.emit('chat:history');
  }

  // Event listeners
  onMessage(callback: (message: ChatMessage) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== callback);
    };
  }

  onResponse(callback: (response: { content: string; metadata?: object }) => void) {
    this.responseListeners.push(callback);
    return () => {
      this.responseListeners = this.responseListeners.filter(l => l !== callback);
    };
  }

  onTyping(callback: (data: { userId: string; typing: boolean }) => void) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== callback);
    };
  }

  onError(callback: (error: { message: string }) => void) {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== callback);
    };
  }

  private once(event: string, callback: (data: { content: string }) => void) {
    const wrappedCallback = (data: { content: string }) => {
      callback(data);
      this.responseListeners = this.responseListeners.filter(l => l !== wrappedCallback);
    };
    this.responseListeners.push(wrappedCallback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const chatService = new ChatService();
