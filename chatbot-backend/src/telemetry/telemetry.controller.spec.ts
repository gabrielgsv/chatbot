import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { InternalServerErrorException } from '@nestjs/common';
import { EventType } from './entities/telemetry-event.entity';

describe('TelemetryController', () => {
  let controller: TelemetryController;
  let service: jest.Mocked<TelemetryService>;

  const mockTelemetryService = {
    createBatch: jest.fn(),
    findByUser: jest.fn(),
    getUserStats: jest.fn(),
    getAllStats: jest.fn(),
    getEventsTimeline: jest.fn(),
    getTopUsers: jest.fn(),
    getRecentEvents: jest.fn(),
    getEventsByUser: jest.fn(),
    getFrequentQuestions: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAdminGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryService,
          useValue: mockTelemetryService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<TelemetryController>(TelemetryController);
    service = module.get(TelemetryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBatch', () => {
    it('should create batch of telemetry events successfully', async () => {
      const req = { user: { userId: 'user-123' } };
      const batchDto: CreateBatchDto = {
        events: [
          {
            eventType: EventType.USER_MESSAGE,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      mockTelemetryService.createBatch.mockResolvedValue({ inserted: 1 });

      const result = await controller.createBatch(req as any, batchDto);

      expect(service.createBatch).toHaveBeenCalledWith('user-123', batchDto);
      expect(result).toEqual({
        statusCode: 201,
        message: 'Events recorded successfully',
        data: { inserted: 1 },
      });
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const req = { user: { userId: 'user-123' } };
      const batchDto: CreateBatchDto = { events: [] };
      const error = new Error('Database error');

      mockTelemetryService.createBatch.mockRejectedValue(error);

      await expect(
        controller.createBatch(req as any, batchDto),
      ).rejects.toThrow(InternalServerErrorException);
      expect(service.createBatch).toHaveBeenCalledWith('user-123', batchDto);
    });
  });

  describe('findByUser', () => {
    it('should return events for current user', async () => {
      const req = { user: { userId: 'user-123' } };
      const query: QueryEventsDto = {};
      const mockEvents = [{ id: '1', eventType: EventType.USER_MESSAGE }];

      mockTelemetryService.findByUser.mockResolvedValue(mockEvents as any);

      const result = await controller.findByUser(req as any, query);

      expect(service.findByUser).toHaveBeenCalledWith('user-123', query);
      expect(result).toEqual({
        statusCode: 200,
        data: mockEvents,
      });
    });

    it('should pass query parameters to service', async () => {
      const req = { user: { userId: 'user-123' } };
      const query: QueryEventsDto = {
        eventType: EventType.USER_MESSAGE,
        startDate: '2024-01-01',
        limit: '50',
      };

      mockTelemetryService.findByUser.mockResolvedValue([]);

      await controller.findByUser(req as any, query);

      expect(service.findByUser).toHaveBeenCalledWith('user-123', query);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      const req = { user: { userId: 'user-123' } };
      const mockStats = {
        [EventType.USER_MESSAGE]: 10,
        [EventType.BOT_RESPONSE]: 5,
      };

      mockTelemetryService.getUserStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(req as any);

      expect(service.getUserStats).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        statusCode: 200,
        data: mockStats,
      });
    });
  });

  describe('getAllStats', () => {
    it('should return all statistics (admin only)', async () => {
      const mockStats = {
        totalEvents: 100,
        eventsByType: { [EventType.USER_MESSAGE]: 50 },
        totalUsers: 10,
        activeUsersToday: 5,
        activeUsersThisWeek: 8,
        activeUsersThisMonth: 10,
      };

      mockTelemetryService.getAllStats.mockResolvedValue(mockStats);

      const result = await controller.getAllStats();

      expect(service.getAllStats).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: 200,
        data: mockStats,
      });
    });
  });

  describe('getEventsTimeline', () => {
    it('should return events timeline (admin only)', async () => {
      const mockTimeline = [
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-02', count: 20 },
      ];

      mockTelemetryService.getEventsTimeline.mockResolvedValue(mockTimeline);

      const result = await controller.getEventsTimeline(30);

      expect(service.getEventsTimeline).toHaveBeenCalledWith(30);
      expect(result).toEqual({
        statusCode: 200,
        data: mockTimeline,
      });
    });

    it('should use default days of 30', async () => {
      mockTelemetryService.getEventsTimeline.mockResolvedValue([]);

      await controller.getEventsTimeline(30);

      expect(service.getEventsTimeline).toHaveBeenCalledWith(30);
    });
  });

  describe('getTopUsers', () => {
    it('should return top users (admin only)', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          eventCount: 100,
          lastActivity: new Date(),
        },
      ];

      mockTelemetryService.getTopUsers.mockResolvedValue(mockUsers);

      const result = await controller.getTopUsers(10);

      expect(service.getTopUsers).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        statusCode: 200,
        data: mockUsers,
      });
    });

    it('should use default limit of 10', async () => {
      mockTelemetryService.getTopUsers.mockResolvedValue([]);

      await controller.getTopUsers(10);

      expect(service.getTopUsers).toHaveBeenCalledWith(10);
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events (admin only)', async () => {
      const mockEvents = [{ id: '1', eventType: EventType.USER_MESSAGE }];

      mockTelemetryService.getRecentEvents.mockResolvedValue(mockEvents as any);

      const result = await controller.getRecentEvents(100);

      expect(service.getRecentEvents).toHaveBeenCalledWith(100);
      expect(result).toEqual({
        statusCode: 200,
        data: mockEvents,
      });
    });

    it('should use default limit of 100', async () => {
      mockTelemetryService.getRecentEvents.mockResolvedValue([]);

      await controller.getRecentEvents(100);

      expect(service.getRecentEvents).toHaveBeenCalledWith(100);
    });
  });

  describe('getEventsByUser', () => {
    it('should return events for specific user (admin only)', async () => {
      const userId = 'user-123';
      const mockEvents = [{ id: '1', eventType: EventType.USER_MESSAGE }];

      mockTelemetryService.getEventsByUser.mockResolvedValue(mockEvents as any);

      const result = await controller.getEventsByUser(userId);

      expect(service.getEventsByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        statusCode: 200,
        data: mockEvents,
      });
    });
  });

  describe('getFrequentQuestions', () => {
    it('should return frequent questions (admin only)', async () => {
      const mockQuestions = [
        { question: 'What is Hand Talk?', count: 10 },
        { question: 'How does it work?', count: 5 },
      ];

      mockTelemetryService.getFrequentQuestions.mockResolvedValue(
        mockQuestions,
      );

      const result = await controller.getFrequentQuestions(10);

      expect(service.getFrequentQuestions).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        statusCode: 200,
        data: mockQuestions,
      });
    });

    it('should use default limit of 10', async () => {
      mockTelemetryService.getFrequentQuestions.mockResolvedValue([]);

      await controller.getFrequentQuestions(10);

      expect(service.getFrequentQuestions).toHaveBeenCalledWith(10);
    });
  });
});
