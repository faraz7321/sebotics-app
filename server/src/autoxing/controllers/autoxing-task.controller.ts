import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import { JwtUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
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
@Controller('autoxing/tasks')
export class AutoxingTaskController {
  constructor(
    @Inject(AutoxingTaskService)
    private readonly autoxingTaskService: AutoxingTaskService,
  ) {}

  @Post('v3')
  @ApiOperation({ summary: 'Proxy Autoxing create task v3 endpoint' })
  @ApiBody({ type: AutoxingTaskCreateV3Dto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  createTaskV3(@CurrentUser() user: JwtUser, @Body() body: AutoxingTaskCreateV3Dto) {
    return this.autoxingTaskService.createTaskV3(user, body);
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
  listTasks(@CurrentUser() user: JwtUser, @Body() body: AutoxingTaskListRequestDto) {
    return this.autoxingTaskService.getTaskList(user, body);
  }

  @Get('v3/:taskId')
  @ApiOperation({ summary: 'Proxy Autoxing task detail v3 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiQuery({ name: 'needDetail', required: false, type: Boolean })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getTaskV3(
    @CurrentUser() user: JwtUser,
    @Param('taskId') taskId: string,
    @Query() query: AutoxingTaskDetailQueryDto,
  ) {
    return this.autoxingTaskService.getTaskV3(user, taskId, query);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Proxy Autoxing task detail v1.1 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getTask(@CurrentUser() user: JwtUser, @Param('taskId') taskId: string) {
    return this.autoxingTaskService.getTask(user, taskId);
  }

  @Post(':taskId')
  @ApiOperation({ summary: 'Proxy Autoxing update task endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiBody({ type: AutoxingTaskUpdateRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  updateTask(
    @CurrentUser() user: JwtUser,
    @Param('taskId') taskId: string,
    @Body() body: AutoxingTaskUpdateRequestDto,
  ) {
    return this.autoxingTaskService.updateTask(user, taskId, body);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Proxy Autoxing delete task endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  deleteTask(@CurrentUser() user: JwtUser, @Param('taskId') taskId: string) {
    return this.autoxingTaskService.deleteTask(user, taskId);
  }

  @Post(':taskId/execute')
  @ApiOperation({ summary: 'Proxy Autoxing execute task endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  executeTask(@CurrentUser() user: JwtUser, @Param('taskId') taskId: string) {
    return this.autoxingTaskService.executeTask(user, taskId);
  }

  @Post('v3/:taskId/cancel')
  @ApiOperation({ summary: 'Proxy Autoxing cancel task v3 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  cancelTaskV3(@CurrentUser() user: JwtUser, @Param('taskId') taskId: string) {
    return this.autoxingTaskService.cancelTaskV3(user, taskId);
  }

  @Post(':taskId/cancel')
  @ApiOperation({ summary: 'Proxy Autoxing cancel task v1.1 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  cancelTaskV1(@CurrentUser() user: JwtUser, @Param('taskId') taskId: string) {
    return this.autoxingTaskService.cancelTaskV1(user, taskId);
  }

  @Get('v2/:taskId/state')
  @ApiOperation({ summary: 'Proxy Autoxing task state v2 endpoint' })
  @ApiParam({ name: 'taskId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getTaskStateV2(@CurrentUser() user: JwtUser, @Param('taskId') taskId: string) {
    return this.autoxingTaskService.getTaskStateV2(user, taskId);
  }
}
