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
    return this.autoxingApiService.post('/map/v1.1/poi/list', { body });
  }

  createPoi(areaId: string, body: AutoxingPoiCreateRequestDto) {
    return this.autoxingApiService.put(`/map/v1.1/poi/${areaId}`, { body });
  }

  deletePoi(poiId: string) {
    return this.autoxingApiService.delete(`/map/v1.1/poi/${poiId}`);
  }

  getPoiDetail(poiId: string) {
    return this.autoxingApiService.get(`/map/v1.1/poi/${poiId}`);
  }

  getAreaList(body: AutoxingAreaListRequestDto) {
    return this.autoxingApiService.post('/map/v1.1/area/list', { body });
  }

  getAreaBaseMap(areaId: string) {
    return this.autoxingApiService.getBinary(`/map/v1.1/area/${areaId}/base-map`);
  }

  getRobotDeployInfo(robotId: string) {
    return this.autoxingApiService.get(`/map/v1.1/robot/${robotId}/deploy`);
  }
}
