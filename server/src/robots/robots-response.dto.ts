import { ApiProperty } from '@nestjs/swagger';

export class RobotResponseDto {
  @ApiProperty({
    description: 'Robot unique identifier',
    format: 'uuid',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Robot serial number',
    type: String,
    example: 'RBT-12345',
  })
  serialNumber!: string;

  @ApiProperty({
    description: 'User ID this robot is assigned to',
    format: 'uuid',
    type: String,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId!: string | null;
}

export class RobotWithUserResponseDto {
  @ApiProperty({
    description: 'Robot unique identifier',
    format: 'uuid',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Robot serial number',
    type: String,
    example: 'RBT-12345',
  })
  serialNumber!: string;

  @ApiProperty({
    description: 'User this robot is assigned to',
    type: Object,
    nullable: true,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'john_doe',
      role: 'CLIENT',
    },
  })
  user!: {
    id: string;
    username: string;
    role: string;
  } | null;
}
