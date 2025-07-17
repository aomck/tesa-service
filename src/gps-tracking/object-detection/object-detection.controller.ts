import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ObjectDetectionService } from './object-detection.service';
import { ObjectDetectionDto } from '../dto/object-detection.dto';

@ApiTags('object-detection')
@Controller('object-detection')
export class ObjectDetectionController {
  constructor(private readonly objectDetectionService: ObjectDetectionService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Process object detection data',
    description: 'Receives image and object detection data, then broadcasts to subscribed clients via WebSocket'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file containing the detected objects'
        },
        cam_id: {
          type: 'string',
          format: 'uuid',
          description: 'Camera UUID that captured the detection',
          example: '550e8400-e29b-41d4-a716-446655440000'
        },
        objects: {
          type: 'array',
          description: 'Array of detected objects',
          items: {
            type: 'object',
            properties: {
              obj_id: { type: 'string', example: 'obj_001' },
              type: { type: 'string', example: 'person' },
              lat: { type: 'number', example: 13.7563 },
              lng: { type: 'number', example: 100.5018 },
              objective: { type: 'string', example: 'surveillance' },
              size: { type: 'string', example: 'medium' }
            }
          }
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp when the detection occurred',
          example: '2024-01-15T10:30:00.000Z'
        }
      },
      required: ['image', 'cam_id', 'objects', 'timestamp']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Object detection data processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Object detection data processed and broadcasted' },
        data: {
          type: 'object',
          properties: {
            cam_id: { type: 'string', format: 'uuid' },
            objects: { type: 'array' },
            timestamp: { type: 'string', format: 'date-time' },
            image: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                originalname: { type: 'string' },
                mimetype: { type: 'string' },
                size: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data'
  })
  @UseInterceptors(FileInterceptor('image'))
  async handleObjectDetection(
    @UploadedFile() image: Express.Multer.File,
    @Body() objectDetectionData: ObjectDetectionDto,
  ) {
    return this.objectDetectionService.processDetection(image, objectDetectionData);
  }
}
