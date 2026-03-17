import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtUser } from '../../auth/auth.types';
import {
  AutoxingAreaListRequestDto,
  AutoxingPoiCreateRequestDto,
  AutoxingPoiListRequestDto,
} from '../dto/map.dto';
import { filterEnvelopeByIds, normalizeIdentifier } from '../helpers/autoxing.helpers';
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

    const response = await this.autoxingApiService.getPoiList(body);

    // Filter response by businessId for non-admin users
    if (user.role !== Role.ADMIN) {
      const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
      return filterEnvelopeByIds(
        response,
        authorizedBusinessIds,
        (poi) => normalizeIdentifier(poi.businessId),
      );
    }

    return response;
  }

  createPoi(areaId: string, body: AutoxingPoiCreateRequestDto) {
    return this.autoxingApiService.createPoi(areaId, body);
  }

  async deletePoi(user: JwtUser, poiId: string) {
    await this.assertPoiAccess(user, poiId);
    return this.autoxingApiService.deletePoi(poiId);
  }

  async getPoiDetail(user: JwtUser, poiId: string) {
    const response = await this.autoxingApiService.getPoiDetail(poiId);
    await this.assertPoiDataAccess(user, response.data);
    return response;
  }

  async getAreaList(user: JwtUser, body: AutoxingAreaListRequestDto) {
    if (body.businessId && user.role !== Role.ADMIN) {
      const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
      if (!authorizedBusinessIds.has(body.businessId)) {
        throw new ForbiddenException('You do not have access to this business');
      }
    }

    const response = await this.autoxingApiService.getAreaList(body);

    // Filter response by businessId for non-admin users
    if (user.role !== Role.ADMIN) {
      const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
      return filterEnvelopeByIds(
        response,
        authorizedBusinessIds,
        (area) => normalizeIdentifier(area.businessId),
      );
    }

    return response;
  }

  getAreaBaseMap(areaId: string) {
    return this.autoxingApiService.getAreaBaseMap(areaId);
  }

  getAreaBaseMapHD(areaId: string) {
    return this.autoxingApiService.getAreaBaseMapHD(areaId);
  }

  getMapMeta(areaId: string) {
    return this.autoxingApiService.getMapMeta(areaId);
  }

  async getRobotDeployInfo(user: JwtUser, robotId: string) {
    const response = await this.autoxingApiService.getRobotDeployInfo(robotId);
    await this.assertDeployDataAccess(user, response.data);
    return response;
  }

  private async assertPoiAccess(user: JwtUser, poiId: string) {
    if (user.role === Role.ADMIN) {
      return;
    }

    const response = await this.autoxingApiService.getPoiDetail(poiId);
    await this.assertPoiDataAccess(user, response.data);
  }

  private async assertPoiDataAccess(user: JwtUser, poiData: unknown) {
    return this.assertResourceDataAccess(user, poiData, 'POI');
  }

  private async assertDeployDataAccess(user: JwtUser, deployData: unknown) {
    return this.assertResourceDataAccess(user, deployData, 'Robot deployment');
  }

  private async assertResourceDataAccess(user: JwtUser, data: unknown, resourceName: string) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (!data || typeof data !== 'object') {
      throw new NotFoundException(`${resourceName} not found`);
    }

    const businessId = normalizeIdentifier((data as { businessId?: unknown }).businessId);
    if (!businessId) {
      throw new ForbiddenException(`${resourceName} does not have a valid business ID`);
    }

    const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
    if (!authorizedBusinessIds.has(businessId)) {
      throw new ForbiddenException(`You do not have access to this ${resourceName.toLowerCase()}`);
    }
  }
}
