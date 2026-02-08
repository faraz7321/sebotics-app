import { Injectable } from '@nestjs/common';
import { AutoxingRobotListRequestDto } from '../dto/robot.dto';
import { AutoxingApiService } from './autoxing-api.service';

@Injectable()
export class AutoxingRobotService {
  constructor(private readonly autoxingApiService: AutoxingApiService) {}

  getRobotList(body: AutoxingRobotListRequestDto) {
    return this.autoxingApiService.post('/robot/v1.1/list', { body });
  }

  getRobotStateV1(robotId: string) {
    return this.autoxingApiService.get(`/robot/v1.1/${robotId}/state`);
  }

  getRobotStateV2(robotId: string) {
    return this.autoxingApiService.get(`/robot/v2.0/${robotId}/state`);
  }
}
