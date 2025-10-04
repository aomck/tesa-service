# Changelog

## [1.1.0] - 2024-10-04

### Added

- **File Storage System**: Implemented local file storage for uploaded images
- **FileService**: New service for managing file operations
- **FileController**: New controller for serving uploaded files
- **File API Endpoint**: `GET /api/files/:fileName` for retrieving uploaded files
- **UUID-based File Naming**: Files are renamed with UUID to prevent conflicts
- **File Documentation**: Comprehensive documentation for file storage system

### Changed

- **Object Detection Response**: Now includes file path instead of buffer data
- **Image Storage**: Images are saved to disk instead of kept in memory
- **WebSocket Data**: Object detection events now include file paths
- **API Documentation**: Updated to reflect new file storage capabilities

### Technical Details

#### New Files Created

- `src/common/file.service.ts` - File management service
- `src/common/file.controller.ts` - File serving controller
- `docs/file-storage.md` - File storage documentation
- `docs/CHANGELOG.md` - This changelog

#### Modified Files

- `src/gps-tracking/object-detection/object-detection.controller.ts`
- `src/gps-tracking/object-detection/object-detection.service.ts`
- `src/gps-tracking/gps-tracking.module.ts`
- `docs/api-usage.md`
- `.gitignore`

#### Dependencies Added

- `uuid` - For generating unique filenames
- `@types/uuid` - TypeScript types for uuid

### File Structure

```
tesa-service/
├── uploads/
│   └── images/          # Uploaded image files
├── src/
│   ├── common/
│   │   ├── file.service.ts
│   │   └── file.controller.ts
│   └── gps-tracking/
│       └── object-detection/
│           ├── object-detection.controller.ts (modified)
│           └── object-detection.service.ts (modified)
└── docs/
    ├── file-storage.md
    ├── api-usage.md (updated)
    └── CHANGELOG.md
```

### API Changes

#### Object Detection Response Format

**Before:**

```json
{
  "image": {
    "filename": "image.jpg",
    "originalname": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "buffer": "base64_encoded_data"
  }
}
```

**After:**

```json
{
  "image": {
    "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "originalname": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "path": "/api/files/550e8400-e29b-41d4-a716-446655440000.jpg"
  }
}
```

#### New Endpoint

- `GET /api/files/:fileName` - Retrieve uploaded files

### Benefits

1. **Performance**: Reduced memory usage by storing files on disk
2. **Scalability**: Better handling of large files and multiple uploads
3. **Persistence**: Files remain available after server restart
4. **Security**: UUID-based naming prevents directory traversal
5. **Caching**: Proper cache headers for optimal performance
6. **Management**: Easy file cleanup and management

### Migration Notes

- Existing clients will need to update to use the new `path` field
- File URLs are now accessible via the `/api/files/` endpoint
- No breaking changes to the upload API
- WebSocket events now include file paths instead of buffer data

### Testing

- All existing tests should continue to pass
- New file storage functionality has been tested
- Server builds and runs successfully
- File upload and retrieval endpoints are functional

### Future Enhancements

- Cloud storage integration (AWS S3, Google Cloud)
- Image processing and thumbnail generation
- File cleanup policies
- CDN integration
- File compression and optimization
