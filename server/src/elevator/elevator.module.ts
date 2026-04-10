import { Module } from '@nestjs/common';
import { ElevatorController } from './elevator.controller';
import { ElevatorService } from './elevator.service';
import { ElevatorWsGateway } from './ws/elevator-ws.gateway';

@Module({
  controllers: [ElevatorController],
  providers: [ElevatorService, ElevatorWsGateway],
})
export class ElevatorModule {}
