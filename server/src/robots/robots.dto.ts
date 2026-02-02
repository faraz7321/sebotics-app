import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RegisterRobotDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serialNumber!: string;
}

export class AssignRobotDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serialNumber!: string;

  @IsUUID()
  userId!: string;
}

export class UnassignRobotDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serialNumber!: string;
}
