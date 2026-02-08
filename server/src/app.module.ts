import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AutoxingModule } from './autoxing/autoxing.module';
import { UsersModule } from './users/users.module';
import { RobotsModule } from './robots/robots.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AutoxingModule,
    AuthModule,
    UsersModule,
    RobotsModule,
  ],
})
export class AppModule {}
