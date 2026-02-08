import { Injectable } from '@nestjs/common';
import {
  AutoxingTaskCreateV1Dto,
  AutoxingTaskCreateV3Dto,
  AutoxingTaskDetailQueryDto,
  AutoxingTaskListRequestDto,
  AutoxingTaskUpdateRequestDto,
} from '../dto/task.dto';
import { AutoxingApiService } from './autoxing-api.service';

@Injectable()
export class AutoxingTaskService {
  constructor(private readonly autoxingApiService: AutoxingApiService) {}

  createTaskV3(body: AutoxingTaskCreateV3Dto) {
    return this.autoxingApiService.post('/task/v3/create', { body });
  }

  createTaskV1(body: AutoxingTaskCreateV1Dto) {
    return this.autoxingApiService.post('/task/v1.1', { body });
  }

  getTaskList(body: AutoxingTaskListRequestDto) {
    return this.autoxingApiService.post('/task/v1.1/list', { body });
  }

  getTaskV3(taskId: string, query: AutoxingTaskDetailQueryDto) {
    return this.autoxingApiService.get(`/task/v3/${taskId}`, {
      query: {
        needDetail: query.needDetail,
      },
    });
  }

  getTask(taskId: string) {
    return this.autoxingApiService.get(`/task/v1.1/${taskId}`);
  }

  updateTask(taskId: string, body: AutoxingTaskUpdateRequestDto) {
    return this.autoxingApiService.post(`/task/v1.1/${taskId}`, { body });
  }

  deleteTask(taskId: string) {
    return this.autoxingApiService.delete(`/task/v1.1/${taskId}`);
  }

  executeTask(taskId: string) {
    return this.autoxingApiService.post(`/task/v1.1/${taskId}/execute`);
  }

  cancelTaskV3(taskId: string) {
    return this.autoxingApiService.post(`/task/v3/${taskId}/cancel`);
  }

  cancelTaskV1(taskId: string) {
    return this.autoxingApiService.post(`/task/v1.1/${taskId}/cancel`);
  }

  getTaskStateV2(taskId: string) {
    return this.autoxingApiService.get(`/task/v2.0/${taskId}/state`);
  }
}
