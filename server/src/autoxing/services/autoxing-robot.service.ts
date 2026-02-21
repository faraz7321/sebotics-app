import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtUser } from '../../auth/auth.types';
import { AutoxingRobotListRequestDto } from '../dto/robot.dto';
import {
  AutoxingRobotItem,
  getAutoxingItems,
} from '../types/autoxing-api.types';
import { filterEnvelopeByIds, normalizeIdentifier } from '../helpers/autoxing.helpers';
import { AutoxingApiService } from './autoxing-api.service';
import { AutoxingBusinessService } from './autoxing-business.service';

@Injectable()
export class AutoxingRobotService {
  constructor(
    @Inject(AutoxingApiService)
    private readonly autoxingApiService: AutoxingApiService,
    @Inject(AutoxingBusinessService)
    private readonly autoxingBusinessService: AutoxingBusinessService,
  ) {}

  async getLiveRobotList(body: AutoxingRobotListRequestDto, user: JwtUser) {
    const requestBody =
      user.role === Role.ADMIN
        ? body
        : {
            ...body,
            pageSize: 0,
          };

    const response = await this.autoxingApiService.getRobotList(requestBody);

    if (user.role === Role.ADMIN) {
      return response;
    }

    const authorizedBusinessIds =
      await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);

    return filterEnvelopeByIds(
      response,
      authorizedBusinessIds,
      (item) => this.extractRobotBusinessId(item),
    );
  }

  async getLiveRobotStateV1(robotId: string, user: JwtUser) {
    await this.assertLiveRobotAccess(robotId, user);
    return this.autoxingApiService.getRobotStateV1(robotId);
  }

  async getLiveRobotStateV2(robotId: string, user: JwtUser) {
    await this.assertLiveRobotAccess(robotId, user);
    return this.autoxingApiService.getRobotStateV2(robotId);
  }

  private async assertLiveRobotAccess(robotId: string, user: JwtUser) {
    if (user.role === Role.ADMIN) {
      return;
    }

    const authorizedBusinessIds =
      await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);

    if (authorizedBusinessIds.size === 0) {
      throw new ForbiddenException('You do not have access to this robot');
    }

    const allRobotsResponse = await this.autoxingApiService.getRobotList({ pageSize: 0 });
    const robots = getAutoxingItems(allRobotsResponse.data);

    const targetRobot = robots.find((item) => this.extractRobotId(item) === robotId);
    if (!targetRobot) {
      throw new NotFoundException('Robot not found');
    }

    const businessId = this.extractRobotBusinessId(targetRobot);
    if (!businessId || !authorizedBusinessIds.has(businessId)) {
      throw new ForbiddenException('You do not have access to this robot');
    }
  }

  private extractRobotBusinessId(item: AutoxingRobotItem) {
    const rawValue = item.businessId ?? item.buildingId;

    return normalizeIdentifier(rawValue);
  }

  private extractRobotId(item: AutoxingRobotItem) {
    const rawValue = item.robotId ?? item.id ?? item.serialNumber ?? item.sn;

    return normalizeIdentifier(rawValue);
  }
}
