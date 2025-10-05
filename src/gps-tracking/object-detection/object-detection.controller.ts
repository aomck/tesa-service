import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { ObjectDetectionService } from './object-detection.service';
import { ObjectDetectionDto } from '../dto/object-detection.dto';
import { FileService } from '../../common/file.service';
import { CameraAuthGuard } from '../../common/guards/camera-auth.guard';

@ApiTags('object-detection')
@Controller('object-detection')
export class ObjectDetectionController {
  constructor(
    private readonly objectDetectionService: ObjectDetectionService,
    private readonly fileService: FileService,
  ) {}

  @Post('/:cam_id')
  @UseGuards(CameraAuthGuard)
  @ApiOperation({
    summary: 'Process object detection data',
    description:
      'Receives image and object detection data, then broadcasts to subscribed clients via WebSocket',
  })
  @ApiParam({
    name: 'cam_id',
    type: 'string',
    format: 'uuid',
    description: 'Camera UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiHeader({
    name: 'x-camera-token',
    description: 'Camera authentication token',
    required: true,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file containing the detected objects',
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
              size: { type: 'string', example: 'medium' },
            },
          },
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp when the detection occurred',
          example: '2024-01-15T10:30:00.000Z',
        },
      },
      required: ['image', 'objects', 'timestamp'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Object detection data processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Object detection data processed and broadcasted',
        },
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
                size: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid camera ID or token',
  })
  @UseInterceptors(FileInterceptor('image'))
  async handleObjectDetection(
    @Param('cam_id') camId: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() objectDetectionData: ObjectDetectionDto,
  ) {
    // Save file to disk and get filename
    const savedFileName = await this.fileService.saveFile(image);

    // Create image info with file path instead of buffer
    const imageInfo = {
      filename: savedFileName,
      originalname: image.originalname,
      mimetype: image.mimetype,
      size: image.size,
      path: this.fileService.getPublicUrl(savedFileName),
    };

    // Use camId from route parameter
    const detectionDataWithCamId = {
      ...objectDetectionData,
      cam_id: camId,
    };

    return this.objectDetectionService.processDetection(
      imageInfo,
      detectionDataWithCamId,
    );
  }
}
