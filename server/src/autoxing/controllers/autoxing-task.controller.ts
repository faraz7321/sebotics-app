import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AutoxingResponseDto } from '../dto/response.dto';
import {
  AutoxingTaskCreateV1Dto,
  AutoxingTaskCreateV3Dto,
  AutoxingTaskDetailQueryDto,
  AutoxingTaskListRequestDto,
  AutoxingTaskUpdateRequestDto,
} from '../dto/task.dto';
import { AutoxingTaskService } from '../services/autoxing-task.service';

@ApiTags('Autoxing - Task')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('autoxing/tasks')
export class AutoxingTaskController {
  constructor(private readonly autoxingTaskService: AutoxingTaskService) {}

  @Post('v3')
  @ApiOperation({ summary: 'Proxy Autoxing create task v3 endpoint' })
  @ApiBody({ type: AutoxingTaskCreateV3Dto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  createTaskV3(@Body() body: AutoxingTaskCreateV3Dto) {
    return this.autoxingTaskService.createTaskV3(body);
  }

  @Post()
  @ApiOperation({ summary: 'Proxy Autoxing create task v1.1 endpoint' })
  @ApiBody({ type: AutoxingTaskCreateV1Dto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  createTaskV1(@Body() body: AutoxingTaskCreateV1Dto) {
    return this.autoxingTaskService.createTaskV1(body);
  }

  @Post('list')
  @ApiOperation({ summary: 'Proxy Autoxing task list endpoint' })
  @ApiBody({ type: AutoxingTaskListRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  listTasks(@Body() body: AutoxingTaskListRequestDto) {
    return this.autoxingTaskService.getTaskList(body);
  }

  @Get('v3/:taskId')
  @ApiOperation({ summary: 'Proxy Autoxing task detail v3 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiQuery({ name: 'needDetail', required: false, type: Boolean })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getTaskV3(
    @Param('taskId') taskId: string,
    @Query() query: AutoxingTaskDetailQueryDto,
  ) {
    return this.autoxingTaskService.getTaskV3(taskId, query);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Proxy Autoxing task detail v1.1 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getTask(@Param('taskId') taskId: string) {
    return this.autoxingTaskService.getTask(taskId);
  }

  @Post(':taskId')
  @ApiOperation({ summary: 'Proxy Autoxing update task endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiBody({ type: AutoxingTaskUpdateRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  updateTask(
    @Param('taskId') taskId: string,
    @Body() body: AutoxingTaskUpdateRequestDto,
  ) {
    return this.autoxingTaskService.updateTask(taskId, body);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Proxy Autoxing delete task endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  deleteTask(@Param('taskId') taskId: string) {
    return this.autoxingTaskService.deleteTask(taskId);
  }

  @Post(':taskId/execute')
  @ApiOperation({ summary: 'Proxy Autoxing execute task endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  executeTask(@Param('taskId') taskId: string) {
    return this.autoxingTaskService.executeTask(taskId);
  }

  @Post('v3/:taskId/cancel')
  @ApiOperation({ summary: 'Proxy Autoxing cancel task v3 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  cancelTaskV3(@Param('taskId') taskId: string) {
    return this.autoxingTaskService.cancelTaskV3(taskId);
  }

  @Post(':taskId/cancel')
  @ApiOperation({ summary: 'Proxy Autoxing cancel task v1.1 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  cancelTaskV1(@Param('taskId') taskId: string) {
    return this.autoxingTaskService.cancelTaskV1(taskId);
  }

  @Get('v2/:taskId/state')
  @ApiOperation({ summary: 'Proxy Autoxing task state v2 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getTaskStateV2(@Param('taskId') taskId: string) {
    return this.autoxingTaskService.getTaskStateV2(taskId);
  }
}
