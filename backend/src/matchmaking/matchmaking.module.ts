// src/matchmaking/matchmaking.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { EventCheckinService } from '../event-checkins/event-checkin.service';

@Module({
  controllers: [MatchmakingController],
  providers: [MatchmakingService, PrismaService, EventCheckinService],
})
export class MatchmakingModule {}
