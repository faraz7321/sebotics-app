import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RobotsController } from './robots.controller';
import { RobotsService } from './robots.service';

@Module({
  controllers: [RobotsController],
  providers: [RobotsService, JwtAuthGuard, RolesGuard],
})
export class RobotsModule {}
