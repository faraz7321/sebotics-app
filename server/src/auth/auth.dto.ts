import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for the new account',
    type: String,
    minLength: 3,
    maxLength: 50,
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @ApiProperty({
    description: 'Password for the new account',
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Username for login',
    type: String,
    minLength: 3,
    maxLength: 50,
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @ApiProperty({
    description: 'Password for login',
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class UserResponseDto {
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

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJ1c2VybmFtZSI6ImpvaG5fZG9lIiwicm9sZSI6IkNMSUVOVCIsImlhdCI6MTYxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'User information',
    type: () => UserResponseDto,
  })
  user!: UserResponseDto;
}
