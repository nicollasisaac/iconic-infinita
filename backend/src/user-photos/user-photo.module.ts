import { Module } from '@nestjs/common';
import { UserPhotosService } from './user-photo.service';
import { UserPhotosController } from './user-photo.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UserPhotosController],
  providers: [UserPhotosService, PrismaService],
})
export class UserPhotosModule {}