import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectDetectionService } from './object-detection.service';
import { ObjectDetectionDto } from '../dto/object-detection.dto';

@Controller('object-detection')
export class ObjectDetectionController {
  constructor(private readonly objectDetectionService: ObjectDetectionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async handleObjectDetection(
    @UploadedFile() image: Express.Multer.File,
    @Body() objectDetectionData: ObjectDetectionDto,
  ) {
    return this.objectDetectionService.processDetection(image, objectDetectionData);
  }
}
