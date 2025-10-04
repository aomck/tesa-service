import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GpsTrackingModule } from './gps-tracking/gps-tracking.module';
import { Camera, DetectionEvent, DetectedObject } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'tesa_db',
      entities: [Camera, DetectionEvent, DetectedObject],
      synchronize: process.env.NODE_ENV === 'development',
    }),
    GpsTrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
