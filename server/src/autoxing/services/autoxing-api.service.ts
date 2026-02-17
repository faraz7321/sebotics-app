import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AutoxingAuthService } from '../auth/autoxing-auth.service';
import {
  AutoxingAccessToken,
  AutoxingBuildingListData,
  AutoxingBusinessListData,
  AutoxingEnvelope,
  AutoxingRobotListData,
  AutoxingRequestOptions,
} from '../types/autoxing-api.types';
import {
  AutoxingAreaListRequestDto,
  AutoxingPoiCreateRequestDto,
  AutoxingPoiListRequestDto,
} from '../dto/map.dto';
import { AutoxingRobotListRequestDto } from '../dto/robot.dto';
import {
  AutoxingTaskCreateV1Dto,
  AutoxingTaskCreateV3Dto,
  AutoxingTaskDetailQueryDto,
  AutoxingTaskListRequestDto,
  AutoxingTaskUpdateRequestDto,
} from '../dto/task.dto';

@Injectable()
export class AutoxingApiService {
  private readonly logger = new Logger(AutoxingApiService.name);
  private readonly baseUrl = (process.env.AUTOXING_BASE_URL ?? 'https://api.autoxing.com').replace(/\/$/, '');

  constructor(
    @Inject(AutoxingAuthService)
    private readonly autoxingAuthService: AutoxingAuthService,
  ) {}

  async get<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('GET', path, options);
  }

  async post<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('POST', path, options);
  }

  async put<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('PUT', path, options);
  }

  async delete<T = unknown>(path: string, options?: AutoxingRequestOptions) {
    return this.requestJson<T>('DELETE', path, options);
  }

  async getBinary(path: string, options?: AutoxingRequestOptions) {
    const token = await this.getTokenOrThrow();
    let response: Response;

    try {
      response = await fetch(this.buildUrl(path, options?.query), {
        method: 'GET',
        headers: {
          'X-Token': token.token,
        },
      });
    } catch (error) {
      this.logger.error('Autoxing binary request failed', { path, error });
      throw new BadGatewayException('Autoxing request failed');
    }

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Autoxing binary request failed: ${response.status}`, body);
      throw new BadGatewayException('Autoxing request failed');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      buffer,
    };
  }

  // Pure Autoxing endpoint wrappers used by higher-level business services.
  getBuildingList() {
    return this.post<AutoxingBuildingListData>('/building/v1.1/list');
  }

  getBusinessList() {
    return this.post<AutoxingBusinessListData>('/business/v1.1/list');
  }

  getRobotList(body: AutoxingRobotListRequestDto) {
    return this.post<AutoxingRobotListData>('/robot/v1.1/list', { body });
  }

  getRobotStateV1(robotId: string) {
    return this.get(`/robot/v1.1/${robotId}/state`);
  }

  getRobotStateV2(robotId: string) {
    return this.get(`/robot/v2.0/${robotId}/state`);
  }

  getPoiList(body: AutoxingPoiListRequestDto) {
    return this.post('/map/v1.1/poi/list', { body });
  }

  createPoi(areaId: string, body: AutoxingPoiCreateRequestDto) {
    return this.put(`/map/v1.1/poi/${areaId}`, { body });
  }

  deletePoi(poiId: string) {
    return this.delete(`/map/v1.1/poi/${poiId}`);
  }

  getPoiDetail(poiId: string) {
    return this.get(`/map/v1.1/poi/${poiId}`);
  }

  getAreaList(body: AutoxingAreaListRequestDto) {
    return this.post('/map/v1.1/area/list', { body });
  }

  getAreaBaseMap(areaId: string) {
    return this.getBinary(`/map/v1.1/area/${areaId}/base-map`);
  }

  getRobotDeployInfo(robotId: string) {
    return this.get(`/map/v1.1/robot/${robotId}/deploy`);
  }

  createTaskV3(body: AutoxingTaskCreateV3Dto) {
    return this.post('/task/v3/create', { body });
  }

  createTaskV1(body: AutoxingTaskCreateV1Dto) {
    return this.post('/task/v1.1', { body });
  }

  getTaskList(body: AutoxingTaskListRequestDto) {
    return this.post('/task/v1.1/list', { body });
  }

  getTaskV3(taskId: string, query: AutoxingTaskDetailQueryDto) {
    return this.get(`/task/v3/${taskId}`, {
      query: {
        needDetail: query.needDetail,
      },
    });
  }

  getTask(taskId: string) {
    return this.get(`/task/v1.1/${taskId}`);
  }

  updateTask(taskId: string, body: AutoxingTaskUpdateRequestDto) {
    return this.post(`/task/v1.1/${taskId}`, { body });
  }

  deleteTask(taskId: string) {
    return this.delete(`/task/v1.1/${taskId}`);
  }

  executeTask(taskId: string) {
    return this.post(`/task/v1.1/${taskId}/execute`);
  }

  cancelTaskV3(taskId: string) {
    return this.post(`/task/v3/${taskId}/cancel`);
  }

  cancelTaskV1(taskId: string) {
    return this.post(`/task/v1.1/${taskId}/cancel`);
  }

  getTaskStateV2(taskId: string) {
    return this.get(`/task/v2.0/${taskId}/state`);
  }

  private async requestJson<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, options?: AutoxingRequestOptions) {
    const token = await this.getTokenOrThrow();

    const hasBody = options?.body !== undefined;

    let response: Response;

    try {
      response = await fetch(this.buildUrl(path, options?.query), {
        method,
        headers: {
          'X-Token': token.token,
          ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(hasBody ? { body: JSON.stringify(options?.body) } : {}),
      });
    } catch (error) {
      this.logger.error('Autoxing request failed', { method, path, error });
      throw new BadGatewayException('Autoxing request failed');
    }

    let payload: AutoxingEnvelope<T> | null = null;
    try {
      payload = (await response.json()) as AutoxingEnvelope<T>;
    } catch {
      throw new InternalServerErrorException('Invalid response from Autoxing');
    }

    if (!response.ok || !payload || payload.status !== 200) {
      this.logger.error('Autoxing request failed', {
        method,
        path,
        httpStatus: response.status,
        payload,
      });
      throw new BadGatewayException(payload?.message ?? 'Autoxing request failed');
    }

    return payload;
  }

  private async getTokenOrThrow(): Promise<AutoxingAccessToken> {
    try {
      const token = await this.autoxingAuthService.getAccessToken();
      if (!token?.token) {
        this.logger.error('Autoxing token missing or empty');
        throw new Error('Autoxing token missing');
      }
      return token;
    } catch (error) {
      this.logger.error('Autoxing authentication failed', { error });
      throw new BadGatewayException('Your request could not be authenticated with Autoxing. Please try again later');
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}
