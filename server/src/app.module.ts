import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AutoxingModule } from './autoxing/autoxing.module';
import { ElevatorModule } from './elevator/elevator.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from './mailer/mailer.module';
import { ConfigController } from './config/config.controller';

function readPositiveInt(configService: ConfigService, key: string, fallback: number) {
  const raw = configService.get<string>(key);
  const parsed = Number(raw);

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.trunc(parsed);
  }

  return fallback;
}

@Module({
  controllers: [ConfigController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: readPositiveInt(configService, 'THROTTLE_SHORT_TTL_MS', 1000),
            limit: readPositiveInt(configService, 'THROTTLE_SHORT_LIMIT', 10),
          },
          {
            name: 'medium',
            ttl: readPositiveInt(configService, 'THROTTLE_MEDIUM_TTL_MS', 10000),
            limit: readPositiveInt(configService, 'THROTTLE_MEDIUM_LIMIT', 60),
          },
          {
            name: 'long',
            ttl: readPositiveInt(configService, 'THROTTLE_LONG_TTL_MS', 60000),
            limit: readPositiveInt(configService, 'THROTTLE_LONG_LIMIT', 240),
          },
        ],
      }),
    }),
    PrismaModule,
    AutoxingModule,
    ElevatorModule,
    AuthModule,
    HealthModule,
    UsersModule,
    MailerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
