import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camera } from '../../database/entities/camera.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Camera)
    private cameraRepository: Repository<Camera>,
  ) {}

  async regenerateToken(
    cameraId: string,
    oldToken: string,
  ): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      // Find camera by ID
      const camera = await this.cameraRepository.findOne({
        where: { id: cameraId },
      });

      if (!camera) {
        throw new UnauthorizedException('Camera not found');
      }

      // Verify old token matches
      if (camera.token !== oldToken) {
        throw new UnauthorizedException('Invalid token');
      }

      // Generate new token
      const newToken = uuidv4();

      // Update camera with new token
      camera.token = newToken;
      await this.cameraRepository.save(camera);

      return {
        success: true,
        token: newToken,
        message: 'Token regenerated successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return {
        success: false,
        message: `Failed to regenerate token: ${error.message}`,
      };
    }
  }
}
