// src/polls/polls.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  controllers: [PollsController],
  providers: [PollsService, PrismaService],
  exports: [PollsService],
})
export class PollsModule {}
