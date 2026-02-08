import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AutoxingResponseDto {
  @ApiProperty({ description: 'Autoxing response status code', example: 200 })
  status!: number;

  @ApiProperty({ description: 'Autoxing response message', example: 'ok' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Autoxing response payload',
    type: Object,
    additionalProperties: true,
  })
  data?: unknown;
}

export class AutoxingBaseMapResponseDto {
  @ApiProperty({ description: 'PNG payload encoded as base64 string' })
  base64!: string;
}
