// src/event-participation/event-participation.module.ts
import { Module } from '@nestjs/common';
import { EventParticipationController } from './event-participation.controller';
import { EventParticipationService } from './event-participation.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EventParticipationController],
  providers: [
    EventParticipationService,
    PrismaService,
  ],
})
export class EventParticipationModule {}
