import {
  IsString,
  IsNumber,
  IsArray,
  IsUUID,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DetectedObjectDto {
  @ApiProperty({
    description: 'Unique identifier for the detected object',
    example: 'obj_001',
  })
  @IsString()
  obj_id: string;

  @ApiProperty({
    description: 'Type of the detected object',
    example: 'person',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Latitude coordinate of the object',
    example: 13.7563,
  })
  @IsNumber()
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate of the object',
    example: 100.5018,
  })
  @IsNumber()
  lng: number;

  @ApiProperty({
    description: 'Objective or purpose of tracking this object',
    example: 'surveillance',
  })
  @IsString()
  objective: string;

  @ApiProperty({
    description: 'Size classification of the object',
    example: 'medium',
  })
  @IsString()
  size: string;

  [key: string]: any;
}

export class ObjectDetectionDto {
  @ApiProperty({
    description: 'Camera UUID that captured the detection',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  cam_id: string;

  @ApiProperty({
    description: 'Array of detected objects',
    type: [DetectedObjectDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetectedObjectDto)
  objects: DetectedObjectDto[];

  @ApiProperty({
    description: 'Timestamp when the detection occurred',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  timestamp: string;
}
