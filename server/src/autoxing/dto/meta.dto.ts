import { ApiPropertyOptional } from '@nestjs/swagger';

export class AutoxingEmptyBodyDto {
  @ApiPropertyOptional({
    description: 'Optional empty payload for endpoints that accept no body',
    example: {},
    type: Object,
  })
  _?: never;
}
