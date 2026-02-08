import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AutoxingResponseDto } from '../dto/response.dto';
import { AutoxingRobotListRequestDto } from '../dto/robot.dto';
import { AutoxingRobotService } from '../services/autoxing-robot.service';

@ApiTags('Autoxing - Robot')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('autoxing/robots')
export class AutoxingRobotController {
  constructor(private readonly autoxingRobotService: AutoxingRobotService) {}

  @Post('list')
  @ApiOperation({ summary: 'Proxy Autoxing robot list endpoint' })
  @ApiBody({ type: AutoxingRobotListRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  list(@Body() body: AutoxingRobotListRequestDto) {
    return this.autoxingRobotService.getRobotList(body);
  }

  @Get(':robotId/state')
  @ApiOperation({ summary: 'Proxy Autoxing robot state v1.1 endpoint' })
  @ApiParam({ name: 'robotId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getStateV1(@Param('robotId') robotId: string) {
    return this.autoxingRobotService.getRobotStateV1(robotId);
  }

  @Get(':robotId/state-v2')
  @ApiOperation({ summary: 'Proxy Autoxing robot state v2.0 endpoint' })
  @ApiParam({ name: 'robotId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getStateV2(@Param('robotId') robotId: string) {
    return this.autoxingRobotService.getRobotStateV2(robotId);
  }
}
