import { Injectable } from '@nestjs/common';
import { AutoxingApiService } from './autoxing-api.service';

@Injectable()
export class AutoxingBusinessService {
  constructor(private readonly autoxingApiService: AutoxingApiService) {}

  getBuildingList() {
    return this.autoxingApiService.post('/building/v1.1/list');
  }

  getBusinessList() {
    return this.autoxingApiService.post('/business/v1.1/list');
  }
}
