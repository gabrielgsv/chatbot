import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  sessionId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token as string;
      if (!token) {
        this.logger.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });
      
      client.userId = payload.sub as string;
      client.sessionId = client.handshake.auth.sessionId as string || this.generateSessionId();
      
      this.logger.log(`Client connected: ${client.id}, user: ${client.userId}`);
      
      client.emit('session', { sessionId: client.sessionId });
    } catch (error) {
      this.logger.error('Invalid token:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}, user: ${client.userId}`);
  }

  @SubscribeMessage('chat:message')
  async handleMessage(
    @MessageBody() data: { content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      client.broadcast.emit('user:typing', {
        userId: client.userId,
        typing: false,
      });

      const response = await this.chatService.generateResponse(
        client.userId,
        data.content,
        client.sessionId,
      );

      client.emit('chat:response', {
        content: response.content,
        metadata: response.metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error processing message:', error);
      client.emit('error', { message: 'Failed to process message' });
    }
  }

  @SubscribeMessage('chat:typing')
  async handleTyping(
    @MessageBody() data: { typing: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    client.broadcast.emit('user:typing', {
      userId: client.userId,
      typing: data.typing,
    });
  }

  @SubscribeMessage('chat:history')
  async handleGetHistory(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const history = await this.chatService.getChatHistory(
        client.userId,
        client.sessionId,
        50,
      );
      
      client.emit('chat:history', {
        messages: history.reverse(),
      });
    } catch (error) {
      this.logger.error('Error fetching history:', error);
      client.emit('error', { message: 'Failed to fetch history' });
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
