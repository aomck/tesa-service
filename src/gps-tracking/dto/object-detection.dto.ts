import { IsString, IsNumber, IsArray, IsUUID, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class DetectedObjectDto {
  @IsString()
  obj_id: string;

  @IsString()
  type: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  objective: string;

  @IsString()
  size: string;

  [key: string]: any;
}

export class ObjectDetectionDto {
  @IsUUID()
  cam_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetectedObjectDto)
  objects: DetectedObjectDto[];

  @IsDateString()
  timestamp: string;
}