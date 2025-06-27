// src/event-participations/event-participation.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { EventParticipationService } from './event-participation.service';
import { CreateEventParticipationDto } from './dtos/create-event-participation.dto';
import { UpdateEventParticipationDto } from './dtos/update-event-participation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Event Participations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('event-participations')
export class EventParticipationController {
  constructor(private readonly service: EventParticipationService) {}

  @Post()
  @ApiOperation({ summary: 'Register current user in an event' })
  async create(@Req() req, @Body() dto: CreateEventParticipationDto) {
    const userId = req.user.sub;
    // chama create(), que faz toda a lógica transacional internamente
    return this.service.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all participations (admin only)' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get participation by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cancel your participation' })
  update(@Param('id') id: string, @Body() dto: UpdateEventParticipationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an event participation (admin only)' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('event/:eventId/confirmed-users')
  @ApiOperation({
    summary: 'Get confirmed users for an event (with visibility rules)',
  })
  getConfirmed(@Req() req, @Param('eventId') eventId: string) {
    return this.service.findConfirmedUsersWithProfiles(
      eventId,
      req.user.sub,
      req.user.role,
    );
  }
}
