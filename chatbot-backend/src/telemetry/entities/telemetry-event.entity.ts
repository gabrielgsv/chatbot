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
  TYPING_START = 'typing_start',
  TYPING_END = 'typing_end',
  TYPING_PAUSE = 'typing_pause',
  MESSAGE_EDIT = 'message_edit',
  MESSAGE_CLEAR = 'message_clear',
  SCROLL_VELOCITY = 'scroll_velocity',
  CLICK_HEATMAP = 'click_heatmap',
  TIME_ON_PAGE = 'time_on_page',
  TAB_SWITCH = 'tab_switch',
  DEVICE_INFO = 'device_info',
  CONNECTION_QUALITY = 'connection_quality',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
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
