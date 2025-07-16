import { Module } from '@nestjs/common';
import { ObjectDetectionController } from './object-detection/object-detection.controller';
import { ObjectDetectionService } from './object-detection/object-detection.service';
import { ObjectDetectionGateway } from './object-detection/object-detection.gateway';

@Module({
  controllers: [ObjectDetectionController],
  providers: [ObjectDetectionService, ObjectDetectionGateway]
})
export class GpsTrackingModule {}
