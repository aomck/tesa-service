import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectDetectionController } from './object-detection/object-detection.controller';
import { ObjectDetectionService } from './object-detection/object-detection.service';
import { ObjectDetectionGateway } from './object-detection/object-detection.gateway';
import { FileService } from '../common/file.service';
import { FileController } from '../common/file.controller';
import { Camera, DetectionEvent, DetectedObject } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Camera, DetectionEvent, DetectedObject])],
  controllers: [ObjectDetectionController, FileController],
  providers: [ObjectDetectionService, ObjectDetectionGateway, FileService],
})
export class GpsTrackingModule {}
