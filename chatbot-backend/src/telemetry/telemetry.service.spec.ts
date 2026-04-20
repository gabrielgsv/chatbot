/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TelemetryService } from './telemetry.service';
import { TelemetryEvent, EventType } from './entities/telemetry-event.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { ChatMessage, MessageRole } from '../chat/entities/message.entity';
import { Repository } from 'typeorm';

describe('TelemetryService', () => {
  let service: TelemetryService;

  const mockTelemetryEvent: TelemetryEvent = {
    id: 'test-uuid',
    userId: 'user-123',
    eventType: EventType.USER_MESSAGE,
    timestamp: new Date(),
    metadata: { key: 'value' },
    sessionId: 'session-123',
    pageUrl: 'https://example.com',
    createdAt: new Date(),
    user: {} as any,
  };

  const mockChatMessage: ChatMessage = {
    id: 'chat-uuid',
    userId: 'user-123',
    role: MessageRole.USER,
    content: 'Test question',
    sessionId: 'session-123',
    metadata: undefined,
    createdAt: new Date(),
    user: {} as any,
  };

  const mockTelemetryRepository = {
    create: jest.fn(),
    insert: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockChatMessageRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: getRepositoryToken(TelemetryEvent),
          useValue: mockTelemetryRepository,
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockChatMessageRepository,
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    telemetryRepository = module.get(getRepositoryToken(TelemetryEvent));
    chatMessageRepository = module.get(getRepositoryToken(ChatMessage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBatch', () => {
    it('should create batch of telemetry events successfully', async () => {
      const userId = 'user-123';
      const batchDto: CreateBatchDto = {
        events: [
          {
            eventType: EventType.USER_MESSAGE,
            timestamp: new Date().toISOString(),
            metadata: { key: 'value' },
            sessionId: 'session-123',
            pageUrl: 'https://example.com',
          },
        ],
      };

      mockTelemetryRepository.create.mockReturnValue(mockTelemetryEvent);
      mockTelemetryRepository.insert.mockResolvedValue({
        identifiers: [{ id: 'test-uuid' }],
      } as any);

      const result = await service.createBatch(userId, batchDto);

      expect(mockTelemetryRepository.create).toHaveBeenCalledWith({
        userId,
        eventType: EventType.USER_MESSAGE,
        timestamp: expect.any(Date),
        metadata: { key: 'value' },
        sessionId: 'session-123',
        pageUrl: 'https://example.com',
      });
      expect(mockTelemetryRepository.insert).toHaveBeenCalled();
      expect(result).toEqual({ inserted: 1 });
    });

    it('should handle multiple events in batch', async () => {
      const userId = 'user-123';
      const batchDto: CreateBatchDto = {
        events: [
          {
            eventType: EventType.USER_MESSAGE,
            timestamp: new Date().toISOString(),
          },
          {
            eventType: EventType.BOT_RESPONSE,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      mockTelemetryRepository.create.mockReturnValue(mockTelemetryEvent);
      mockTelemetryRepository.insert.mockResolvedValue({
        identifiers: [{ id: '1' }, { id: '2' }],
      } as any);

      const result = await service.createBatch(userId, batchDto);

      expect(mockTelemetryRepository.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ inserted: 2 });
    });

    it('should handle empty metadata', async () => {
      const userId = 'user-123';
      const batchDto: CreateBatchDto = {
        events: [
          {
            eventType: EventType.USER_MESSAGE,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      mockTelemetryRepository.create.mockReturnValue(mockTelemetryEvent);
      mockTelemetryRepository.insert.mockResolvedValue({
        identifiers: [],
      } as any);

      await service.createBatch(userId, batchDto);

      expect(mockTelemetryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {},
        }),
      );
    });

    it('should handle missing sessionId and pageUrl', async () => {
      const userId = 'user-123';
      const batchDto: CreateBatchDto = {
        events: [
          {
            eventType: EventType.USER_MESSAGE,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      mockTelemetryRepository.create.mockReturnValue(mockTelemetryEvent);
      mockTelemetryRepository.insert.mockResolvedValue({
        identifiers: [],
      } as any);

      await service.createBatch(userId, batchDto);

      expect(mockTelemetryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: undefined,
          pageUrl: undefined,
        }),
      );
    });
  });

  describe('findByUser', () => {
    it('should return events for a user', async () => {
      const userId = 'user-123';
      const query: QueryEventsDto = {};

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTelemetryEvent]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findByUser(userId, query);

      expect(mockTelemetryRepository.createQueryBuilder).toHaveBeenCalledWith(
        'event',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'event.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'event.timestamp',
        'DESC',
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
      expect(result).toEqual([mockTelemetryEvent]);
    });

    it('should filter by eventType', async () => {
      const userId = 'user-123';
      const query: QueryEventsDto = { eventType: EventType.USER_MESSAGE };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTelemetryEvent]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByUser(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'event.eventType = :eventType',
        {
          eventType: EventType.USER_MESSAGE,
        },
      );
    });

    it('should filter by startDate', async () => {
      const userId = 'user-123';
      const query: QueryEventsDto = { startDate: '2024-01-01' };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTelemetryEvent]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByUser(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'event.timestamp >= :startDate',
        {
          startDate: expect.any(Date),
        },
      );
    });

    it('should filter by endDate', async () => {
      const userId = 'user-123';
      const query: QueryEventsDto = { endDate: '2024-12-31' };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTelemetryEvent]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByUser(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'event.timestamp <= :endDate',
        {
          endDate: expect.any(Date),
        },
      );
    });

    it('should filter by sessionId', async () => {
      const userId = 'user-123';
      const query: QueryEventsDto = { sessionId: 'session-123' };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTelemetryEvent]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByUser(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'event.sessionId = :sessionId',
        {
          sessionId: 'session-123',
        },
      );
    });

    it('should respect custom limit', async () => {
      const userId = 'user-123';
      const query: QueryEventsDto = { limit: '50' };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTelemetryEvent]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByUser(userId, query);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('should cap limit at 1000', async () => {
      const userId = 'user-123';
      const query: QueryEventsDto = { limit: '2000' };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTelemetryEvent]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findByUser(userId, query);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(1000);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics grouped by event type', async () => {
      const userId = 'user-123';

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: EventType.USER_MESSAGE, count: '10' },
          { type: EventType.BOT_RESPONSE, count: '5' },
        ]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getUserStats(userId);

      expect(result).toEqual({
        [EventType.USER_MESSAGE]: 10,
        [EventType.BOT_RESPONSE]: 5,
      });
    });

    it('should return empty object when no events', async () => {
      const userId = 'user-123';

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getUserStats(userId);

      expect(result).toEqual({});
    });
  });

  describe('getAllStats', () => {
    it('should return all statistics', async () => {
      mockTelemetryRepository.count.mockResolvedValue(100);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: EventType.USER_MESSAGE, count: '50' },
          { type: EventType.BOT_RESPONSE, count: '50' },
        ]),
        getRawOne: jest
          .fn()
          .mockResolvedValueOnce({ count: '10' })
          .mockResolvedValueOnce({ count: '5' })
          .mockResolvedValueOnce({ count: '8' })
          .mockResolvedValueOnce({ count: '10' }),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getAllStats();

      expect(result.totalEvents).toBe(100);
      expect(result.eventsByType).toEqual({
        [EventType.USER_MESSAGE]: 50,
        [EventType.BOT_RESPONSE]: 50,
      });
      expect(result.totalUsers).toBe(10);
      expect(result.activeUsersToday).toBe(5);
      expect(result.activeUsersThisWeek).toBe(8);
      expect(result.activeUsersThisMonth).toBe(10);
    });
  });

  describe('getEventsTimeline', () => {
    it('should return events timeline', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { date: '2024-01-01', count: '10' },
          { date: '2024-01-02', count: '20' },
        ]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getEventsTimeline(30);

      expect(result).toEqual([
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-02', count: 20 },
      ]);
    });

    it('should use default days of 30', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getEventsTimeline();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'event.timestamp >= :startDate',
        expect.any(Object),
      );
    });
  });

  describe('getTopUsers', () => {
    it('should return top users by event count', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            userId: 'user-1',
            email: 'user1@example.com',
            name: 'User 1',
            eventCount: '100',
            lastActivity: '2024-01-01',
          },
        ]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getTopUsers(10);

      expect(result).toEqual([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          eventCount: 100,
          lastActivity: expect.any(Date),
        },
      ]);
    });

    it('should use default limit of 10', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockTelemetryRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getTopUsers();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events', async () => {
      mockTelemetryRepository.find.mockResolvedValue([mockTelemetryEvent]);

      const result = await service.getRecentEvents(100);

      expect(mockTelemetryRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { timestamp: 'DESC' },
        take: 100,
      });
      expect(result).toEqual([mockTelemetryEvent]);
    });

    it('should use default limit of 100', async () => {
      mockTelemetryRepository.find.mockResolvedValue([]);

      await service.getRecentEvents();

      expect(mockTelemetryRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { timestamp: 'DESC' },
        take: 100,
      });
    });
  });

  describe('getEventsByUser', () => {
    it('should return events for specific user', async () => {
      const userId = 'user-123';
      mockTelemetryRepository.find.mockResolvedValue([mockTelemetryEvent]);

      const result = await service.getEventsByUser(userId);

      expect(mockTelemetryRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user'],
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual([mockTelemetryEvent]);
    });
  });

  describe('getFrequentQuestions', () => {
    it('should return frequent questions', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { question: 'What is Hand Talk?', count: '10' },
          { question: 'How does it work?', count: '5' },
        ]),
      };

      mockChatMessageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getFrequentQuestions(10);

      expect(result).toEqual([
        { question: 'What is Hand Talk?', count: 10 },
        { question: 'How does it work?', count: 5 },
      ]);
    });

    it('should use default limit of 10', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockChatMessageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getFrequentQuestions();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should filter by user role', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockChatMessageRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getFrequentQuestions(10);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'message.role = :role',
        { role: MessageRole.USER },
      );
    });
  });
});
