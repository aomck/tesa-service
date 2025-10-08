import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetectionEvent } from '../../database/entities/detection-event.entity';
import { DetectedObject } from '../../database/entities/detected-object.entity';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ClearDataService {
  private readonly CLEAR_PASSWORD = '290b8d08-06f5-41b6-a878-ee65be47ddc6';
  private readonly uploadPath = join(process.cwd(), 'uploads', 'images');

  constructor(
    @InjectRepository(DetectionEvent)
    private detectionEventRepository: Repository<DetectionEvent>,
    @InjectRepository(DetectedObject)
    private detectedObjectRepository: Repository<DetectedObject>,
  ) {}

  async clearAllData(password: string): Promise<{ success: boolean; message: string }> {
    // Validate password
    if (password !== this.CLEAR_PASSWORD) {
      throw new UnauthorizedException('Invalid password');
    }

    try {
      // Use query builder to delete all records (avoids foreign key constraint issues)
      // Delete all detected objects first
      await this.detectedObjectRepository
        .createQueryBuilder()
        .delete()
        .from(DetectedObject)
        .execute();

      // Delete all detection events
      await this.detectionEventRepository
        .createQueryBuilder()
        .delete()
        .from(DetectionEvent)
        .execute();

      // Clear all images from upload directory
      await this.clearUploadDirectory();

      return {
        success: true,
        message: 'All data and images cleared successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear data: ${error.message}`,
      };
    }
  }

  async clearCameraData(cameraId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Delete all detected objects for this camera first
      await this.detectedObjectRepository
        .createQueryBuilder()
        .delete()
        .from(DetectedObject)
        .where('detection_event_id IN (SELECT id FROM detection_events WHERE cam_id = :cameraId)', { cameraId })
        .execute();

      // Delete all detection events for this camera
      await this.detectionEventRepository
        .createQueryBuilder()
        .delete()
        .from(DetectionEvent)
        .where('cam_id = :cameraId', { cameraId })
        .execute();

      // Clear camera-specific images
      await this.clearCameraDirectory(cameraId);

      return {
        success: true,
        message: `Data and images for camera ${cameraId} cleared successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear camera data: ${error.message}`,
      };
    }
  }

  private async clearUploadDirectory(): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadPath);

      // Delete all files in the directory
      for (const file of files) {
        const filePath = join(this.uploadPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          await fs.unlink(filePath);
        } else if (stat.isDirectory()) {
          // Recursively delete camera directories
          await this.clearCameraDirectory(file);
        }
      }
    } catch (error) {
      // Directory might not exist or be empty, ignore error
      console.error('Error clearing upload directory:', error);
    }
  }

  private async clearCameraDirectory(cameraId: string): Promise<void> {
    const cameraDir = join(this.uploadPath, cameraId);
    try {
      const files = await fs.readdir(cameraDir);

      // Delete all files in the camera directory
      for (const file of files) {
        const filePath = join(cameraDir, file);
        await fs.unlink(filePath);
      }

      // Remove the empty directory
      await fs.rmdir(cameraDir);
    } catch (error) {
      // Directory might not exist, ignore error
      console.error(`Error clearing camera directory ${cameraId}:`, error);
    }
  }
}
