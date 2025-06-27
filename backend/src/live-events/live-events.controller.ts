// src/live-events/live-events.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LiveEventsService } from './live-events.service';
import { CreateLiveEventDto } from './dtos/create-live-event.dto';
import { CreateMatchDto } from './dtos/create-match.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('LiveEvents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events/:eventId/live-events')
export class LiveEventsController {
  constructor(private readonly liveEventsService: LiveEventsService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new LiveEvent for an Event' })
  @ApiResponse({ status: 201, description: 'LiveEvent created' })
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateLiveEventDto,
    @Req() req,
  ) {
    return this.liveEventsService.create(eventId, dto, req.user.sub);
  }
  @Get()
  @ApiOperation({ summary: 'List all LiveEvents for an Event' })
  @ApiResponse({ status: 200, description: 'List of LiveEvents' })
  findAll(@Param('eventId') eventId: string, @Req() req) {
    return this.liveEventsService.findAll(eventId, req.user.sub, req.user.role);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get one LiveEvent by ID' })
  @ApiResponse({ status: 200, description: 'LiveEvent data' })
  findOne(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.liveEventsService.findOne(id, req.user.sub, req.user.role);
  }
  @Post(':id/start')
  @ApiOperation({ summary: 'Start a LiveEvent (owner or admin)' })
  @ApiResponse({ status: 200, description: 'LiveEvent started' })
  start(@Param('id') id: string, @Req() req) {
    return this.liveEventsService.start(id, req.user.sub);
  }
  @Post(':id/end')
  @ApiOperation({ summary: 'End a LiveEvent (owner or admin)' })
  @ApiResponse({ status: 200, description: 'LiveEvent ended' })
  end(@Param('id') id: string, @Req() req) {
    return this.liveEventsService.end(id, req.user.sub);
  }
  @Post(':id/match')
  @ApiOperation({ summary: 'Start instant match and form groups' })
  @ApiResponse({ status: 200, description: 'Match groups created' })
  startMatch(
    @Param('eventId') eventId: string,
    @Param('id') liveEventId: string,
    @Body() dto: CreateMatchDto,
    @Req() req,
  ) {
    return this.liveEventsService.startMatch(
      liveEventId,
      dto.groupSize,
      req.user.sub,
    );
  }
  @Get(':id/match/me')
  @ApiOperation({ summary: 'Get my match partners for this liveEvent' })
  @ApiResponse({ status: 200, description: 'List of partner profiles' })
  getMyMatch(@Param('id') liveEventId: string, @Req() req) {
    return this.liveEventsService.getMyMatch(liveEventId, req.user.sub);
  }
}
