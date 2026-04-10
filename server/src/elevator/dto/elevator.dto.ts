import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TakeElevatorDto {
  @ApiProperty({ description: 'Robot device ID', example: 'robot-001' })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({ description: 'Building ID the robot is in', example: 'building-001' })
  @IsString()
  @IsNotEmpty()
  buildingId!: string;

  @ApiProperty({ description: 'Starting floor name', example: '18' })
  @IsString()
  @IsNotEmpty()
  startFloorName!: string;

  @ApiProperty({ description: 'Destination floor name', example: '19' })
  @IsString()
  @IsNotEmpty()
  endFloorName!: string;
}
