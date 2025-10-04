# File Storage System

## Overview

The TESA GPS Tracking Service now includes a file storage system that saves uploaded images to the local filesystem instead of keeping them in memory. This improves performance and allows for better file management.

## File Storage Structure

```
tesa-service/
├── uploads/
│   └── images/
│       ├── uuid1.jpg
│       ├── uuid2.png
│       └── ...
```

## Features

### 1. File Upload and Storage

- Images are automatically saved to `uploads/images/` directory
- Files are renamed with UUID to prevent conflicts
- Original file extensions are preserved
- File metadata is stored in the response

### 2. File Retrieval

- Files can be accessed via `/api/files/:fileName` endpoint
- Proper MIME types are set based on file extension
- Cache headers are set for optimal performance
- 404 error handling for missing files

### 3. File Management

- Automatic directory creation
- File existence checking
- File deletion capabilities
- Public URL generation

## API Endpoints

### Upload File (via Object Detection)

```bash
POST /api/object-detection
Content-Type: multipart/form-data

# Form data:
# - image: file
# - cam_id: string (UUID)
# - objects: array
# - timestamp: string (ISO 8601)
```

### Retrieve File

```bash
GET /api/files/:fileName
```

## Response Format

### Object Detection Response

```json
{
  "success": true,
  "message": "Object detection data processed and broadcasted",
  "data": {
    "cam_id": "550e8400-e29b-41d4-a716-446655440000",
    "objects": [...],
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

## File Service Methods

### FileService

- `saveFile(file: Express.Multer.File): Promise<string>` - Save file and return filename
- `getFilePath(fileName: string): Promise<string>` - Get full file path
- `getFile(fileName: string): Promise<Buffer>` - Read file content
- `deleteFile(fileName: string): Promise<void>` - Delete file
- `fileExists(fileName: string): Promise<boolean>` - Check if file exists
- `getPublicUrl(fileName: string): string` - Generate public URL

## Security Considerations

1. **File Validation**: Only image files are accepted
2. **Path Security**: UUID filenames prevent directory traversal
3. **File Size**: Configured limits on upload size
4. **MIME Type Validation**: Proper content type checking

## Configuration

### Environment Variables

```bash
# File upload directory (default: uploads/images)
UPLOAD_PATH=uploads/images

# Maximum file size (default: 10MB)
MAX_FILE_SIZE=10485760
```

### Multer Configuration

```typescript
// In your module configuration
MulterModule.register({
  dest: './uploads/images',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});
```

## Usage Examples

### JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('image', fs.createReadStream('image.jpg'));
form.append('cam_id', '550e8400-e29b-41d4-a716-446655440000');
form.append(
  'objects',
  JSON.stringify([
    {
      obj_id: 'obj_001',
      type: 'person',
      lat: 13.7563,
      lng: 100.5018,
      objective: 'surveillance',
      size: 'medium',
    },
  ]),
);
form.append('timestamp', new Date().toISOString());

fetch('http://localhost:3000/api/object-detection', {
  method: 'POST',
  body: form,
})
  .then((response) => response.json())
  .then((data) => {
    console.log('File saved as:', data.data.image.filename);
    console.log('Access URL:', data.data.image.path);
  });
```

### Python

```python
import requests

files = {'image': open('image.jpg', 'rb')}
data = {
    'cam_id': '550e8400-e29b-41d4-a716-446655440000',
    'objects': '[{"obj_id":"obj_001","type":"person","lat":13.7563,"lng":100.5018,"objective":"surveillance","size":"medium"}]',
    'timestamp': '2024-01-15T10:30:00.000Z'
}

response = requests.post('http://localhost:3000/api/object-detection', files=files, data=data)
result = response.json()

print(f"File saved as: {result['data']['image']['filename']}")
print(f"Access URL: {result['data']['image']['path']}")
```

## Troubleshooting

### Common Issues

1. **File not found (404)**
   - Check if file exists in uploads/images directory
   - Verify filename is correct
   - Ensure file wasn't deleted

2. **Upload fails**
   - Check file size limits
   - Verify file format is supported
   - Ensure uploads directory has write permissions

3. **Permission errors**
   - Make sure uploads directory exists
   - Check file system permissions
   - Run with appropriate user privileges

### File System Permissions

```bash
# Create uploads directory with proper permissions
mkdir -p uploads/images
chmod 755 uploads/images
```

## Performance Considerations

1. **File Size**: Large files may impact upload performance
2. **Storage**: Monitor disk space usage
3. **Cleanup**: Implement file cleanup policies for old files
4. **Caching**: Files are cached for 1 year by default

## Future Enhancements

1. **Cloud Storage**: Integration with AWS S3, Google Cloud Storage
2. **Image Processing**: Thumbnail generation, resizing
3. **File Compression**: Automatic image optimization
4. **Backup**: Automated backup strategies
5. **CDN**: Content delivery network integration
