import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('telemetry')
@Controller('telemetry')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit batch of telemetry events' })
  @ApiResponse({ status: 201, description: 'Events recorded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBatch(
    @Request() req: { user: { userId: string } },
    @Body() batchDto: CreateBatchDto,
  ) {
    try {
      const result = await this.telemetryService.createBatch(
        req.user.userId,
        batchDto,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Events recorded successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create telemetry batch: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        error: 'Create telemetry batch failed',
      });
    }
  }

  @Get('events')
  @ApiOperation({ summary: 'Query telemetry events for current user' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async findByUser(
    @Request() req: { user: { userId: string } },
    @Query() query: QueryEventsDto,
  ) {
    const events = await this.telemetryService.findByUser(
      req.user.userId,
      query,
    );
    return {
      statusCode: HttpStatus.OK,
      data: events,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user telemetry statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats(@Request() req: { user: { userId: string } }) {
    const stats = await this.telemetryService.getUserStats(req.user.userId);
    return {
      statusCode: HttpStatus.OK,
      data: stats,
    };
  }
}
