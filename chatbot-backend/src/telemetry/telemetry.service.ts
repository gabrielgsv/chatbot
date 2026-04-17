import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryEvent, EventType } from './entities/telemetry-event.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { QueryEventsDto } from './dto/query-events.dto';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectRepository(TelemetryEvent)
    private telemetryRepository: Repository<TelemetryEvent>,
  ) {}

  async createBatch(
    userId: string,
    batchDto: CreateBatchDto,
  ): Promise<{ inserted: number }> {
    const events = batchDto.events.map((event) =>
      this.telemetryRepository.create({
        userId,
        eventType: event.eventType as EventType,
        timestamp: new Date(event.timestamp),
        metadata: (event.metadata || {}) as object,
        sessionId: event.sessionId,
        pageUrl: event.pageUrl,
      }),
    );

    // Use insert for better performance with large batches
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
      .getRawMany();

    return result.reduce(
      (acc, row) => {
        acc[row.type] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
