import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRobotDto {
  @ApiProperty({
    description: 'Robot serial number',
    type: String,
    example: 'RBT-12345',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serialNumber!: string;
}

export class AssignRobotDto {
  @ApiProperty({
    description: 'Robot serial number',
    type: String,
    example: 'RBT-12345',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serialNumber!: string;

  @ApiProperty({
    description: 'User ID to assign the robot to',
    format: 'uuid',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId!: string;
}

export class UnassignRobotDto {
  @ApiProperty({
    description: 'Robot serial number',
    type: String,
    example: 'RBT-12345',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serialNumber!: string;
}
