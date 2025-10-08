import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { FileService } from './file.service';

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':cameraId/:fileName')
  @ApiOperation({
    summary: 'Get uploaded file',
    description: 'Retrieves an uploaded file by camera ID and filename',
  })
  @ApiParam({
    name: 'cameraId',
    description: 'Camera ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'fileName',
    description: 'Name of the file to retrieve',
    example: 'e06bbab5.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'File retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async getFile(
    @Param('cameraId') cameraId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response
  ) {
    try {
      const filePath = `${cameraId}/${fileName}`;
      const fileExists = await this.fileService.fileExists(filePath);
      if (!fileExists) {
        throw new NotFoundException('File not found');
      }

      const fileBuffer = await this.fileService.getFile(filePath);

      // Set appropriate headers
      res.set({
        'Content-Type': this.getContentType(fileName),
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });

      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('File not found');
    }
  }

  private getContentType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    if (!extension) return 'application/octet-stream';

    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }
}
