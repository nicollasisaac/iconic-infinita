import { Module } from '@nestjs/common';
import { IconicController } from './iconic.controller';
import { IconicService } from './iconic.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [IconicController],
  providers: [IconicService, PrismaService],
})
export class IconicModule {}
