import { Inject, Injectable } from '@nestjs/common';
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
  constructor(
    @Inject(AutoxingApiService)
    private readonly autoxingApiService: AutoxingApiService,
  ) {}

  createTaskV3(body: AutoxingTaskCreateV3Dto) {
    return this.autoxingApiService.createTaskV3(body);
  }

  createTaskV1(body: AutoxingTaskCreateV1Dto) {
    return this.autoxingApiService.createTaskV1(body);
  }

  getTaskList(body: AutoxingTaskListRequestDto) {
    return this.autoxingApiService.getTaskList(body);
  }

  getTaskV3(taskId: string, query: AutoxingTaskDetailQueryDto) {
    return this.autoxingApiService.getTaskV3(taskId, query);
  }

  getTask(taskId: string) {
    return this.autoxingApiService.getTask(taskId);
  }

  updateTask(taskId: string, body: AutoxingTaskUpdateRequestDto) {
    return this.autoxingApiService.updateTask(taskId, body);
  }

  deleteTask(taskId: string) {
    return this.autoxingApiService.deleteTask(taskId);
  }

  executeTask(taskId: string) {
    return this.autoxingApiService.executeTask(taskId);
  }

  cancelTaskV3(taskId: string) {
    return this.autoxingApiService.cancelTaskV3(taskId);
  }

  cancelTaskV1(taskId: string) {
    return this.autoxingApiService.cancelTaskV1(taskId);
  }

  getTaskStateV2(taskId: string) {
    return this.autoxingApiService.getTaskStateV2(taskId);
  }
}
