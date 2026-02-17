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
  AutoxingEnvelope,
  AutoxingRobotItem,
  AutoxingRobotListData,
  getAutoxingItems,
  replaceAutoxingItems,
} from '../types/autoxing-api.types';
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

    return this.filterEnvelopeByAuthorizedBusinessIds(response, authorizedBusinessIds);
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

  private filterEnvelopeByAuthorizedBusinessIds(
    envelope: AutoxingEnvelope<AutoxingRobotListData>,
    authorizedBusinessIds: Set<string>,
  ): AutoxingEnvelope<AutoxingRobotListData> {
    if (!envelope.data) {
      return envelope;
    }

    const filteredRobots = getAutoxingItems(envelope.data).filter((item) => {
      const businessId = this.extractRobotBusinessId(item);
      return businessId !== null && authorizedBusinessIds.has(businessId);
    });

    const clonedData = this.deepClone(envelope.data);
    replaceAutoxingItems(clonedData, filteredRobots);

    return {
      ...envelope,
      data: clonedData,
    };
  }

  private extractRobotBusinessId(item: AutoxingRobotItem) {
    const rawValue = item.businessId ?? item.buildingId;

    return this.normalizeIdentifier(rawValue);
  }

  private extractRobotId(item: AutoxingRobotItem) {
    const rawValue = item.robotId ?? item.id ?? item.serialNumber ?? item.sn;

    return this.normalizeIdentifier(rawValue);
  }

  private normalizeIdentifier(value: unknown) {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
