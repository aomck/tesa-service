import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DetectionEvent } from './detection-event.entity';

@Entity('detected_objects')
@Index(['detectionEventId'])
export class DetectedObject {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'detection_event_id', type: 'bigint' })
  detectionEventId: number;

  @Column({ name: 'obj_id', type: 'varchar', length: 100 })
  objId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lng: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  objective: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @ManyToOne(
    () => DetectionEvent,
    (detectionEvent) => detectionEvent.detectedObjects,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'detection_event_id' })
  detectionEvent: DetectionEvent;
}
