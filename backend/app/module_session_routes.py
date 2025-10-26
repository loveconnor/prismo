"""
Module Session Routes

Handles tracking of when users start, progress through, and complete modules.
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from typing import Dict, Any, Optional
from decimal import Decimal
from app.orm import orm, ModuleSession
from app.auth_service import CognitoAuthService

# Create blueprint
module_session_bp = Blueprint("module_sessions", __name__)

# Initialize auth service
auth_service = CognitoAuthService()


def get_user_id_from_token() -> Optional[str]:
    """Extract user ID from JWT token in Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        # Verify token and get user info
        user_info = auth_service.verify_token(token)
        if user_info and 'success' in user_info and user_info['success']:
            return user_info.get('user_id') or user_info.get('cognito_user', {}).get('Username')
    except Exception as e:
        print(f"Error verifying token: {e}")
    
    return None


@module_session_bp.route("/module-sessions/start", methods=["POST"])
def start_module_session():
    """
    Start a new module session for a user
    
    Request body:
    {
        "module_id": "string",
        "total_steps": 5
    }
    
    Returns:
    {
        "success": true,
        "session": {
            "id": "session_id",
            "user_id": "user_id",
            "module_id": "module_id",
            "status": "started",
            "started_at": "2024-01-01T00:00:00Z",
            "progress": 0.0,
            "current_step": 1
        }
    }
    """
    try:
        # Get user ID from token
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required"
            }), 401
        
        data = request.get_json()
        if not data or 'module_id' not in data:
            return jsonify({
                "success": False,
                "error": "module_id is required"
            }), 400
        
        module_id = data['module_id']
        total_steps = data.get('total_steps', 1)
        
        # Check if user already has an active session for this module
        existing_sessions = orm.module_sessions.query_by_user_id(
            user_id=user_id,
            module_id=module_id
        )
        # Filter for active sessions
        existing_sessions = [s for s in existing_sessions if s.status in ['started', 'in_progress']]
        
        if existing_sessions:
            # Return existing session
            session = existing_sessions[0]
            return jsonify({
                "success": True,
                "session": session.to_dict()
            })
        
        # Create new session
        now = datetime.utcnow().isoformat() + "Z"
        session_data = {
            "user_id": user_id,
            "module_id": module_id,
            "status": "started",
            "started_at": now,
            "last_activity_at": now,
            "time_spent": 0,
            "progress": Decimal('0.0'),
            "current_step": 1,
            "total_steps": total_steps
        }
        
        session = orm.module_sessions.create(session_data)
        
        return jsonify({
            "success": True,
            "session": session.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@module_session_bp.route("/module-sessions/<session_id>/update", methods=["PUT"])
def update_module_session(session_id: str):
    """
    Update a module session (progress, current step, time spent)
    
    Request body:
    {
        "status": "in_progress",  // optional
        "current_step": 3,        // optional
        "progress": 0.6,          // optional (0.0 to 1.0)
        "time_spent": 300,        // optional (in seconds)
        "completed": false        // optional
    }
    
    Returns:
    {
        "success": true,
        "session": { ... }
    }
    """
    try:
        # Get user ID from token
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required"
            }), 401
        
        # Get existing session
        session = orm.module_sessions.get_by_id(session_id)
        if not session:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Verify user owns this session
        if session.user_id != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "Request body required"
            }), 400
        
        # Prepare updates
        updates = {}
        now = datetime.utcnow().isoformat() + "Z"
        
        if 'status' in data:
            updates['status'] = data['status']
        
        if 'current_step' in data:
            updates['current_step'] = data['current_step']
        
        if 'progress' in data:
            updates['progress'] = Decimal(str(min(1.0, max(0.0, data['progress']))))
        
        if 'time_spent' in data:
            updates['time_spent'] = data['time_spent']
        
        if data.get('completed', False):
            updates['status'] = 'completed'
            updates['completed_at'] = now
            updates['progress'] = Decimal('1.0')
        
        # Always update last activity
        updates['last_activity_at'] = now
        updates['updated_at'] = now
        
        # Update session
        updated_session = orm.module_sessions.update(session_id, updates)
        
        return jsonify({
            "success": True,
            "session": updated_session.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@module_session_bp.route("/module-sessions/<session_id>", methods=["GET"])
def get_module_session(session_id: str):
    """
    Get a specific module session
    
    Returns:
    {
        "success": true,
        "session": { ... }
    }
    """
    try:
        # Get user ID from token
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required"
            }), 401
        
        # Get session
        session = orm.module_sessions.get_by_id(session_id)
        if not session:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Verify user owns this session
        if session.user_id != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403
        
        return jsonify({
            "success": True,
            "session": session.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@module_session_bp.route("/module-sessions/user/<user_id>", methods=["GET"])
def get_user_module_sessions(user_id: str):
    """
    Get all module sessions for a user
    
    Query params:
    - status: filter by status (started, in_progress, completed, abandoned)
    - module_id: filter by specific module
    - limit: number of results (default 50)
    - offset: pagination offset (default 0)
    
    Returns:
    {
        "success": true,
        "sessions": [ ... ],
        "total": 10
    }
    """
    try:
        # Get requesting user ID from token
        requesting_user_id = get_user_id_from_token()
        if not requesting_user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required"
            }), 401
        
        # Verify user can access these sessions (for now, only own sessions)
        if requesting_user_id != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403
        
        # Get query parameters
        status = request.args.get('status')
        module_id = request.args.get('module_id')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query_params = {'user_id': user_id}
        if status:
            query_params['status'] = status
        if module_id:
            query_params['module_id'] = module_id
        
        # Query sessions
        sessions = orm.module_sessions.query_by_user_id(
            user_id=user_id,
            status=status,
            module_id=module_id,
            limit=limit
        )
        
        # Apply pagination
        total = len(sessions)
        sessions = sessions[offset:offset + limit]
        
        return jsonify({
            "success": True,
            "sessions": [session.to_dict() for session in sessions],
            "total": total
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@module_session_bp.route("/module-sessions/<session_id>/complete", methods=["POST"])
def complete_module_session(session_id: str):
    """
    Mark a module session as completed
    
    Request body:
    {
        "final_time_spent": 1800,  // optional
        "final_score": 85.5        // optional
    }
    
    Returns:
    {
        "success": true,
        "session": { ... }
    }
    """
    try:
        # Get user ID from token
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required"
            }), 401
        
        # Get existing session
        session = orm.module_sessions.get_by_id(session_id)
        if not session:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Verify user owns this session
        if session.user_id != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403
        
        data = request.get_json() or {}
        now = datetime.utcnow().isoformat() + "Z"
        
        # Prepare completion updates
        updates = {
            'status': 'completed',
            'completed_at': now,
            'progress': Decimal('1.0'),
            'last_activity_at': now,
            'updated_at': now
        }
        
        if 'final_time_spent' in data:
            updates['time_spent'] = data['final_time_spent']
        
        # Update session
        updated_session = orm.module_sessions.update(session_id, updates)
        
        # TODO: Update learner profile and skill tree here
        # This would integrate with the ACE engine
        
        return jsonify({
            "success": True,
            "session": updated_session.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@module_session_bp.route("/module-sessions/<session_id>/abandon", methods=["POST"])
def abandon_module_session(session_id: str):
    """
    Mark a module session as abandoned
    
    Returns:
    {
        "success": true,
        "session": { ... }
    }
    """
    try:
        # Get user ID from token
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required"
            }), 401
        
        # Get existing session
        session = orm.module_sessions.get_by_id(session_id)
        if not session:
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        # Verify user owns this session
        if session.user_id != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403
        
        now = datetime.utcnow().isoformat() + "Z"
        
        # Mark as abandoned
        updates = {
            'status': 'abandoned',
            'last_activity_at': now,
            'updated_at': now
        }
        
        updated_session = orm.module_sessions.update(session_id, updates)
        
        return jsonify({
            "success": True,
            "session": updated_session.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
