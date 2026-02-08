import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AutoxingAuthModule } from './auth/autoxing-auth.module';
import { AutoxingBusinessController } from './controllers/autoxing-business.controller';
import { AutoxingMapController } from './controllers/autoxing-map.controller';
import { AutoxingRobotController } from './controllers/autoxing-robot.controller';
import { AutoxingTaskController } from './controllers/autoxing-task.controller';
import { AutoxingApiService } from './services/autoxing-api.service';
import { AutoxingBusinessService } from './services/autoxing-business.service';
import { AutoxingMapService } from './services/autoxing-map.service';
import { AutoxingRobotService } from './services/autoxing-robot.service';
import { AutoxingTaskService } from './services/autoxing-task.service';

@Module({
  imports: [AutoxingAuthModule],
  controllers: [
    AutoxingRobotController,
    AutoxingMapController,
    AutoxingTaskController,
    AutoxingBusinessController,
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    AutoxingApiService,
    AutoxingRobotService,
    AutoxingMapService,
    AutoxingTaskService,
    AutoxingBusinessService,
  ],
})
export class AutoxingModule {}
