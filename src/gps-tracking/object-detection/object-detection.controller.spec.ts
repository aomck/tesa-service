import { Test, TestingModule } from '@nestjs/testing';
import { ObjectDetectionController } from './object-detection.controller';

describe('ObjectDetectionController', () => {
  let controller: ObjectDetectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObjectDetectionController],
    }).compile();

    controller = module.get<ObjectDetectionController>(ObjectDetectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
