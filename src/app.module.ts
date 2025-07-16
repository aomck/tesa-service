import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GpsTrackingModule } from './gps-tracking/gps-tracking.module';

@Module({
  imports: [GpsTrackingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
