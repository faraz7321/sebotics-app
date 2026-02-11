import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AutoxingPagingDto } from './common.dto';

export class AutoxingTaskCreateV3Dto {
  @ApiProperty({ description: 'Task name', example: 'Delivery Task' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Robot ID for ordinary tasks' })
  @IsOptional()
  @IsString()
  robotId?: string;

  @ApiPropertyOptional({ description: 'Business ID for queue tasks' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Dispatch type (0 ordinary, 2 queue)', example: 0 })
  @IsOptional()
  @IsInt()
  dispatchType?: number;

  @ApiPropertyOptional({ description: 'Route mode', example: 1 })
  @IsOptional()
  @IsInt()
  routeMode?: number;

  @ApiPropertyOptional({ description: 'Run mode', example: 1 })
  @IsOptional()
  @IsInt()
  runMode?: number;

  @ApiPropertyOptional({ description: 'Run count', example: 1 })
  @IsOptional()
  @IsInt()
  runNum?: number;

  @ApiProperty({ description: 'Task type', example: 4 })
  @IsInt()
  taskType!: number;

  @ApiProperty({ description: 'Run type', example: 20 })
  @IsInt()
  runType!: number;

  @ApiPropertyOptional({ description: 'Task source type', example: 6 })
  @IsOptional()
  @IsInt()
  sourceType?: number;

  @ApiPropertyOptional({ description: 'Ignore public sites', example: false })
  @IsOptional()
  @IsBoolean()
  ignorePublicSite?: boolean;

  @ApiPropertyOptional({ description: 'Speed (m/s)', example: 0.6 })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({ description: 'Detour radius (meters)', example: 1 })
  @IsOptional()
  @IsNumber()
  detourRadius?: number;

  @ApiPropertyOptional({ description: 'Current point object', type: Object })
  @IsOptional()
  @IsObject()
  curPt?: Record<string, unknown>;

  @ApiProperty({ description: 'Task points', type: [Object] })
  @IsArray()
  @IsObject({ each: true })
  taskPts!: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Return point', type: Object })
  @IsOptional()
  @IsObject()
  backPt?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Return destination mode', example: 2 })
  @IsOptional()
  @IsInt()
  returnDest?: number;

  @ApiPropertyOptional({ description: 'Return idle time (seconds)', example: 60 })
  @IsOptional()
  @IsInt()
  returnTime?: number;
}

export class AutoxingTaskCreateV1Dto {
  @ApiProperty({ description: 'Task name', example: 'Delivery Task' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Robot ID' })
  @IsString()
  robotId!: string;

  @ApiPropertyOptional({ description: 'Route mode', example: 1 })
  @IsOptional()
  @IsInt()
  routeMode?: number;

  @ApiPropertyOptional({ description: 'Run mode', example: 1 })
  @IsOptional()
  @IsInt()
  runMode?: number;

  @ApiPropertyOptional({ description: 'Run count', example: 1 })
  @IsOptional()
  @IsInt()
  runNum?: number;

  @ApiProperty({ description: 'Task type', example: 4 })
  @IsInt()
  taskType!: number;

  @ApiProperty({ description: 'Run type', example: 20 })
  @IsInt()
  runType!: number;

  @ApiPropertyOptional({ description: 'Task source type', example: 6 })
  @IsOptional()
  @IsInt()
  sourceType?: number;

  @ApiPropertyOptional({ description: 'Ignore public sites', example: false })
  @IsOptional()
  @IsBoolean()
  ignorePublicSite?: boolean;

  @ApiPropertyOptional({ description: 'Speed (m/s)', example: 0.6 })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({ description: 'Detour radius (meters)', example: 1 })
  @IsOptional()
  @IsNumber()
  detourRadius?: number;

  @ApiPropertyOptional({ description: 'Current point object', type: Object })
  @IsOptional()
  @IsObject()
  curPt?: Record<string, unknown>;

  @ApiProperty({ description: 'Task points', type: [Object] })
  @IsArray()
  @IsObject({ each: true })
  taskPts!: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Return point', type: Object })
  @IsOptional()
  @IsObject()
  backPt?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Return destination mode', example: 2 })
  @IsOptional()
  @IsInt()
  returnDest?: number;

  @ApiPropertyOptional({ description: 'Return idle time (seconds)', example: 60 })
  @IsOptional()
  @IsInt()
  returnTime?: number;
}

export class AutoxingTaskListRequestDto extends AutoxingPagingDto {
  @ApiPropertyOptional({ description: 'Start time (epoch ms)', example: 1695876173642 })
  @IsOptional()
  @IsInt()
  startTime?: number;

  @ApiPropertyOptional({ description: 'End time (epoch ms)', example: 1695876336874 })
  @IsOptional()
  @IsInt()
  endTime?: number;
}

export class AutoxingTaskUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Task points update', type: [Object] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  taskPts?: Record<string, unknown>[];
}

export class AutoxingTaskDetailQueryDto {
  @ApiPropertyOptional({ description: 'Whether to return detailed info', example: false })
  @IsOptional()
  @IsBoolean()
  needDetail?: boolean;
}
