import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class FileService {
  private readonly uploadPath = join(process.cwd(), 'uploads', 'images');

  constructor() {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  private getShortUuid(): string {
    return uuidv4().split('-')[0]; // Get first segment of UUID (8 characters)
  }

  async saveFile(file: Express.Multer.File, cameraId: string): Promise<string> {
    const shortUuid = this.getShortUuid();
    const fileName = `${shortUuid}.jpg`; // Always save as jpg after resize

    // Create camera-specific directory
    const cameraDir = join(this.uploadPath, cameraId);
    await this.ensureCameraDirectory(cameraDir);

    const filePath = join(cameraDir, fileName);

    // Resize image to max width 800px, height auto
    const resizedImageBuffer = await sharp(file.buffer)
      .resize(800, null, {
        width: 800,
        withoutEnlargement: true, // Don't enlarge if image is smaller
        fit: 'inside',
      })
      .jpeg({ quality: 85 }) // Convert to JPEG with 85% quality
      .toBuffer();

    await fs.writeFile(filePath, resizedImageBuffer);
    return `${cameraId}/${fileName}`;
  }

  private async ensureCameraDirectory(cameraDir: string): Promise<void> {
    try {
      await fs.access(cameraDir);
    } catch {
      await fs.mkdir(cameraDir, { recursive: true });
    }
  }

  async getFilePath(fileName: string): Promise<string> {
    return join(this.uploadPath, fileName);
  }

  async getFile(fileName: string): Promise<Buffer> {
    const filePath = await this.getFilePath(fileName);
    return fs.readFile(filePath);
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = await this.getFilePath(fileName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    const filePath = await this.getFilePath(fileName);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getFileExtension(originalName: string): string {
    const lastDotIndex = originalName.lastIndexOf('.');
    return lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';
  }

  getPublicUrl(fileName: string): string {
    return `/api/files/${fileName}`;
  }

  async deleteCameraFiles(cameraId: string): Promise<void> {
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
      console.error(`Error deleting camera files for ${cameraId}:`, error);
    }
  }
}
