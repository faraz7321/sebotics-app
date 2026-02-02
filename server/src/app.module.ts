import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AutoxingAuthModule } from './autoxing-auth/autoxing-auth.module';
import { UsersModule } from './users/users.module';
import { RobotsModule } from './robots/robots.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AutoxingAuthModule,
    AuthModule,
    UsersModule,
    RobotsModule,
  ],
})
export class AppModule {}
