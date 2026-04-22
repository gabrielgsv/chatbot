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
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

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
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to create telemetry batch: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
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

  @UseGuards(AdminGuard)
  @Get('admin/stats')
  @ApiOperation({ summary: 'Get all telemetry statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllStats() {
    const stats = await this.telemetryService.getAllStats();
    return {
      statusCode: HttpStatus.OK,
      data: stats,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/timeline')
  @ApiOperation({ summary: 'Get events timeline (Admin only)' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to include',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getEventsTimeline(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const timeline = await this.telemetryService.getEventsTimeline(days);
    return {
      statusCode: HttpStatus.OK,
      data: timeline,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/top-users')
  @ApiOperation({ summary: 'Get top users by event count (Admin only)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of users to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Top users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getTopUsers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const users = await this.telemetryService.getTopUsers(limit);
    return {
      statusCode: HttpStatus.OK,
      data: users,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/recent-events')
  @ApiOperation({ summary: 'Get recent events (Admin only)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of events to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent events retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getRecentEvents(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    const events = await this.telemetryService.getRecentEvents(limit);
    return {
      statusCode: HttpStatus.OK,
      data: events,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/user-events/:userId')
  @ApiOperation({ summary: 'Get events for specific user (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User events retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getEventsByUser(@Param('userId') userId: string) {
    const events = await this.telemetryService.getEventsByUser(userId);
    return {
      statusCode: HttpStatus.OK,
      data: events,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/frequent-questions')
  @ApiOperation({ summary: 'Get most frequent questions (Admin only)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of questions to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Frequent questions retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getFrequentQuestions(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const questions = await this.telemetryService.getFrequentQuestions(limit);
    return {
      statusCode: HttpStatus.OK,
      data: questions,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/locations')
  @ApiOperation({ summary: 'Get location statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Location statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getLocationStats() {
    const locations = await this.telemetryService.getLocationStats();
    return {
      statusCode: HttpStatus.OK,
      data: locations,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/languages')
  @ApiOperation({ summary: 'Get language statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Language statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getLanguageStats() {
    const languages = await this.telemetryService.getLanguageStats();
    return {
      statusCode: HttpStatus.OK,
      data: languages,
    };
  }
}
