import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { TakeElevatorDto } from './dto/elevator.dto';
import { ElevatorService } from './elevator.service';
import { AppCodeGuard } from './guards/app-code.guard';
import { ElevatorWsGateway } from './ws/elevator-ws.gateway';

@ApiTags('Elevator (Robot Protocol)')
@ApiSecurity('APPCODE-auth')
@Controller('ed')
@SkipThrottle()
@UseGuards(AppCodeGuard)
export class ElevatorController {
  private readonly wsBaseUrl: string;

  constructor(
    @Inject(ElevatorService)
    private readonly elevatorService: ElevatorService,
    @Inject(ElevatorWsGateway)
    private readonly elevatorWsGateway: ElevatorWsGateway,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    const serverUrl =
      this.configService.get<string>('ELEVATOR_WS_BASE_URL') ?? '';
    this.wsBaseUrl = serverUrl.replace(/\/$/, '');
  }

  @Post('take-elevator')
  @ApiOperation({ summary: 'Request an elevator for a robot (AutoXing protocol)' })
  @ApiBody({ type: TakeElevatorDto })
  @ApiOkResponse({ description: 'Elevator transaction created with WebSocket URL' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing APPCODE' })
  takeElevator(@Body() body: TakeElevatorDto) {
    const transaction = this.elevatorService.createTransaction(
      body.deviceId,
      body.buildingId,
      body.startFloorName,
      body.endFloorName,
    );

    // Broadcast to operators
    this.elevatorWsGateway.broadcastNewRequest(transaction);

    const protocol = this.wsBaseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = this.wsBaseUrl.replace(/^https?:\/\//, '');
    const transactionUrl = `${protocol}://${wsHost}/ws/elevator/transaction/${transaction.id}`;

    return {
      status: 200,
      message: 'ok',
      data: {
        elevatorId: transaction.elevatorId,
        transactionId: transaction.id,
        transactionUrl,
      },
    };
  }

  @Delete('transaction/:transactionId')
  @ApiOperation({ summary: 'Cancel an active elevator transaction' })
  @ApiParam({ name: 'transactionId', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Transaction cancelled' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing APPCODE' })
  cancelTransaction(@Param('transactionId') transactionId: string) {
    const transaction = this.elevatorService.cancelTransaction(transactionId);

    // Notify robot + operators
    this.elevatorWsGateway.broadcastCancellation(transactionId);

    return {
      status: 200,
      message: 'ok',
      data: { transactionId: transaction.id, state: transaction.state },
    };
  }
}
