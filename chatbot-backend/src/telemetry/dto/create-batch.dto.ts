import { IsArray, IsEnum, IsJSON, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../entities/telemetry-event.entity';

export class TelemetryEventDto {
  @IsEnum(EventType)
  eventType!: EventType;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsOptional()
  metadata?: object;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  pageUrl?: string;
}

export class CreateBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventDto)
  events!: TelemetryEventDto[];
}
