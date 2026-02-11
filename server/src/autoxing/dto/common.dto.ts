import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AutoxingPagingDto {
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

export class AutoxingTimeRangeDto {
  @ApiPropertyOptional({ description: 'Start time (epoch ms)', example: 1695876173642 })
  @IsOptional()
  @IsInt()
  startTime?: number;

  @ApiPropertyOptional({ description: 'End time (epoch ms)', example: 1695876336874 })
  @IsOptional()
  @IsInt()
  endTime?: number;
}
