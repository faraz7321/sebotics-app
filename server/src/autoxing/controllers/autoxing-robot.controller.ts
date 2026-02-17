import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { AutoxingResponseDto } from '../dto/response.dto';
import { AutoxingRobotListRequestDto } from '../dto/robot.dto';
import { AutoxingRobotService } from '../services/autoxing-robot.service';

@ApiTags('Autoxing - Robot')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('autoxing/robots')
export class AutoxingRobotController {
  constructor(
    @Inject(AutoxingRobotService)
    private readonly autoxingRobotService: AutoxingRobotService,
  ) {}

  @Post('list')
  @ApiOperation({ summary: 'Get LIVE Autoxing robot list filtered by current user business assignments' })
  @ApiBody({ type: AutoxingRobotListRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  list(
    @CurrentUser() user: JwtUser,
    @Body() body: AutoxingRobotListRequestDto,
  ) {
    return this.autoxingRobotService.getLiveRobotList(body, user);
  }

  @Get(':robotId/state')
  @ApiOperation({ summary: 'Get LIVE Autoxing robot state v1.1 for an authorized robot' })
  @ApiParam({ name: 'robotId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Robot not assigned to user businesses' })
  getStateV1(
    @CurrentUser() user: JwtUser,
    @Param('robotId') robotId: string,
  ) {
    return this.autoxingRobotService.getLiveRobotStateV1(robotId, user);
  }

  @Get(':robotId/state-v2')
  @ApiOperation({ summary: 'Get LIVE Autoxing robot state v2.0 for an authorized robot' })
  @ApiParam({ name: 'robotId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Robot not assigned to user businesses' })
  getStateV2(
    @CurrentUser() user: JwtUser,
    @Param('robotId') robotId: string,
  ) {
    return this.autoxingRobotService.getLiveRobotStateV2(robotId, user);
  }
}
