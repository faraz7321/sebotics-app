import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AutoxingRobotListRequestDto {
  @ApiPropertyOptional({ description: 'Keyword (currently supports robot ID)', example: '8981307a02163yT' })
  @IsOptional()
  @IsString()
  keyWord?: string;

  @ApiPropertyOptional({ description: 'Page size (0 means no paging)', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pageNum?: number;
}
