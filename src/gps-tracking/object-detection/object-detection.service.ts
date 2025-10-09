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

    // Save to database
    const savedData = await this.saveDetectionToDatabase(data, imageInfo.path, objectsArray);

    const detectionResult = {
      cam_id: data.cam_id,
      camera: savedData.camera,
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

    await this.gateway.emitToCamera(data.cam_id, detectionResult);

    return {
      success: true,
      message: 'Object detection data processed and broadcasted',
      data: detectionResult,
    };
  }

  async getCameraInfo(camId: string) {
    const camera = await this.cameraRepository.findOne({
      where: { id: camId },
    });

    if (!camera) {
      return {
        success: false,
        message: 'Camera not found',
      };
    }

    return {
      success: true,
      data: camera,
    };
  }

  async getRecentDetections(camId: string) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const detectionEvents = await this.detectionEventRepository.find({
      where: {
        camId: camId,
      },
      relations: ['detectedObjects', 'camera'],
      order: {
        timestamp: 'DESC',
      },
    });

    // Filter events from last 24 hours
    const recentEvents = detectionEvents.filter(
      (event) => new Date(event.timestamp) >= oneDayAgo,
    );

    return {
      success: true,
      data: recentEvents.map((event) => ({
        id: event.id,
        cam_id: event.camId,
        camera: event.camera,
        timestamp: event.timestamp,
        image_path: event.imgPath,
        objects: event.detectedObjects.map((obj) => ({
          obj_id: obj.objId,
          type: obj.type,
          lat: obj.lat,
          lng: obj.lng,
          objective: obj.objective,
          size: obj.size,
          details: obj.details,
        })),
      })),
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

    // console.log("....",data)

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

    return {
      camera,
      detectionEvent: savedDetectionEvent,
      detectedObjects,
    };
  }
}
