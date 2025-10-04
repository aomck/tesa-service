import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Camera } from './camera.entity';
import { DetectedObject } from './detected-object.entity';

@Entity('detection_events')
export class DetectionEvent {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'cam_id', type: 'uuid' })
  camId: string;

  @Column({ type: 'timestamp with time zone' })
  timestamp: Date;

  @Column({ name: 'img_path', type: 'varchar', length: 512 })
  imgPath: string;

  @ManyToOne(() => Camera, (camera) => camera.detectionEvents, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cam_id' })
  camera: Camera;

  @OneToMany(
    () => DetectedObject,
    (detectedObject) => detectedObject.detectionEvent,
    { cascade: true },
  )
  detectedObjects: DetectedObject[];
}
