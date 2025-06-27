// src/polls/polls.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dtos/create-poll.dto';
import { VoteDto } from './dtos/vote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Polls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('live-events/:liveEventId/polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new poll in a LiveEvent' })
  create(
    @Param('liveEventId') liveEventId: string,
    @Body() dto: CreatePollDto,
    @Req() req,
  ) {
    return this.pollsService.create(liveEventId, dto, req.user.sub);
  }

  @Post(':pollId/vote')
  @ApiOperation({ summary: 'Vote in a poll' })
  vote(
    @Param('liveEventId') liveEventId: string,
    @Param('pollId') pollId: string,
    @Body() dto: VoteDto,
    @Req() req,
  ) {
    return this.pollsService.vote(pollId, dto.optionId, req.user.sub);
  }
}
