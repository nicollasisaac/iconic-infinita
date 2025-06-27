// src/live-events/live-events.module.ts
import { Module } from '@nestjs/common';
import { LiveEventsService } from './live-events.service';
import { LiveEventsController } from './live-events.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EventCheckinModule } from '../event-checkins/event-checkin.module';

@Module({
  imports: [
    EventCheckinModule,   
  ],
  controllers: [LiveEventsController],
  providers: [LiveEventsService, PrismaService],
  exports: [LiveEventsService],
})
export class LiveEventsModule {}
