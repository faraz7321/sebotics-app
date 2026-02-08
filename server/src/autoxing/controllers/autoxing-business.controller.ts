import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AutoxingEmptyBodyDto } from '../dto/meta.dto';
import { AutoxingResponseDto } from '../dto/response.dto';
import { AutoxingBusinessService } from '../services/autoxing-business.service';

@ApiTags('Autoxing - Business')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('autoxing')
export class AutoxingBusinessController {
  constructor(private readonly autoxingBusinessService: AutoxingBusinessService) {}

  @Post('buildings/list')
  @ApiOperation({ summary: 'Proxy Autoxing building list endpoint' })
  @ApiBody({ type: AutoxingEmptyBodyDto, required: false })
  @ApiOkResponse({ type: AutoxingResponseDto })
  listBuildings(@Body() _body?: AutoxingEmptyBodyDto) {
    return this.autoxingBusinessService.getBuildingList();
  }

  @Post('businesses/list')
  @ApiOperation({ summary: 'Proxy Autoxing business list endpoint' })
  @ApiBody({ type: AutoxingEmptyBodyDto, required: false })
  @ApiOkResponse({ type: AutoxingResponseDto })
  listBusinesses(@Body() _body?: AutoxingEmptyBodyDto) {
    return this.autoxingBusinessService.getBusinessList();
  }
}
