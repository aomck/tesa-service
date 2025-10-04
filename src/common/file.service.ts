import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = join(this.uploadPath, fileName);

    await fs.writeFile(filePath, file.buffer);
    return fileName;
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
}
