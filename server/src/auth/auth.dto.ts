import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'First name',
    type: String,
    maxLength: 10,
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  firstName!: string;

  @ApiProperty({
    description: 'Last name',
    type: String,
    maxLength: 10,
    example: 'Doe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  lastName!: string;

  @ApiProperty({
    description: 'Email address',
    type: String,
    format: 'email',
    maxLength: 254,
    example: 'john@example.com',
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Username for the new account',
    type: String,
    minLength: 1,
    maxLength: 8,
    pattern: '^[A-Za-z0-9]+$',
    example: 'john123',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'username must contain only letters and numbers',
  })
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
    description: 'Username or email for login',
    type: String,
    minLength: 1,
    maxLength: 254,
    example: 'john123',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(254)
  username!: string;

  @ApiProperty({
    description: 'Password for login',
    type: String,
    minLength: 6,
    maxLength: 72,
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(6)
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
    description: 'First name',
    type: String,
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'Last name',
    type: String,
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'Email',
    type: String,
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Username',
    type: String,
    example: 'john123',
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
