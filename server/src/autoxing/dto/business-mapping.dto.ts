import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AssignBusinessUserMappingDto {
  @ApiProperty({
    description: 'User ID to assign this business to',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Business ID returned by Autoxing',
    type: String,
    example: 'elevator-business-001',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  businessId!: string;
}

export class UnassignBusinessUserMappingDto extends AssignBusinessUserMappingDto {}
