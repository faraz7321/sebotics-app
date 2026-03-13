import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Config')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('mapbox-token')
  @ApiOperation({ summary: 'Get Mapbox public token' })
  @ApiOkResponse({ description: 'Mapbox token', schema: { properties: { token: { type: 'string' } } } })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMapboxToken(): { token: string } {
    return { token: this.configService.get<string>('MAPBOX_TOKEN') ?? '' };
  }
}
