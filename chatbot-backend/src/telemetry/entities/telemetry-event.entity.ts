import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EventType {
  USER_DATA = 'user_data',
  USER_MESSAGE = 'user_message',
  BOT_RESPONSE = 'bot_response',
  USER_LOCATION = 'user_location',
  RETURN_RATE = 'return_rate',
  MESSAGE_INTERVAL = 'message_interval',
  FEEDBACK = 'feedback',
  RESPONSE_TIME = 'response_time',
  LANGUAGE = 'language',
}

@Entity('telemetry_events')
@Index(['userId', 'eventType'])
@Index(['userId', 'timestamp'])
@Index(['sessionId'])
export class TelemetryEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  eventType!: EventType;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: object | null;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  pageUrl?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
