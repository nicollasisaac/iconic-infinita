import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { EventParticipationModule } from './event-participations/event-participation.module';
import { EventCheckinModule } from './event-checkins/event-checkin.module';
import { UserPhotosModule } from './user-photos/user-photo.module';
import { IconicModule } from './iconic/iconic.module';
import { PaymentModule } from './payment/payment.module';
import { BnbModule } from './bnb-chain/bnb.module';
import { LiveEventsModule } from './live-events/live-events.module';
import { PollsModule } from './polls/polls.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { PromoteIconicGuard } from './users/promote-iconic.guard';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: { transport: { target: 'pino-pretty' } },
    }),
    ThrottlerModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({ name: 'checkin' }),
    BullModule.registerQueue({ name: 'participation' }),
    CacheModule.register({ ttl: 60, max: 100 }),
    AuthModule,
    UsersModule,
    EventsModule,
    EventParticipationModule,
    EventCheckinModule,
    UserPhotosModule,
    IconicModule,
    PaymentModule,
    BnbModule,
    LiveEventsModule,
    PollsModule,
    MatchmakingModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    PromoteIconicGuard,
  ],
})
export class AppModule {}
