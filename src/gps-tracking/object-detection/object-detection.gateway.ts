import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ObjectDetectionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ObjectDetectionGateway');
  private clientCameraSubscriptions: Map<string, string[]> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientCameraSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe_camera')
  handleCameraSubscription(client: Socket, payload: { cam_id: string }) {
    const { cam_id } = payload;
    
    if (!this.clientCameraSubscriptions.has(client.id)) {
      this.clientCameraSubscriptions.set(client.id, []);
    }
    
    const subscriptions = this.clientCameraSubscriptions.get(client.id)!;
    if (!subscriptions.includes(cam_id)) {
      subscriptions.push(cam_id);
      client.join(`camera_${cam_id}`);
      this.logger.log(`Client ${client.id} subscribed to camera ${cam_id}`);
    }
    
    return { success: true, message: `Subscribed to camera ${cam_id}` };
  }

  @SubscribeMessage('unsubscribe_camera')
  handleCameraUnsubscription(client: Socket, payload: { cam_id: string }) {
    const { cam_id } = payload;
    
    const subscriptions = this.clientCameraSubscriptions.get(client.id);
    if (subscriptions) {
      const index = subscriptions.indexOf(cam_id);
      if (index > -1) {
        subscriptions.splice(index, 1);
        client.leave(`camera_${cam_id}`);
        this.logger.log(`Client ${client.id} unsubscribed from camera ${cam_id}`);
      }
    }
    
    return { success: true, message: `Unsubscribed from camera ${cam_id}` };
  }

  async emitToCamera(cam_id: string, data: any) {
    this.server.to(`camera_${cam_id}`).emit('object_detection', data);
    this.logger.log(`Emitted object detection data to camera ${cam_id} subscribers`);
    console.log(data)
  }
}
