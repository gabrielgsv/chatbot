/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatMessage, MessageRole } from './entities/message.entity';
import { Repository } from 'typeorm';

describe('ChatService', () => {
  let service: ChatService;

  const mockMessage: ChatMessage = {
    id: 'test-uuid',
    userId: 'user-uuid',
    role: MessageRole.USER,
    content: 'Test message',
    sessionId: 'session-123',
    metadata: undefined,
    createdAt: new Date(),
    user: {} as User,
  };

  const mockMessageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockMessageRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessage', () => {
    it('should save a message successfully', async () => {
      const userId = 'user-123';
      const role = MessageRole.USER;
      const content = 'Hello';
      const sessionId = 'session-123';

      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.saveMessage(
        userId,
        role,
        content,
        sessionId,
      );

      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        userId,
        role,
        content,
        sessionId,
      });
      expect(mockMessageRepository.save).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockMessage);
    });

    it('should save a message without sessionId', async () => {
      const userId = 'user-123';
      const role = MessageRole.ASSISTANT;
      const content = 'Response';

      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.saveMessage(userId, role, content);

      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        userId,
        role,
        content,
        sessionId: undefined,
      });
      expect(mockMessageRepository.save).toHaveBeenCalledWith(mockMessage);
    });

    it('should save a system message', async () => {
      const userId = 'user-123';
      const role = MessageRole.SYSTEM;
      const content = 'System notification';

      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save.mockResolvedValue(mockMessage);

      await service.saveMessage(userId, role, content);

      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        userId,
        role: MessageRole.SYSTEM,
        content,
        sessionId: undefined,
      });
    });
  });

  describe('getChatHistory', () => {
    it('should return chat history for a user', async () => {
      const userId = 'user-123';
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMessage]),
      };

      mockMessageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getChatHistory(userId);

      expect(mockMessageRepository.createQueryBuilder).toHaveBeenCalledWith(
        'message',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'message.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'message.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([mockMessage]);
    });

    it('should return chat history with sessionId filter', async () => {
      const userId = 'user-123';
      const sessionId = 'session-123';
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMessage]),
      };

      mockMessageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getChatHistory(userId, sessionId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'message.sessionId = :sessionId',
        { sessionId },
      );
      expect(result).toEqual([mockMessage]);
    });

    it('should respect custom limit', async () => {
      const userId = 'user-123';
      const limit = 20;
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMessage]),
      };

      mockMessageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getChatHistory(userId, undefined, limit);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(limit);
    });

    it('should return empty array when no messages found', async () => {
      const userId = 'user-123';
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockMessageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getChatHistory(userId);

      expect(result).toEqual([]);
    });
  });

  describe('generateResponse', () => {
    it('should generate response using mock when no API key', async () => {
      const userId = 'user-123';
      const message = 'Olá';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockSavedMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.create
        .mockReturnValueOnce(mockMessage)
        .mockReturnValueOnce(mockSavedMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockSavedMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(result.content).toBe('Olá! Como posso ajudar você hoje?');
      expect(result.metadata).toEqual({ source: 'mock', reason: 'no_api_key' });
      expect(result.messageId).toBe('assistant-uuid');
      expect(mockMessageRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should save user message before generating response', async () => {
      const userId = 'user-123';
      const message = 'Hello';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockUserMessage = { ...mockMessage, role: MessageRole.USER };
      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };

      mockMessageRepository.create.mockReturnValue(mockUserMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      await service.generateResponse(userId, message, sessionId);

      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        userId,
        role: MessageRole.USER,
        content: message,
        sessionId,
      });
    });

    it('should save assistant message after generating response', async () => {
      const userId = 'user-123';
      const message = 'Hello';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockUserMessage = { ...mockMessage, role: MessageRole.USER };
      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
        content: 'Mock response',
      };

      mockMessageRepository.create
        .mockReturnValueOnce(mockUserMessage)
        .mockReturnValueOnce(mockAssistantMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(mockMessageRepository.save).toHaveBeenCalledTimes(2);
      expect(result.messageId).toBe('assistant-uuid');
    });

    it('should return mock response for greeting messages', async () => {
      const userId = 'user-123';
      const message = 'oi';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(result.content).toBe('Olá! Como posso ajudar você hoje?');
    });

    it('should return mock response for help messages', async () => {
      const userId = 'user-123';
      const message = 'ajuda';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(result.content).toBe(
        'Claro! Estou aqui para ajudar. O que você precisa?',
      );
    });

    it('should return mock response for Hand Talk related messages', async () => {
      const userId = 'user-123';
      const message = 'O que é a Hand Talk?';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(result.content).toContain('Hand Talk');
    });

    it('should return mock response for thank you messages', async () => {
      const userId = 'user-123';
      const message = 'obrigado';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(result.content).toBe(
        'Por nada! Estou sempre aqui se precisar de mais ajuda.',
      );
    });

    it('should return default mock response for unknown messages', async () => {
      const userId = 'user-123';
      const message = 'random message';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(result.content).toContain('Hand Talk');
    });

    it('should handle case insensitive messages', async () => {
      const userId = 'user-123';
      const message = 'OLÁ';
      const sessionId = 'session-123';

      mockConfigService.get.mockReturnValue(null);

      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message, sessionId);

      expect(result.content).toBe('Olá! Como posso ajudar você hoje?');
    });

    it('should work without sessionId', async () => {
      const userId = 'user-123';
      const message = 'Hello';

      mockConfigService.get.mockReturnValue(null);

      const mockAssistantMessage = {
        ...mockMessage,
        id: 'assistant-uuid',
        role: MessageRole.ASSISTANT,
      };
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save
        .mockResolvedValueOnce(mockMessage)
        .mockResolvedValueOnce(mockAssistantMessage);

      const result = await service.generateResponse(userId, message);

      expect(result.messageId).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });
});
