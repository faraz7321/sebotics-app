import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AutoxingPagingDto } from './common.dto';

export class AutoxingPoiListRequestDto extends AutoxingPagingDto {
  @ApiPropertyOptional({ description: 'Business ID', example: '60d998a1fccc72d6fd363627' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Robot ID', example: '8981307a02163yT' })
  @IsOptional()
  @IsString()
  robotId?: string;

  @ApiPropertyOptional({ description: 'Area ID', example: '60d9b0a1fccc72d6fd3637dc' })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional({ description: 'POI type', example: 9 })
  @IsOptional()
  @IsInt()
  type?: number;
}

export class AutoxingPoiCreateRequestDto {
  @ApiPropertyOptional({ description: 'POI name', example: 'Table 12' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'POI coordinates [x, y]',
    example: [13.411045089526397, -6.95027412476179],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinate!: number[];

  @ApiPropertyOptional({ description: 'Yaw in degrees', example: 89 })
  @IsOptional()
  @IsInt()
  yaw?: number;
}

export class AutoxingAreaListRequestDto extends AutoxingPagingDto {
  @ApiPropertyOptional({ description: 'Business ID', example: '60d998a1fccc72d6fd363627' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Robot ID', example: '8981307a02163yT' })
  @IsOptional()
  @IsString()
  robotId?: string;
}
