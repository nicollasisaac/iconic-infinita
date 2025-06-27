import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    this.$use(async (params: Prisma.MiddlewareParams, next) => {
      if (params.model === 'User' && ['create', 'update', 'upsert'].includes(params.action)) {
        const data = params.args?.data as Record<string, any>;

        if (data && data.role !== undefined) {
          data.is_iconic = data.role === 'iconic';
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
