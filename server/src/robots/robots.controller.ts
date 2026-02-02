import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/auth.types';
import { AssignRobotDto, RegisterRobotDto, UnassignRobotDto } from './robots.dto';
import { RobotsService } from './robots.service';

@Controller('robots')
export class RobotsController {
  constructor(private readonly robotsService: RobotsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('register')
  register(@Body() body: RegisterRobotDto) {
    return this.robotsService.registerRobot(body.serialNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('assign')
  assign(@Body() body: AssignRobotDto) {
    return this.robotsService.assignRobot(body.serialNumber, body.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('unassign')
  unassign(@Body() body: UnassignRobotDto) {
    return this.robotsService.unassignRobot(body.serialNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  listAll() {
    return this.robotsService.listAllRobots();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  listMy(@CurrentUser() user: JwtUser) {
    return this.robotsService.listRobotsForUser(user.userId);
  }
}
