import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/auth.types';
import { AssignRobotDto, RegisterRobotDto, UnassignRobotDto } from './robots.dto';
import { RobotResponseDto, RobotWithUserResponseDto } from './robots-response.dto';
import { RobotsService } from './robots.service';

@ApiTags('Robots')
@ApiBearerAuth('JWT-auth')
@Controller('robots')
export class RobotsController {
  constructor(@Inject(RobotsService) private readonly robotsService: RobotsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('register')
  @ApiOperation({ summary: 'Register a new robot (Admin only)' })
  @ApiBody({ type: RegisterRobotDto })
  @ApiCreatedResponse({ 
    description: 'Robot successfully registered',
    type: RobotResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Robot already registered' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  register(@Body() body: RegisterRobotDto) {
    return this.robotsService.registerRobot(body.serialNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('assign')
  @ApiOperation({ summary: 'Assign a robot to a user (Admin only)' })
  @ApiBody({ type: AssignRobotDto })
  @ApiOkResponse({ 
    description: 'Robot successfully assigned',
    type: RobotResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Robot already assigned' })
  @ApiNotFoundResponse({ description: 'Robot or user not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  assign(@Body() body: AssignRobotDto) {
    return this.robotsService.assignRobot(body.serialNumber, body.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('unassign')
  @ApiOperation({ summary: 'Unassign a robot from its user (Admin only)' })
  @ApiBody({ type: UnassignRobotDto })
  @ApiOkResponse({ 
    description: 'Robot successfully unassigned',
    type: RobotResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Robot not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  unassign(@Body() body: UnassignRobotDto) {
    return this.robotsService.unassignRobot(body.serialNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all robots (Admin only)' })
  @ApiOkResponse({ 
    description: 'List of all robots with assignment info',
    type: [RobotWithUserResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  listAll() {
    return this.robotsService.listAllRobots();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiOperation({ summary: 'List robots assigned to current user' })
  @ApiOkResponse({ 
    description: 'List of robots assigned to the authenticated user',
    type: [RobotResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  listMy(@CurrentUser() user: JwtUser) {
    return this.robotsService.listRobotsForUser(user.userId);
  }
}
