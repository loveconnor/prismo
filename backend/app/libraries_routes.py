"""
Custom Libraries Routes
Handles uploading, managing, and serving custom library files (JAR, etc.) via Supabase
"""

import os
import uuid
import base64
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from app.supabase_config import supabase, supabase_admin

# Create blueprint
libraries_bp = Blueprint("libraries", __name__)

# Temporary directory for code execution
TEMP_LIBRARIES_DIR = os.path.join(os.path.dirname(__file__), '..', 'temp_libraries')
os.makedirs(TEMP_LIBRARIES_DIR, exist_ok=True)

# Allowed file extensions per language
ALLOWED_EXTENSIONS = {
    'java': {'.jar'},
    'python': {'.py', '.whl', '.egg'},
    'javascript': {'.js'},
    'cpp': {'.a', '.so', '.dll', '.h'}
}

def allowed_file(filename, language):
    """Check if file extension is allowed for the given language"""
    if language not in ALLOWED_EXTENSIONS:
        return False
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS[language]

def get_user_id_from_request():
    """Extract user ID from request headers (JWT token)"""
    # Get from Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.replace('Bearer ', '')
    
    # Verify token with Supabase
    try:
        user = supabase.auth.get_user(token)
        return user.user.id if user and user.user else None
    except:
        return None

@libraries_bp.route("/api/libraries", methods=["GET"])
def get_libraries():
    """
    Get all custom libraries for the current user
    
    Returns:
    {
        "libraries": [...]
    }
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({"libraries": []}), 200
        
        print(f"[Get Libraries] Fetching libraries for user_id: {user_id}")
        
        # Query libraries for this user using admin client
        result = supabase_admin.table('custom_libraries')\
            .select('id, filename, language, file_size, uploaded_at, enabled')\
            .eq('user_id', user_id)\
            .order('uploaded_at', desc=True)\
            .execute()
        
        print(f"[Get Libraries] Found {len(result.data)} libraries")
        
        libraries = []
        for lib in result.data:
            libraries.append({
                "id": lib['id'],
                "filename": lib['filename'],
                "language": lib['language'],
                "size": lib['file_size'],
                "uploadedAt": lib['uploaded_at'],
                "enabled": lib['enabled']
            })
        
        return jsonify({"libraries": libraries})
    except Exception as e:
        print(f"Error fetching libraries: {str(e)}")
        return jsonify({"libraries": [], "error": str(e)}), 500

@libraries_bp.route("/api/libraries/upload", methods=["POST"])
def upload_library():
    """
    Upload a custom library file to Supabase
    
    Form data:
    - file: The library file
    - language: Programming language (java, python, javascript, cpp)
    
    Returns:
    {
        "success": true,
        "library": {...}
    }
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        language = request.form.get('language', '').lower()
        
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        if not language:
            return jsonify({"success": False, "error": "Language not specified"}), 400
        
        if language not in ALLOWED_EXTENSIONS:
            return jsonify({"success": False, "error": f"Unsupported language: {language}"}), 400
        
        # Validate file extension
        if not allowed_file(file.filename, language):
            allowed = ', '.join(ALLOWED_EXTENSIONS[language])
            return jsonify({
                "success": False,
                "error": f"Invalid file type for {language}. Allowed: {allowed}"
            }), 400
        
        # Read file content
        file_content = file.read()
        file_size = len(file_content)
        
        # Validate file size (max 50MB)
        if file_size > 50 * 1024 * 1024:
            return jsonify({"success": False, "error": "File size must be less than 50MB"}), 400
        
        # Generate unique ID and secure filename
        library_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename)
        file_ext = os.path.splitext(original_filename)[1]
        stored_filename = f"{library_id}{file_ext}"
        
        # Encode file content as base64 for JSON transport
        file_data_b64 = base64.b64encode(file_content).decode('utf-8')
        
        print(f"[Upload Library] user_id: {user_id}, filename: {original_filename}, language: {language}, size: {file_size}")
        
        # Store in Supabase using admin client to bypass RLS
        result = supabase_admin.table('custom_libraries').insert({
            'id': library_id,
            'user_id': user_id,
            'filename': original_filename,
            'stored_filename': stored_filename,
            'language': language,
            'file_size': file_size,
            'file_data': file_data_b64,
            'enabled': True
        }).execute()
        
        print(f"[Upload Library] Successfully saved to Supabase with id: {library_id}")
        
        library = result.data[0]
        
        return jsonify({
            "success": True,
            "library": {
                "id": library["id"],
                "filename": library["filename"],
                "language": library["language"],
                "size": library["file_size"],
                "uploadedAt": library["uploaded_at"],
                "enabled": library["enabled"]
            }
        })
        
    except Exception as e:
        print(f"Error uploading library: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@libraries_bp.route("/api/libraries/<library_id>", methods=["DELETE"])
def delete_library(library_id):
    """
    Delete a custom library from Supabase
    
    Returns:
    {
        "success": true
    }
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        
        # Delete library using admin client to bypass RLS
        supabase_admin.table('custom_libraries')\
            .delete()\
            .eq('id', library_id)\
            .eq('user_id', user_id)\
            .execute()
        
        return jsonify({"success": True})
        
    except Exception as e:
        print(f"Error deleting library: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@libraries_bp.route("/api/libraries/<library_id>/toggle", methods=["PATCH"])
def toggle_library(library_id):
    """
    Toggle library enabled/disabled status in Supabase
    
    Request body:
    {
        "enabled": true
    }
    
    Returns:
    {
        "success": true
    }
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        
        data = request.get_json()
        enabled = data.get('enabled', True)
        
        # Update library using admin client to bypass RLS
        supabase_admin.table('custom_libraries')\
            .update({'enabled': enabled})\
            .eq('id', library_id)\
            .eq('user_id', user_id)\
            .execute()
        
        return jsonify({"success": True})
        
    except Exception as e:
        print(f"Error toggling library: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


def get_enabled_libraries(language, user_id=None):
    """
    Get all enabled libraries for a specific language from Supabase
    Downloads files temporarily for code execution
    Returns list of file paths
    """
    try:
        if not user_id:
            # Try to get from current request context
            user_id = get_user_id_from_request()
            if not user_id:
                print(f"[Get Enabled Libraries] No user_id found for language: {language}")
                return []
        
        print(f"[Get Enabled Libraries] Fetching libraries for user_id: {user_id}, language: {language}")
        
        # Query enabled libraries for this user and language using admin client
        result = supabase_admin.table('custom_libraries')\
            .select('id, stored_filename, file_data')\
            .eq('user_id', user_id)\
            .eq('language', language)\
            .eq('enabled', True)\
            .execute()
        
        print(f"[Get Enabled Libraries] Found {len(result.data)} enabled libraries")
        
        file_paths = []
        
        # Create temp directory for this user/language
        user_lib_dir = os.path.join(TEMP_LIBRARIES_DIR, user_id, language)
        os.makedirs(user_lib_dir, exist_ok=True)
        
        for lib in result.data:
            # Write file to temp directory
            file_path = os.path.join(user_lib_dir, lib['stored_filename'])
            
            # Decode base64 and write binary data
            file_data = base64.b64decode(lib['file_data'])
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            print(f"[Get Enabled Libraries] Extracted library to: {file_path}")
            file_paths.append(file_path)
        
        return file_paths
        
    except Exception as e:
        print(f"Error loading libraries: {str(e)}")
        import traceback
        traceback.print_exc()
        return []
