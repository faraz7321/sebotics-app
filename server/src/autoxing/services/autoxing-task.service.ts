import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtUser } from '../../auth/auth.types';
import {
  AutoxingTaskCreateV1Dto,
  AutoxingTaskCreateV3Dto,
  AutoxingTaskDetailQueryDto,
  AutoxingTaskListRequestDto,
  AutoxingTaskUpdateRequestDto,
} from '../dto/task.dto';
import { AutoxingApiService } from './autoxing-api.service';
import { AutoxingBusinessService } from './autoxing-business.service';

@Injectable()
export class AutoxingTaskService {
  constructor(
    @Inject(AutoxingApiService)
    private readonly autoxingApiService: AutoxingApiService,
    @Inject(AutoxingBusinessService)
    private readonly autoxingBusinessService: AutoxingBusinessService,
  ) {}

  async createTaskV3(user: JwtUser, body: AutoxingTaskCreateV3Dto) {
    if (body.businessId && user.role !== Role.ADMIN) {
      const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
      if (!authorizedBusinessIds.has(body.businessId)) {
        throw new ForbiddenException('You do not have access to this business');
      }
    }
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
