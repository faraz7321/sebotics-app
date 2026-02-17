import { Inject, Injectable } from '@nestjs/common';
import {
  AutoxingAreaListRequestDto,
  AutoxingPoiCreateRequestDto,
  AutoxingPoiListRequestDto,
} from '../dto/map.dto';
import { AutoxingApiService } from './autoxing-api.service';

@Injectable()
export class AutoxingMapService {
  constructor(
    @Inject(AutoxingApiService)
    private readonly autoxingApiService: AutoxingApiService,
  ) {}

  getPoiList(body: AutoxingPoiListRequestDto) {
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

  getAreaList(body: AutoxingAreaListRequestDto) {
    return this.autoxingApiService.getAreaList(body);
  }

  getAreaBaseMap(areaId: string) {
    return this.autoxingApiService.getAreaBaseMap(areaId);
  }

  getRobotDeployInfo(robotId: string) {
    return this.autoxingApiService.getRobotDeployInfo(robotId);
  }
}
