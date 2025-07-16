import { Injectable } from '@nestjs/common';
import { ObjectDetectionDto } from '../dto/object-detection.dto';
import { ObjectDetectionGateway } from './object-detection.gateway';

@Injectable()
export class ObjectDetectionService {
  constructor(private readonly gateway: ObjectDetectionGateway) {}

  async processDetection(image: Express.Multer.File, data: ObjectDetectionDto) {
    const detectionResult = {
      cam_id: data.cam_id,
      objects: data.objects,
      timestamp: data.timestamp,
      image: {
        filename: image.filename,
        originalname: image.originalname,
        mimetype: image.mimetype,
        size: image.size,
        buffer: image.buffer,
      },
    };

    await this.gateway.emitToCamera(data.cam_id, detectionResult);

    return {
      success: true,
      message: 'Object detection data processed and broadcasted',
      data: detectionResult,
    };
  }
}
