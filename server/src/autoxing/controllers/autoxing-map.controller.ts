import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import {
  AutoxingAreaListRequestDto,
  AutoxingPoiCreateRequestDto,
  AutoxingPoiListRequestDto,
} from '../dto/map.dto';
import { AutoxingBaseMapResponseDto, AutoxingResponseDto } from '../dto/response.dto';
import { AutoxingMapService } from '../services/autoxing-map.service';

@ApiTags('Autoxing - Map')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('autoxing/maps')
export class AutoxingMapController {
  constructor(
    @Inject(AutoxingMapService)
    private readonly autoxingMapService: AutoxingMapService,
  ) {}

  @Post('pois/list')
  @ApiOperation({ summary: 'Proxy Autoxing POI list endpoint' })
  @ApiBody({ type: AutoxingPoiListRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  listPois(@CurrentUser() user: JwtUser, @Body() body: AutoxingPoiListRequestDto) {
    return this.autoxingMapService.getPoiList(user, body);
  }

  @Put('pois/:areaId')
  @ApiOperation({ summary: 'Proxy Autoxing create POI endpoint' })
  @ApiParam({ name: 'areaId', type: String })
  @ApiBody({ type: AutoxingPoiCreateRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  createPoi(@Param('areaId') areaId: string, @Body() body: AutoxingPoiCreateRequestDto) {
    return this.autoxingMapService.createPoi(areaId, body);
  }

  @Delete('pois/:poiId')
  @ApiOperation({ summary: 'Proxy Autoxing delete POI endpoint' })
  @ApiParam({ name: 'poiId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  deletePoi(@CurrentUser() user: JwtUser, @Param('poiId') poiId: string) {
    return this.autoxingMapService.deletePoi(user, poiId);
  }

  @Get('pois/:poiId')
  @ApiOperation({ summary: 'Proxy Autoxing POI detail endpoint' })
  @ApiParam({ name: 'poiId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getPoi(@CurrentUser() user: JwtUser, @Param('poiId') poiId: string) {
    return this.autoxingMapService.getPoiDetail(user, poiId);
  }

  @Post('areas/list')
  @ApiOperation({ summary: 'Proxy Autoxing area list endpoint' })
  @ApiBody({ type: AutoxingAreaListRequestDto })
  @ApiOkResponse({ type: AutoxingResponseDto })
  listAreas(@CurrentUser() user: JwtUser, @Body() body: AutoxingAreaListRequestDto) {
    return this.autoxingMapService.getAreaList(user, body);
  }

  @Get('areas/:areaId/base-map')
  @ApiOperation({ summary: 'Proxy Autoxing area base-map endpoint (base64 encoded)' })
  @ApiParam({ name: 'areaId', type: String })
  @ApiOkResponse({ type: AutoxingBaseMapResponseDto })
  async getAreaBaseMap(@Param('areaId') areaId: string) {
    const { buffer } = await this.autoxingMapService.getAreaBaseMap(areaId);
    const mapMeta = await this.autoxingMapService.getMapMeta(areaId);
    return {
      mapMeta: mapMeta.data,
      base64: buffer.toString('base64'),
    };
  }

  @Get('robots/:robotId/deploy')
  @ApiOperation({ summary: 'Proxy Autoxing robot deployment endpoint' })
  @ApiParam({ name: 'robotId', type: String })
  @ApiOkResponse({ type: AutoxingResponseDto })
  getRobotDeploy(@CurrentUser() user: JwtUser, @Param('robotId') robotId: string) {
    return this.autoxingMapService.getRobotDeployInfo(user, robotId);
  }
}
