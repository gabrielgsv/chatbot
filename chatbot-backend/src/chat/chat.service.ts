import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, MessageRole } from './entities/message.entity';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

export interface ChatResponse {
  content: string;
  metadata?: object;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI | null = null;

  constructor(
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not configured, using mock responses');
    }
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

  async getChatHistory(userId: string, sessionId?: string, limit = 50): Promise<ChatMessage[]> {
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

    let responseContent: string;
    let metadata: object = {};

    if (this.openai) {
      try {
        const history = await this.getChatHistory(userId, sessionId, 10);
        const messages = [
          {
            role: 'system' as const,
            content: 'Você é um assistente virtual amigável e prestativo da Hand Talk. Responda de forma concisa e útil.',
          },
          ...history.reverse().map((msg) => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
        ];

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        });

        responseContent = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
        metadata = {
          model: completion.model,
          tokensUsed: completion.usage?.total_tokens,
          finishReason: completion.choices[0]?.finish_reason,
        };
      } catch (error) {
        this.logger.error('OpenAI API error:', error);
        responseContent = this.getMockResponse(message);
        metadata = { source: 'mock', error: 'openai_api_error' };
      }
    } else {
      responseContent = this.getMockResponse(message);
      metadata = { source: 'mock', reason: 'no_api_key' };
    }

    await this.saveMessage(userId, MessageRole.ASSISTANT, responseContent, sessionId);

    return { content: responseContent, metadata };
  }

  private getMockResponse(message: string): string {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('oi') || lowerMsg.includes('olá') || lowerMsg.includes('ola')) {
      return 'Olá! Como posso ajudar você hoje?';
    }
    if (lowerMsg.includes('ajuda') || lowerMsg.includes('help')) {
      return 'Claro! Estou aqui para ajudar. O que você precisa?';
    }
    if (lowerMsg.includes('hand talk') || lowerMsg.includes('handtalk')) {
      return 'A Hand Talk é uma empresa que usa tecnologia e IA para quebrar barreiras de comunicação, especialmente com a comunidade surda!';
    }
    if (lowerMsg.includes('surd') || lowerMsg.includes('libras')) {
      return 'A Hand Talk trabalha com tecnologia de tradução automática de Libras usando nosso avatar, o Hugo.';
    }
    if (lowerMsg.includes('obrigad')) {
      return 'Por nada! Estou sempre aqui se precisar de mais ajuda.';
    }
    
    return 'Entendi! É um tema interessante. Posso ajudar com mais informações sobre a Hand Talk ou nossos serviços?';
  }
}
