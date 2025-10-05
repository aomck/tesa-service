import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectDetectionDto } from '../dto/object-detection.dto';
import { ObjectDetectionGateway } from './object-detection.gateway';
import {
  Camera,
  DetectionEvent,
  DetectedObject,
} from '../../database/entities';

@Injectable()
export class ObjectDetectionService {
  constructor(
    private readonly gateway: ObjectDetectionGateway,
    @InjectRepository(Camera)
    private readonly cameraRepository: Repository<Camera>,
    @InjectRepository(DetectionEvent)
    private readonly detectionEventRepository: Repository<DetectionEvent>,
    @InjectRepository(DetectedObject)
    private readonly detectedObjectRepository: Repository<DetectedObject>,
  ) {}

  async processDetection(imageInfo: any, data: ObjectDetectionDto) {
    const objectsArray = typeof data.objects === 'string' ? JSON.parse(data.objects) : data.objects;
    
    const detectionResult = {
      cam_id: data.cam_id,
      objects: objectsArray,
      timestamp: data.timestamp,
      image: {
        filename: imageInfo.filename,
        originalname: imageInfo.originalname,
        mimetype: imageInfo.mimetype,
        size: imageInfo.size,
        path: imageInfo.path,
      },
    };

    // Save to database
    await this.saveDetectionToDatabase(data, imageInfo.path, objectsArray);

    await this.gateway.emitToCamera(data.cam_id, detectionResult);

    return {
      success: true,
      message: 'Object detection data processed and broadcasted',
      data: detectionResult,
    };
  }

  private async saveDetectionToDatabase(
    data: ObjectDetectionDto,
    imagePath: string,
    objectsArray: any[],
  ) {
    // Ensure camera exists
    let camera = await this.cameraRepository.findOne({
      where: { id: data.cam_id },
    });
    if (!camera) {
      camera = this.cameraRepository.create({ id: data.cam_id });
      await this.cameraRepository.save(camera);
    }

    console.log("....",data)

    // Create detection event
    const detectionEvent = this.detectionEventRepository.create({
      camId: data.cam_id,
      timestamp: new Date(data.timestamp),
      imgPath: imagePath,
    });

    const savedDetectionEvent =
      await this.detectionEventRepository.save(detectionEvent);

    // Create detected objects
    const detectedObjects = objectsArray.map((obj: any) => {
      const { obj_id, type, lat, lng, objective, size, ...details } = obj;
      return this.detectedObjectRepository.create({
        detectionEventId: savedDetectionEvent.id,
        objId: obj_id,
        type,
        lat,
        lng,
        objective,
        size,
        details: Object.keys(details).length > 0 ? details : undefined,
      });
    });

    await this.detectedObjectRepository.save(detectedObjects);
  }
}
