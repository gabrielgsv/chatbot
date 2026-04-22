import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, MessageRole } from './entities/message.entity';

export interface ChatResponse {
  content: string;
  metadata?: object;
  messageId?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
  ) {
    this.logger.log('ChatService initialized - AI handled on frontend');
  }

  async saveMessage(
    userId: string,
    role: MessageRole,
    content: string,
    sessionId?: string,
  ): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      userId,
      role,
      content,
      sessionId,
    });

    return this.messageRepository.save(message);
  }

  async getChatHistory(
    userId: string,
    sessionId?: string,
    limit = 50,
  ): Promise<ChatMessage[]> {
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .where('message.userId = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (sessionId) {
      qb.andWhere('message.sessionId = :sessionId', { sessionId });
    }

    return qb.getMany();
  }

  async generateResponse(
    userId: string,
    message: string,
    sessionId?: string,
  ): Promise<ChatResponse> {
    await this.saveMessage(userId, MessageRole.USER, message, sessionId);

    const savedMessage = await this.saveMessage(
      userId,
      MessageRole.ASSISTANT,
      '',
      sessionId,
    );

    return {
      content: '',
      metadata: { frontend: true },
      messageId: savedMessage.id,
    };
  }
}
