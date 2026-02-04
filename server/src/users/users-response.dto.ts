import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    format: 'uuid',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Username',
    type: String,
    example: 'john_doe',
  })
  username!: string;

  @ApiProperty({
    description: 'User role',
    type: String,
    enum: ['ADMIN', 'CLIENT'],
    example: 'CLIENT',
  })
  role!: string;
}
