import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AutoxingEmptyBodyDto } from '../dto/meta.dto';
import { AutoxingResponseDto } from '../dto/response.dto';
import {
  AssignBusinessUserMappingDto,
  UnassignBusinessUserMappingDto,
} from '../dto/business-mapping.dto';
import { AutoxingBusinessService } from '../services/autoxing-business.service';

@ApiTags('Autoxing - Business')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('autoxing')
export class AutoxingBusinessController {
  constructor(
    @Inject(AutoxingBusinessService)
    private readonly autoxingBusinessService: AutoxingBusinessService,
  ) {}

  @Post('buildings/list')
  @ApiOperation({ summary: 'Get LIVE Autoxing building list filtered by current user business assignments' })
  @ApiBody({ type: AutoxingEmptyBodyDto, required: false })
  @ApiOkResponse({ type: AutoxingResponseDto })
  listBuildings(
    @CurrentUser() user: JwtUser,
    @Body() _body?: AutoxingEmptyBodyDto,
  ) {
    return this.autoxingBusinessService.getBuildingList(user);
  }

  @Post('businesses/list')
  @ApiOperation({ summary: 'Get LIVE Autoxing business list filtered by current user business assignments' })
  @ApiBody({ type: AutoxingEmptyBodyDto, required: false })
  @ApiOkResponse({ type: AutoxingResponseDto })
  listBusinesses(
    @CurrentUser() user: JwtUser,
    @Body() _body?: AutoxingEmptyBodyDto,
  ) {
    return this.autoxingBusinessService.getBusinessList(user);
  }

  @Post('businesses/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a business to a user (admin only)' })
  @ApiBody({ type: AssignBusinessUserMappingDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  assignBusinessToUser(@Body() body: AssignBusinessUserMappingDto) {
    return this.autoxingBusinessService.assignBusinessToUser(
      body.userId,
      body.businessId,
    );
  }

  @Post('businesses/unassign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove a business assignment from a user (admin only)' })
  @ApiBody({ type: UnassignBusinessUserMappingDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  unassignBusinessFromUser(@Body() body: UnassignBusinessUserMappingDto) {
    return this.autoxingBusinessService.unassignBusinessFromUser(
      body.userId,
      body.businessId,
    );
  }
}
