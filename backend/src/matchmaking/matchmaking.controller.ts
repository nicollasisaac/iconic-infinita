// src/matchmaking/matchmaking.controller.ts
import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { CreateMatchDto } from '../live-events/dtos/create-match.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Matchmaking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('live-events/:liveEventId/matches')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post()
  @ApiOperation({ summary: 'Generate match groups' })
  @ApiResponse({ status: 200, description: 'Groups created' })
  create(
    @Param('liveEventId') liveEventId: string,
    @Body() dto: CreateMatchDto,
    @Req() req,
  ) {
    return this.matchmakingService.generateGroups(
      liveEventId,
      dto.groupSize,
      req.user.sub,
    );
  }
}
