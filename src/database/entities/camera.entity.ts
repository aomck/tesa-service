import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DetectionEvent } from './detection-event.entity';

@Entity('cameras')
export class Camera {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token: string;

  @OneToMany(() => DetectionEvent, (detectionEvent) => detectionEvent.camera)
  detectionEvents: DetectionEvent[];
}
