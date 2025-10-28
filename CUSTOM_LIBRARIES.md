# Custom Libraries Feature

## Overview
This feature allows students and instructors to upload custom library files (JAR, Python packages, etc.) that are automatically included when compiling and running code in labs.

## Use Case
Perfect for classes that require specific libraries like:
- **Java**: `components.jar`, custom UI libraries, course-specific frameworks
- **Python**: Custom modules, `.whl` packages
- **C++**: Static/shared libraries (`.a`, `.so`, `.dll`)
- **JavaScript**: Custom Node.js packages

## How It Works

### 1. Upload Library
1. Open Settings (click your avatar → Settings)
2. Navigate to "Code Execution" in the left sidebar
3. Select the programming language from the dropdown
4. Click "Upload Library" and select your file
5. The library is automatically enabled after upload

### 2. Manage Libraries
- **Toggle On/Off**: Click the switch next to any library to enable/disable it
- **Delete**: Click "Delete" button to remove a library permanently
- **View Info**: See filename, language, size, and upload date

### 3. Automatic Integration
When enabled, libraries are automatically used:
- **Java**: Added to classpath during compilation (`javac -cp`) and execution (`java -cp`)
- **Python**: Modules available for import
- **JavaScript**: Packages available via require/import
- **C++**: Libraries linked during compilation

## Technical Details

### Frontend
- **Service**: `CustomLibrariesService` (`src/services/custom-libraries.service.ts`)
  - Manages library upload, deletion, and toggle
  - Provides Observable stream of libraries
  - Filters by language and enabled status

- **Settings UI**: New "Code Execution" section in Settings modal
  - Language selector
  - File upload
  - Library list with enable/disable toggles
  - Delete functionality

### Backend
- **Routes**: `app/libraries_routes.py`
  - `GET /api/libraries` - List all libraries
  - `POST /api/libraries/upload` - Upload new library
  - `DELETE /api/libraries/<id>` - Delete library
  - `PATCH /api/libraries/<id>/toggle` - Enable/disable library

- **Storage**: 
  - Files stored in `backend/custom_libraries/<language>/`
  - Metadata stored in `backend/custom_libraries/libraries.json`

- **Integration**:
  - `execute_java_code()` in `claude_routes.py` and `ai_routes.py` modified
  - Uses `get_enabled_libraries(language)` to fetch library paths
  - Builds classpath with custom JARs

### File Limits
- Maximum file size: 50MB
- Supported extensions:
  - **Java**: `.jar`
  - **Python**: `.py`, `.whl`, `.egg`
  - **JavaScript**: `.js`
  - **C++**: `.a`, `.so`, `.dll`, `.h`

## Example: Java with components.jar

1. **Upload the JAR**:
   ```
   Settings → Code Execution → Select "Java" → Upload components.jar
   ```

2. **Write Code Using It**:
   ```java
   import components.Graphics;
   
   public class MyProgram {
       public static void main(String[] args) {
           Graphics g = new Graphics();
           g.drawCircle(10, 10, 50);
       }
   }
   ```

3. **Execute**:
   - The system automatically compiles with: `javac -cp <temp>:<components.jar> MyProgram.java`
   - Runs with: `java -cp <temp>:<components.jar> MyProgram`

## API Reference

### Upload Library
```typescript
POST /api/libraries/upload
Content-Type: multipart/form-data

FormData:
  file: <File>
  language: "java" | "python" | "javascript" | "cpp"

Response:
{
  "success": true,
  "library": {
    "id": "uuid",
    "filename": "components.jar",
    "language": "java",
    "size": 123456,
    "uploadedAt": "2025-10-26T...",
    "enabled": true
  }
}
```

### List Libraries
```typescript
GET /api/libraries

Response:
{
  "libraries": [...]
}
```

### Toggle Library
```typescript
PATCH /api/libraries/<id>/toggle
Content-Type: application/json

Body:
{
  "enabled": true
}

Response:
{
  "success": true
}
```

### Delete Library
```typescript
DELETE /api/libraries/<id>

Response:
{
  "success": true
}
```

## Security Considerations

1. **File Validation**: Only allowed extensions are accepted
2. **Size Limits**: 50MB maximum to prevent abuse
3. **Secure Filenames**: Uses `secure_filename()` to prevent path traversal
4. **Unique Storage**: Files stored with UUID to prevent conflicts
5. **Sandboxed Execution**: Code still runs in isolated subprocess with timeouts

## Future Enhancements

- [ ] Support for multiple files per library
- [ ] Library versioning
- [ ] Shared libraries across users/classes
- [ ] Instructor-managed library presets
- [ ] Automatic dependency resolution
- [ ] Library documentation/descriptions
