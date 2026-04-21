import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryEvent } from './entities/telemetry-event.entity';
import { ChatMessage } from '../chat/entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TelemetryEvent, ChatMessage])],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
