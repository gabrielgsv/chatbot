import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryEvent } from './entities/telemetry-event.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { ChatMessage, MessageRole } from '../chat/entities/message.entity';

interface EventCountRow {
  type: string;
  count: string;
}

interface UserCountRow {
  count: string;
}

interface TimelineRow {
  date: string;
  count: string;
}

interface TopUserRow {
  userId: string;
  email: string;
  name: string;
  eventCount: string;
  lastActivity: string;
}

interface QuestionRow {
  question: string;
  count: string;
}

interface LocationStatsRow {
  timezone: string;
  count: string;
}

interface LanguageStatsRow {
  language: string;
  count: string;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectRepository(TelemetryEvent)
    private telemetryRepository: Repository<TelemetryEvent>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async createBatch(
    userId: string,
    batchDto: CreateBatchDto,
  ): Promise<{ inserted: number }> {
    const events = batchDto.events.map((event) =>
      this.telemetryRepository.create({
        userId,
        eventType: event.eventType,
        timestamp: new Date(event.timestamp),
        metadata: event.metadata || {},
        sessionId: event.sessionId,
        pageUrl: event.pageUrl,
      }),
    );

    const result = await this.telemetryRepository.insert(events);
    const count = result.identifiers?.length || events.length;

    this.logger.log(`Inserted ${count} telemetry events for user ${userId}`);

    return { inserted: count };
  }

  async findByUser(
    userId: string,
    query: QueryEventsDto,
  ): Promise<TelemetryEvent[]> {
    const qb = this.telemetryRepository
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .orderBy('event.timestamp', 'DESC');

    if (query.eventType) {
      qb.andWhere('event.eventType = :eventType', {
        eventType: query.eventType,
      });
    }

    if (query.startDate) {
      qb.andWhere('event.timestamp >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      qb.andWhere('event.timestamp <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    if (query.sessionId) {
      qb.andWhere('event.sessionId = :sessionId', {
        sessionId: query.sessionId,
      });
    }

    const limit = parseInt(query.limit || '100', 10);
    qb.take(Math.min(limit, 1000));

    return qb.getMany();
  }

  async getUserStats(userId: string): Promise<Record<string, number>> {
    const result = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('event.userId = :userId', { userId })
      .groupBy('event.eventType')
      .getRawMany<EventCountRow>();

    return result.reduce(
      (acc, row) => {
        acc[row.type] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async getAllStats(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    totalUsers: number;
    activeUsersToday: number;
    activeUsersThisWeek: number;
    activeUsersThisMonth: number;
  }> {
    const totalEvents = await this.telemetryRepository.count();

    const eventsByTypeResult = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.eventType')
      .getRawMany<EventCountRow>();

    const eventsByType = eventsByTypeResult.reduce(
      (acc, row) => {
        acc[row.type] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalUsersResult = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .getRawOne<UserCountRow>();
    const totalUsers = parseInt(totalUsersResult?.count ?? '0', 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const activeUsersTodayResult = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.timestamp >= :today', { today })
      .getRawOne<UserCountRow>();
    const activeUsersToday = parseInt(activeUsersTodayResult?.count ?? '0', 10);

    const activeUsersThisWeekResult = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.timestamp >= :weekAgo', { weekAgo })
      .getRawOne<UserCountRow>();
    const activeUsersThisWeek = parseInt(
      activeUsersThisWeekResult?.count ?? '0',
      10,
    );

    const activeUsersThisMonthResult = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.timestamp >= :monthAgo', { monthAgo })
      .getRawOne<UserCountRow>();
    const activeUsersThisMonth = parseInt(
      activeUsersThisMonthResult?.count ?? '0',
      10,
    );

    return {
      totalEvents,
      eventsByType,
      totalUsers,
      activeUsersToday,
      activeUsersThisWeek,
      activeUsersThisMonth,
    };
  }

  async getEventsTimeline(
    days: number = 30,
  ): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('DATE(event.timestamp)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('event.timestamp >= :startDate', { startDate })
      .groupBy('DATE(event.timestamp)')
      .orderBy('DATE(event.timestamp)', 'ASC')
      .getRawMany<TimelineRow>();

    return result.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }

  async getTopUsers(limit: number = 10): Promise<
    {
      userId: string;
      email: string;
      name: string;
      eventCount: number;
      lastActivity: Date;
    }[]
  > {
    const result = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('event.userId', 'userId')
      .addSelect('user.email', 'email')
      .addSelect('user.name', 'name')
      .addSelect('COUNT(*)', 'eventCount')
      .addSelect('MAX(event.timestamp)', 'lastActivity')
      .innerJoin('event.user', 'user')
      .groupBy('event.userId')
      .addGroupBy('user.email')
      .addGroupBy('user.name')
      .orderBy('"eventCount"', 'DESC')
      .limit(limit)
      .getRawMany<TopUserRow>();

    return result.map((row) => ({
      userId: row.userId,
      email: row.email,
      name: row.name,
      eventCount: parseInt(row.eventCount, 10),
      lastActivity: new Date(row.lastActivity),
    }));
  }

  async getRecentEvents(limit: number = 100): Promise<TelemetryEvent[]> {
    return this.telemetryRepository.find({
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getEventsByUser(userId: string): Promise<TelemetryEvent[]> {
    return this.telemetryRepository.find({
      where: { userId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
    });
  }

  async getFrequentQuestions(
    limit: number = 10,
  ): Promise<{ question: string; count: number }[]> {
    const result = await this.chatMessageRepository
      .createQueryBuilder('message')
      .select('MAX(message.content)', 'question')
      .addSelect('COUNT(*)', 'count')
      .where('message.role = :role', { role: MessageRole.USER })
      .andWhere('message.content IS NOT NULL')
      .andWhere("message.content != ''")
      .groupBy(
        "LOWER(translate(message.content, 'ÁÂÃÀÄÅáâãàäåÉÊÈËéêèëÍÎÌÏíîìïÓÔÒÕÖóôòõöÚÙÛÜúùûüÇçÑñ', 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'))",
      )
      .orderBy('"count"', 'DESC')
      .limit(limit)
      .getRawMany<QuestionRow>();

    return result.map((row) => ({
      question: row.question,
      count: parseInt(row.count, 10),
    }));
  }

  async getLocationStats(): Promise<{ timezone: string; count: number }[]> {
    const result = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('event.metadata->>\'timezone\'', 'timezone')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventType = :eventType', { eventType: 'user_location' })
      .andWhere('event.metadata->>\'timezone\' IS NOT NULL')
      .groupBy('event.metadata->>\'timezone\'')
      .orderBy('"count"', 'DESC')
      .getRawMany<LocationStatsRow>();

    return result.map((row) => ({
      timezone: row.timezone,
      count: parseInt(row.count, 10),
    }));
  }

  async getLanguageStats(): Promise<{ language: string; count: number }[]> {
    const result = await this.telemetryRepository
      .createQueryBuilder('event')
      .select('event.metadata->>\'browserLanguage\'', 'language')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventType = :eventType', { eventType: 'language' })
      .andWhere('event.metadata->>\'browserLanguage\' IS NOT NULL')
      .groupBy('event.metadata->>\'browserLanguage\'')
      .orderBy('"count"', 'DESC')
      .getRawMany<LanguageStatsRow>();

    return result.map((row) => ({
      language: row.language,
      count: parseInt(row.count, 10),
    }));
  }
}
