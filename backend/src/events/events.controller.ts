// src/events/events.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dtos/create-event.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /* ────────────────────────────────
   *  CREATE
   * ──────────────────────────────── */
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(@Body() dto: CreateEventDto, @Req() req) {
    return this.eventsService.create(dto, req.user.sub);
  }

  /* ────────────────────────────────
   *  LISTS
   * ──────────────────────────────── */
  @UseGuards(JwtAuthGuard)
  @Get('public')
  @ApiOperation({ summary: 'List all public events' })
  findPublic() {
    return this.eventsService.findAllPublic();
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  @ApiOperation({ summary: 'List events marked as exclusive' })
  findPrivate() {
    return this.eventsService.findAllExclusive();
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommended')
  @ApiOperation({
    summary: 'Recommended events (+participation/+live/+progress flags)',
  })
  findRecommended(@Req() req) {
    return this.eventsService.findRecommendedWithParticipation(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('participating')
  @ApiOperation({ summary: 'Events in which the user is already confirmed' })
  findParticipating(@Req() req) {
    return this.eventsService.findParticipating(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owned')
  @ApiOperation({ summary: 'Events created by the authenticated user' })
  findOwned(@Req() req) {
    return this.eventsService.findOwned(req.user.sub);
  }

  /* ────────────────────────────────
   *  SINGLE EVENT (with participation flag)
   * ──────────────────────────────── */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get event details ( + participation info )' })
  findById(@Param('id') id: string, @Req() req) {
    return this.eventsService.findByIdWithParticipation(id, req.user.sub);
  }

  /* ────────────────────────────────
   *  UPDATE
   * ──────────────────────────────── */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an event (owner or admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req,
  ) {
    return this.eventsService.update(
      id,
      dto,
      req.user.sub,
      req.user.role as Role,
    );
  }

  /* ────────────────────────────────
   *  DELETE
   * ──────────────────────────────── */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event (owner or admin only)' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.eventsService.remove(id, req.user.sub, req.user.role as Role);
  }
}
