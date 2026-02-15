import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Service process is alive' })
  live() {
    return {
      status: 'ok',
      service: 'sebotics-ax-server',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (includes database connectivity)' })
  @ApiOkResponse({ description: 'Service is ready to receive traffic' })
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      dependencies: {
        database: 'up',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
