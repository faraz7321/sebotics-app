import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AutoxingModule } from './autoxing/autoxing.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
//import { RobotsModule } from './robots/robots.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AutoxingModule,
    AuthModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
