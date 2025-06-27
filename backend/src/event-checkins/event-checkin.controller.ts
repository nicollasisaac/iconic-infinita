// src/event-checkins/event-checkin.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
  HttpCode,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventCheckinService } from './event-checkin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiForbiddenResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { GenerateCheckinDto } from './dtos/generate-checkin.dto';
import { AdminCheckinDto } from './dtos/admin-checkin.dto';

@ApiTags('Event Checkins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('event-checkins')
export class EventCheckinController {
  constructor(private readonly service: EventCheckinService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate QR code for event (user must be confirmed)',
  })
  generate(@Req() req, @Body() dto: GenerateCheckinDto) {
    // JWT garante usuário autenticado
    return this.service.generate(req.user.sub, dto.event_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.scanner)
  @Post('scan')
  @ApiOperation({
    summary: 'Scan QR code and confirm check-in (admin or scanner)',
  })
  scan(@Req() req, @Body() dto: AdminCheckinDto) {
    return this.service.scan(dto.qr_token, req.user.sub);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'List all check-ins for a specific event' })
  findByEvent(@Param('eventId') eventId: string) {
    // JWT guard no nível de classe já protege este endpoint
    return this.service.findByEvent(eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.scanner)
  @Get('event/:eventId/with-scanner')
  @ApiOperation({
    summary: 'Get checked-in users with scanner info (admin/scanner only)',
  })
  findWithScanner(@Param('eventId') eventId: string) {
    return this.service.findWithScannerInfo(eventId);
  }

  @Get('event/:eventId/checked-in-users')
  @ApiOperation({
    summary:
      'List all users that checked-in to the event (with visibility rules)',
  })
  getCheckedInUsers(@Req() req, @Param('eventId') eventId: string) {
    // JWT guard garante autenticado; service valida roles/permissões
    return this.service.getCheckedInUsers(eventId, req.user.sub, req.user.role);
  }

  @Get('event/:eventId/user/:userId/checked')
  @ApiOperation({ summary: 'Check if given user has checked in to the event' })
  @ApiForbiddenResponse({
    description: 'Only admin or same user can check this',
  })
  isUserCheckedIn(
    @Req() req,
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ) {
    // JWT guard já aplicado; roles internos garantem segurança
    if (req.user.role !== Role.admin && req.user.sub !== userId) {
      throw new ForbiddenException('Não autorizado a consultar outro usuário');
    }
    return this.service.isUserCheckedIn(userId, eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(':checkin_id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a check-in (admin only)' })
  @ApiForbiddenResponse({ description: 'Only admins can delete check-ins' })
  delete(@Param('checkin_id') checkin_id: string) {
    return this.service.delete(checkin_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.scanner)
  @Post('manual-checkin')
  @ApiOperation({
    summary: 'Manually check in a user using email (admin/scanner only)',
  })
  @ApiResponse({ status: 200, description: 'Check-in confirmed manually' })
  manualCheckin(@Body() body: { event_id: string; email: string }, @Req() req) {
    return this.service.manualCheckinByEmail(
      body.event_id,
      body.email,
      req.user.sub,
    );
  }
}
