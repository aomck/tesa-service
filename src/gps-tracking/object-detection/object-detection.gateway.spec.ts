import { Test, TestingModule } from '@nestjs/testing';
import { ObjectDetectionGateway } from './object-detection.gateway';

describe('ObjectDetectionGateway', () => {
  let gateway: ObjectDetectionGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjectDetectionGateway],
    }).compile();

    gateway = module.get<ObjectDetectionGateway>(ObjectDetectionGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
