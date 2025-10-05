import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camera } from '../../database/entities/camera.entity';

@Injectable()
export class CameraAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Camera)
    private cameraRepository: Repository<Camera>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const camId = request.params.cam_id;
    const token = request.headers['x-camera-token'];

    if (!camId || !token) {
      throw new UnauthorizedException('Camera ID and token are required');
    }

    const camera = await this.cameraRepository.findOne({
      where: { id: camId },
    });

    if (!camera) {
      throw new UnauthorizedException('Camera not found');
    }

    if (camera.token !== token) {
      throw new UnauthorizedException('Invalid camera token');
    }

    return true;
  }
}
