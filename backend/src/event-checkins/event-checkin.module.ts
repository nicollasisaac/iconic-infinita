// src/event-checkins/event-checkin.module.ts
import { Module } from '@nestjs/common';
import { EventCheckinService } from './event-checkin.service';
import { EventCheckinController } from './event-checkin.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [EventCheckinController],
  providers: [EventCheckinService, PrismaService],
  exports: [EventCheckinService],
})
export class EventCheckinModule {}
