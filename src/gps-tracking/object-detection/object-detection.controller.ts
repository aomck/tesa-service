import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  UseGuards,
  Delete,
  Patch,
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
import { ClearDataService } from './clear-data.service';
import { TokenService } from './token.service';

@ApiTags('object-detection')
@Controller('object-detection')
export class ObjectDetectionController {
  constructor(
    private readonly objectDetectionService: ObjectDetectionService,
    private readonly fileService: FileService,
    private readonly clearDataService: ClearDataService,
    private readonly tokenService: TokenService,
  ) {}

  @Get('/info/:cam_id')
  @UseGuards(CameraAuthGuard)
  @ApiOperation({
    summary: 'Get camera information',
    description: 'Retrieve camera information by camera ID',
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
  @ApiResponse({
    status: 200,
    description: 'Camera information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            location: { type: 'string' },
            token: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid camera ID or token',
  })
  @ApiResponse({
    status: 404,
    description: 'Camera not found',
  })
  async getCameraInfo(@Param('cam_id') camId: string) {
    return this.objectDetectionService.getCameraInfo(camId);
  }

  @Get('/:cam_id')
  @UseGuards(CameraAuthGuard)
  @ApiOperation({
    summary: 'Get recent detection events',
    description:
      'Retrieve detection events from the last 24 hours for a specific camera',
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
  @ApiResponse({
    status: 200,
    description: 'Detection events retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              cam_id: { type: 'string', format: 'uuid' },
              timestamp: { type: 'string', format: 'date-time' },
              image_path: { type: 'string' },
              objects: { type: 'array' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid camera ID or token',
  })
  async getRecentDetections(@Param('cam_id') camId: string) {
    return this.objectDetectionService.getRecentDetections(camId);
  }

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
    // Save file to disk and get filename (organized by camera_id)
    const savedFileName = await this.fileService.saveFile(image, camId);

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

  @Delete('/clear-all')
  @ApiOperation({
    summary: 'Clear all detection data',
    description: 'Deletes all detection events, detected objects, and uploaded images. Requires password.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          description: 'Password required to clear all data',
          example: '290b8d08-06f5-41b6-a878-ee65be47ddc6',
        },
      },
      required: ['password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Data cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'All data and images cleared successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid password',
  })
  async clearAllData(@Body('password') password: string) {
    return this.clearDataService.clearAllData(password);
  }

  @Delete('/clear/:cam_id')
  @UseGuards(CameraAuthGuard)
  @ApiOperation({
    summary: 'Clear detection data for specific camera',
    description: 'Deletes detection events, detected objects, and uploaded images for a specific camera. Requires camera authentication.',
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
  @ApiResponse({
    status: 200,
    description: 'Camera data cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Data and images for camera cleared successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid camera ID or token',
  })
  async clearCameraData(@Param('cam_id') camId: string) {
    return this.clearDataService.clearCameraData(camId);
  }

  @Patch('/token/:cam_id')
  @ApiOperation({
    summary: 'Regenerate camera token',
    description: 'Generates a new authentication token for the camera. Requires the current valid token.',
  })
  @ApiParam({
    name: 'cam_id',
    type: 'string',
    format: 'uuid',
    description: 'Camera UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Current camera token',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      required: ['token'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token regenerated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        token: { type: 'string', example: '660e9511-f30c-52e5-b827-557766551111' },
        message: { type: 'string', example: 'Token regenerated successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid camera ID or token',
  })
  async regenerateToken(
    @Param('cam_id') camId: string,
    @Body('token') token: string,
  ) {
    return this.tokenService.regenerateToken(camId, token);
  }
}
