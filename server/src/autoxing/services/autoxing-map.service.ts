import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtUser } from '../../auth/auth.types';
import {
  AutoxingAreaListRequestDto,
  AutoxingPoiCreateRequestDto,
  AutoxingPoiListRequestDto,
} from '../dto/map.dto';
import { AutoxingApiService } from './autoxing-api.service';
import { AutoxingBusinessService } from './autoxing-business.service';

@Injectable()
export class AutoxingMapService {
  constructor(
    @Inject(AutoxingApiService)
    private readonly autoxingApiService: AutoxingApiService,
    @Inject(AutoxingBusinessService)
    private readonly autoxingBusinessService: AutoxingBusinessService,
  ) {}

  async getPoiList(user: JwtUser, body: AutoxingPoiListRequestDto) {
    if (body.businessId && user.role !== Role.ADMIN) {
      const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
      if (!authorizedBusinessIds.has(body.businessId)) {
        throw new ForbiddenException('You do not have access to this business');
      }
    }
    return this.autoxingApiService.getPoiList(body);
  }

  createPoi(areaId: string, body: AutoxingPoiCreateRequestDto) {
    return this.autoxingApiService.createPoi(areaId, body);
  }

  deletePoi(poiId: string) {
    return this.autoxingApiService.deletePoi(poiId);
  }

  getPoiDetail(poiId: string) {
    return this.autoxingApiService.getPoiDetail(poiId);
  }

  async getAreaList(user: JwtUser, body: AutoxingAreaListRequestDto) {
    if (body.businessId && user.role !== Role.ADMIN) {
      const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
      if (!authorizedBusinessIds.has(body.businessId)) {
        throw new ForbiddenException('You do not have access to this business');
      }
    }
    return this.autoxingApiService.getAreaList(body);
  }

  getAreaBaseMap(areaId: string) {
    return this.autoxingApiService.getAreaBaseMap(areaId);
  }

  getRobotDeployInfo(robotId: string) {
    return this.autoxingApiService.getRobotDeployInfo(robotId);
  }
}
