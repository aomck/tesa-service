# TESA GPS Tracking Service API Documentation

## Overview

TESA GPS Tracking Service provides real-time object detection and GPS tracking capabilities with WebSocket communication for live updates.

## Base URL

```
http://localhost:3000/api
```

## API Documentation (Swagger)

Interactive API documentation is available at:

```
http://localhost:3000/api/docs
```

## Endpoints

### File Management

#### GET /api/files/:fileName

Retrieve an uploaded file by its filename.

**Parameters:**

- `fileName` (string, required): Name of the file to retrieve

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/files/550e8400-e29b-41d4-a716-446655440000.jpg
```

**Success Response (200):**
Returns the file content with appropriate headers:

- `Content-Type`: Based on file extension
- `Content-Disposition`: `inline; filename="filename"`
- `Cache-Control`: `public, max-age=31536000`

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "File not found",
  "error": "Not Found"
}
```

### Object Detection

#### POST /api/object-detection

Submit object detection data with image and broadcast to subscribed clients.

**Content-Type:** `multipart/form-data`

**Parameters:**

- `image` (file, required): Image file containing detected objects
- `cam_id` (string, required): Camera UUID (format: UUID v4)
- `objects` (array, required): Array of detected objects
- `timestamp` (string, required): Detection timestamp (ISO 8601 format)

**Object Structure:**

```json
{
  "obj_id": "string",
  "type": "string",
  "lat": "number",
  "lng": "number",
  "objective": "string",
  "size": "string"
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/object-detection \
  -F "image=@/path/to/image.jpg" \
  -F "cam_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "objects=[{\"obj_id\":\"obj_001\",\"type\":\"person\",\"lat\":13.7563,\"lng\":100.5018,\"objective\":\"surveillance\",\"size\":\"medium\"}]" \
  -F "timestamp=2024-01-15T10:30:00.000Z"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Object detection data processed and broadcasted",
  "data": {
    "cam_id": "550e8400-e29b-41d4-a716-446655440000",
    "objects": [
      {
        "obj_id": "obj_001",
        "type": "person",
        "lat": 13.7563,
        "lng": 100.5018,
        "objective": "surveillance",
        "size": "medium"
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "image": {
      "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
      "originalname": "image.jpg",
      "mimetype": "image/jpeg",
      "size": 1024000,
      "path": "/api/files/550e8400-e29b-41d4-a716-446655440000.jpg"
    }
  }
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## WebSocket Communication

### Connection

Connect to WebSocket server at:

```
ws://localhost:3000
```

### Events

#### Subscribe to Camera

Subscribe to receive object detection updates from a specific camera.

**Event:** `subscribe_camera`

**Payload:**

```json
{
  "cam_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscribed to camera 550e8400-e29b-41d4-a716-446655440000"
}
```

#### Unsubscribe from Camera

Unsubscribe from camera updates.

**Event:** `unsubscribe_camera`

**Payload:**

```json
{
  "cam_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Unsubscribed from camera 550e8400-e29b-41d4-a716-446655440000"
}
```

#### Receive Object Detection Data

Automatically receive object detection data when subscribed to a camera.

**Event:** `object_detection`

**Payload:**

```json
{
  "cam_id": "550e8400-e29b-41d4-a716-446655440000",
  "objects": [
    {
      "obj_id": "obj_001",
      "type": "person",
      "lat": 13.7563,
      "lng": 100.5018,
      "objective": "surveillance",
      "size": "medium"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "image": {
    "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "originalname": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "path": "/api/files/550e8400-e29b-41d4-a716-446655440000.jpg"
  }
}
```

## Usage Examples

### JavaScript Client Example

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// Subscribe to camera updates
socket.emit('subscribe_camera', {
  cam_id: '550e8400-e29b-41d4-a716-446655440000',
});

// Listen for object detection updates
socket.on('object_detection', (data) => {
  console.log('Received object detection:', data);
  // Process the detection data and image
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Python Client Example

```python
import socketio
import requests

# WebSocket client
sio = socketio.Client()

@sio.on('connect')
def connect():
    print('Connected to server')
    # Subscribe to camera
    sio.emit('subscribe_camera', {
        'cam_id': '550e8400-e29b-41d4-a716-446655440000'
    })

@sio.on('object_detection')
def on_object_detection(data):
    print('Received object detection:', data)
    # Process the detection data

# Connect to server
sio.connect('http://localhost:3000')

# Send object detection data via HTTP
files = {'image': open('image.jpg', 'rb')}
data = {
    'cam_id': '550e8400-e29b-41d4-a716-446655440000',
    'objects': '[{"obj_id":"obj_001","type":"person","lat":13.7563,"lng":100.5018,"objective":"surveillance","size":"medium"}]',
    'timestamp': '2024-01-15T10:30:00.000Z'
}

response = requests.post('http://localhost:3000/api/object-detection', files=files, data=data)
print(response.json())
```

## Data Validation

### Camera ID

- Must be a valid UUID v4 format
- Example: `550e8400-e29b-41d4-a716-446655440000`

### Objects Array

- Must contain at least one object
- Each object must have required fields: `obj_id`, `type`, `lat`, `lng`, `objective`, `size`
- Additional custom fields are supported

### Timestamp

- Must be in ISO 8601 format
- Example: `2024-01-15T10:30:00.000Z`

### Image File

- Supported formats: JPEG, PNG, GIF
- Maximum file size: Configured by server (default: 10MB)

## Error Handling

### Common Error Codes

- `400 Bad Request`: Invalid input data or missing required fields
- `404 Not Found`: Endpoint not found
- `500 Internal Server Error`: Server error

### WebSocket Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## Security Considerations

- Validate all input data
- Implement authentication and authorization
- Use HTTPS in production
- Validate file types and sizes
- Sanitize user inputs

## Development

### Running the Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Building

```bash
npm run build
```

## Support

For issues and questions, please refer to the project repository or contact the development team.
