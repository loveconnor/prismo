#!/usr/bin/env python3
"""
Learning System Routes for Prismo Backend

API routes for the core learning system including modules, attempts, mastery, and feedback.
"""

from functools import wraps
from flask import Blueprint, jsonify, request
from app.orm import orm, PaginationParams
from app.auth_service import auth_service
from datetime import datetime
import traceback

# Learning routes blueprint
learning_bp = Blueprint("learning", __name__, url_prefix="/learning")

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header required"}), 401

        try:
            token = auth_header.split(" ")[1]
            result = auth_service.verify_token(token)
            if not result["success"]:
                return jsonify({"error": result["error"]}), 401

            request.current_user = result["user_data"]
            return f(*args, **kwargs)

        except IndexError:
            return jsonify({"error": "Invalid authorization header format"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication error: {e}"}), 401

    return decorated_function

# ============================================================================
# MODULES
# ============================================================================

@learning_bp.route("/modules", methods=["GET"])
@require_auth
def get_modules():
    """Get learning modules"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        module_type = request.args.get('module_type')
        limit = int(request.args.get('limit', 50))
        
        if user_id:
            result = orm.modules.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if module_type:
                filter_conditions.append("module_type = :module_type")
                expression_values[":module_type"] = module_type
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.modules.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "modules": [module.to_dict() for module in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get modules: {e}"}), 500

@learning_bp.route("/modules", methods=["POST"])
@require_auth
def create_module():
    """Create learning module"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        module_data = {
            "user_id": user_id,
            "name": data.get("name"),
            "module_type": data.get("module_type"),
            "content": data.get("content", {}),
            "is_public": data.get("is_public", False),
            "tags": data.get("tags", []),
            "difficulty": data.get("difficulty", 1),
            "estimated_time": data.get("estimated_time", 30)
        }
        
        module = orm.modules.create(module_data)
        return jsonify({"module": module.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create module: {e}"}), 500

@learning_bp.route("/modules/<module_id>", methods=["GET"])
@require_auth
def get_module(module_id):
    """Get specific module"""
    try:
        module = orm.modules.get_by_id(module_id)
        if not module:
            return jsonify({"error": "Module not found"}), 404
        return jsonify({"module": module.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get module: {e}"}), 500

@learning_bp.route("/modules/<module_id>", methods=["PUT"])
@require_auth
def update_module(module_id):
    """Update module"""
    try:
        data = request.get_json()
        updated_module = orm.modules.update(module_id, data)
        return jsonify({"module": updated_module.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update module: {e}"}), 500

# ============================================================================
# ATTEMPTS
# ============================================================================

@learning_bp.route("/attempts", methods=["GET"])
@require_auth
def get_attempts():
    """Get learning attempts"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        lab_id = request.args.get('lab_id')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        if lab_id:
            result = orm.attempts.query(
                index_name="lab-id-index",
                key_condition={"lab_id": lab_id}
            )
        else:
            result = orm.attempts.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        # Filter by status if provided
        if status:
            filtered_items = [attempt for attempt in result.items if attempt.status == status]
            result.items = filtered_items
            result.count = len(filtered_items)
        
        return jsonify({
            "attempts": [attempt.to_dict() for attempt in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get attempts: {e}"}), 500

@learning_bp.route("/attempts", methods=["POST"])
@require_auth
def create_attempt():
    """Create learning attempt"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        attempt_data = {
            "user_id": user_id,
            "lab_id": data.get("lab_id"),
            "status": data.get("status", "in_progress"),
            "progress": data.get("progress", 0.0),
            "score": data.get("score"),
            "feedback": data.get("feedback", {}),
            "started_at": datetime.utcnow().isoformat()
        }
        
        attempt = orm.attempts.create(attempt_data)
        return jsonify({"attempt": attempt.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create attempt: {e}"}), 500

@learning_bp.route("/attempts/<attempt_id>", methods=["GET"])
@require_auth
def get_attempt(attempt_id):
    """Get specific attempt"""
    try:
        attempt = orm.attempts.get_by_id(attempt_id)
        if not attempt:
            return jsonify({"error": "Attempt not found"}), 404
        return jsonify({"attempt": attempt.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get attempt: {e}"}), 500

@learning_bp.route("/attempts/<attempt_id>", methods=["PUT"])
@require_auth
def update_attempt(attempt_id):
    """Update attempt"""
    try:
        data = request.get_json()
        updated_attempt = orm.attempts.update(attempt_id, data)
        return jsonify({"attempt": updated_attempt.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update attempt: {e}"}), 500

# ============================================================================
# MASTERY
# ============================================================================

@learning_bp.route("/mastery", methods=["GET"])
@require_auth
def get_mastery():
    """Get mastery records"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        skill_tag = request.args.get('skill_tag')
        level = request.args.get('level')
        limit = int(request.args.get('limit', 50))
        
        if skill_tag:
            result = orm.mastery.query(
                index_name="skill-tag-index",
                key_condition={"skill_tag": skill_tag}
            )
        else:
            result = orm.mastery.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        # Filter by level if provided
        if level:
            filtered_items = [mastery for mastery in result.items if mastery.level == level]
            result.items = filtered_items
            result.count = len(filtered_items)
        
        return jsonify({
            "mastery": [mastery.to_dict() for mastery in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get mastery: {e}"}), 500

@learning_bp.route("/mastery", methods=["POST"])
@require_auth
def create_mastery():
    """Create mastery record"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        mastery_data = {
            "user_id": user_id,
            "skill_tag": data.get("skill_tag"),
            "level": data.get("level", "learning"),
            "progress": data.get("progress", 0.0),
            "last_practiced": data.get("last_practiced", datetime.utcnow().isoformat())
        }
        
        mastery = orm.mastery.create(mastery_data)
        return jsonify({"mastery": mastery.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create mastery: {e}"}), 500

@learning_bp.route("/mastery/<mastery_id>", methods=["PUT"])
@require_auth
def update_mastery(mastery_id):
    """Update mastery record"""
    try:
        data = request.get_json()
        updated_mastery = orm.mastery.update(mastery_id, data)
        return jsonify({"mastery": updated_mastery.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update mastery: {e}"}), 500

# ============================================================================
# FEEDBACK
# ============================================================================

@learning_bp.route("/feedback", methods=["GET"])
@require_auth
def get_feedback():
    """Get feedback records"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        widget_id = request.args.get('widget_id')
        limit = int(request.args.get('limit', 50))
        
        if widget_id:
            result = orm.feedback.query(
                index_name="widget-id-index",
                key_condition={"widget_id": widget_id}
            )
        else:
            result = orm.feedback.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        return jsonify({
            "feedback": [feedback.to_dict() for feedback in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get feedback: {e}"}), 500

@learning_bp.route("/feedback", methods=["POST"])
@require_auth
def create_feedback():
    """Create feedback record"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        feedback_data = {
            "user_id": user_id,
            "widget_id": data.get("widget_id"),
            "feedback_text": data.get("feedback_text"),
            "rating": data.get("rating"),
            "time_spent": data.get("time_spent"),
            "attempts_taken": data.get("attempts_taken")
        }
        
        feedback = orm.feedback.create(feedback_data)
        return jsonify({"feedback": feedback.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create feedback: {e}"}), 500

# ============================================================================
# LEARNING PATHS
# ============================================================================

@learning_bp.route("/paths", methods=["GET"])
@require_auth
def get_learning_paths():
    """Get learning paths"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        path_type = request.args.get('path_type')
        limit = int(request.args.get('limit', 50))
        
        if path_type:
            result = orm.learning_paths.query(
                index_name="path-type-index",
                key_condition={"path_type": path_type}
            )
        else:
            result = orm.learning_paths.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        return jsonify({
            "paths": [path.to_dict() for path in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get learning paths: {e}"}), 500

@learning_bp.route("/paths", methods=["POST"])
@require_auth
def create_learning_path():
    """Create learning path"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        path_data = {
            "user_id": user_id,
            "path_type": data.get("path_type"),
            "name": data.get("name"),
            "description": data.get("description"),
            "modules": data.get("modules", []),
            "difficulty": data.get("difficulty", 1),
            "estimated_duration": data.get("estimated_duration", 60)
        }
        
        path = orm.learning_paths.create(path_data)
        return jsonify({"path": path.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create learning path: {e}"}), 500

# ============================================================================
# SKILL TAGS
# ============================================================================

@learning_bp.route("/skill-tags", methods=["GET"])
@require_auth
def get_skill_tags():
    """Get skill tags"""
    try:
        category = request.args.get('category')
        limit = int(request.args.get('limit', 100))
        
        if category:
            result = orm.skill_tags.query(
                index_name="category-index",
                key_condition={"category": category}
            )
        else:
            result = orm.skill_tags.scan(pagination=PaginationParams(limit=limit))
        
        return jsonify({
            "skill_tags": [tag.to_dict() for tag in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get skill tags: {e}"}), 500

@learning_bp.route("/skill-tags", methods=["POST"])
@require_auth
def create_skill_tag():
    """Create skill tag"""
    try:
        data = request.get_json()
        
        tag_data = {
            "name": data.get("name"),
            "category": data.get("category"),
            "description": data.get("description"),
            "difficulty_levels": data.get("difficulty_levels", [1, 2, 3]),
            "prerequisites": data.get("prerequisites", [])
        }
        
        tag = orm.skill_tags.create(tag_data)
        return jsonify({"skill_tag": tag.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create skill tag: {e}"}), 500

# ============================================================================
# DIFFICULTY LEVELS
# ============================================================================

@learning_bp.route("/difficulty-levels", methods=["GET"])
@require_auth
def get_difficulty_levels():
    """Get difficulty levels"""
    try:
        level = request.args.get('level')
        limit = int(request.args.get('limit', 10))
        
        if level:
            result = orm.difficulty_levels.query(
                index_name="level-index",
                key_condition={"level": int(level)}
            )
        else:
            result = orm.difficulty_levels.scan(pagination=PaginationParams(limit=limit))
        
        return jsonify({
            "difficulty_levels": [level.to_dict() for level in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get difficulty levels: {e}"}), 500

@learning_bp.route("/difficulty-levels", methods=["POST"])
@require_auth
def create_difficulty_level():
    """Create difficulty level"""
    try:
        data = request.get_json()
        
        level_data = {
            "level": data.get("level"),
            "name": data.get("name"),
            "description": data.get("description"),
            "color": data.get("color"),
            "icon": data.get("icon")
        }
        
        level = orm.difficulty_levels.create(level_data)
        return jsonify({"difficulty_level": level.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create difficulty level: {e}"}), 500
