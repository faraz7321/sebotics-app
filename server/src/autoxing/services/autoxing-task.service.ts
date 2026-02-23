import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtUser } from '../../auth/auth.types';
import {
  AutoxingTaskCreateV1Dto,
  AutoxingTaskCreateV3Dto,
  AutoxingTaskDetailQueryDto,
  AutoxingTaskListRequestDto,
  AutoxingTaskUpdateRequestDto,
} from '../dto/task.dto';
import { filterEnvelopeByIds, normalizeIdentifier } from '../helpers/autoxing.helpers';
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

  async getTaskList(user: JwtUser, body: AutoxingTaskListRequestDto) {
    const response = await this.autoxingApiService.getTaskList(body);
    
    if (user.role === Role.ADMIN) {
      return response;
    }

    const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
    return filterEnvelopeByIds(
      response,
      authorizedBusinessIds,
      (task) => normalizeIdentifier(task.businessId),
    );
  }

  async getTaskV3(user: JwtUser, taskId: string, query: AutoxingTaskDetailQueryDto) {
    const response = await this.autoxingApiService.getTaskV3(taskId, query);
    await this.assertTaskAccess(user, response.data);
    return response;
  }

  async getTask(user: JwtUser, taskId: string) {
    const response = await this.autoxingApiService.getTask(taskId);
    await this.assertTaskAccess(user, response.data);
    return response;
  }

  async updateTask(user: JwtUser, taskId: string, body: AutoxingTaskUpdateRequestDto) {
    await this.assertTaskAccessById(user, taskId);
    return this.autoxingApiService.updateTask(taskId, body);
  }

  async deleteTask(user: JwtUser, taskId: string) {
    await this.assertTaskAccessById(user, taskId);
    return this.autoxingApiService.deleteTask(taskId);
  }

  async executeTask(user: JwtUser, taskId: string) {
    await this.assertTaskAccessById(user, taskId);
    return this.autoxingApiService.executeTask(taskId);
  }

  async cancelTaskV3(user: JwtUser, taskId: string) {
    await this.assertTaskAccessById(user, taskId);
    return this.autoxingApiService.cancelTaskV3(taskId);
  }

  async cancelTaskV1(user: JwtUser, taskId: string) {
    await this.assertTaskAccessById(user, taskId);
    return this.autoxingApiService.cancelTaskV1(taskId);
  }

  async getTaskStateV2(user: JwtUser, taskId: string) {
    const response = await this.autoxingApiService.getTaskStateV2(taskId);
    await this.assertTaskAccess(user, response.data);
    return response;
  }

  private async assertTaskAccessById(user: JwtUser, taskId: string) {
    if (user.role === Role.ADMIN) {
      return;
    }

    const response = await this.autoxingApiService.getTask(taskId);
    await this.assertTaskAccess(user, response.data);
  }

  private async assertTaskAccess(user: JwtUser, taskData: unknown) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (!taskData || typeof taskData !== 'object') {
      throw new NotFoundException('Task not found');
    }

    const businessId = normalizeIdentifier((taskData as { businessId?: unknown }).businessId);
    if (!businessId) {
      throw new ForbiddenException('Task does not have a valid business ID');
    }

    const authorizedBusinessIds = await this.autoxingBusinessService.getAuthorizedBusinessIds(user.userId);
    if (!authorizedBusinessIds.has(businessId)) {
      throw new ForbiddenException('You do not have access to this task');
    }
  }
}
