#!/usr/bin/env python3
"""
Advanced Learning Routes for Prismo Backend

API routes for advanced learning features including sandbox sessions, review sessions, and system management.
"""

from functools import wraps
from flask import Blueprint, jsonify, request
from app.orm_supabase import orm, PaginationParams
from app.auth_service_supabase import auth_service
from datetime import datetime, timedelta
import traceback

# Advanced routes blueprint
advanced_bp = Blueprint("advanced", __name__, url_prefix="/advanced")

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
# SANDBOX SESSIONS
# ============================================================================

@advanced_bp.route("/sandbox-sessions", methods=["GET"])
@require_auth
def get_sandbox_sessions():
    """Get sandbox sessions"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        session_type = request.args.get('session_type')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if session_type:
            filter_conditions.append("session_type = :session_type")
            expression_values[":session_type"] = session_type
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.sandbox_sessions.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "sessions": [session.to_dict() for session in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get sandbox sessions: {e}"}), 500

@advanced_bp.route("/sandbox-sessions", methods=["POST"])
@require_auth
def create_sandbox_session():
    """Create sandbox session"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        session_data = {
            "user_id": user_id,
            "session_type": data.get("session_type", "exploration"),
            "content": data.get("content", {}),
            "template": data.get("template"),
            "language": data.get("language", "python"),
            "started_at": datetime.utcnow().isoformat()
        }
        
        session = orm.sandbox_sessions.create(session_data)
        return jsonify({"session": session.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create sandbox session: {e}"}), 500

@advanced_bp.route("/sandbox-sessions/<session_id>", methods=["PUT"])
@require_auth
def update_sandbox_session(session_id):
    """Update sandbox session"""
    try:
        data = request.get_json()
        updated_session = orm.sandbox_sessions.update(session_id, data)
        return jsonify({"session": updated_session.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update sandbox session: {e}"}), 500

# ============================================================================
# REVIEW SESSIONS
# ============================================================================

@advanced_bp.route("/review-sessions", methods=["GET"])
@require_auth
def get_review_sessions():
    """Get review sessions"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        review_type = request.args.get('review_type')
        session_date = request.args.get('session_date')
        limit = int(request.args.get('limit', 50))
        
        if session_date:
            result = orm.review_sessions.query(
                index_name="session-date-index",
                key_condition={"session_date": session_date}
            )
        else:
            result = orm.review_sessions.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        # Filter by review type if provided
        if review_type:
            filtered_items = [session for session in result.items if session.review_type == review_type]
            result.items = filtered_items
            result.count = len(filtered_items)
        
        return jsonify({
            "sessions": [session.to_dict() for session in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get review sessions: {e}"}), 500

@advanced_bp.route("/review-sessions", methods=["POST"])
@require_auth
def create_review_session():
    """Create review session"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        session_data = {
            "user_id": user_id,
            "review_type": data.get("review_type", "smart_review"),
            "session_date": data.get("session_date", datetime.utcnow().strftime("%Y-%m-%d")),
            "skills_reviewed": data.get("skills_reviewed", []),
            "weak_areas": data.get("weak_areas", []),
            "duration": data.get("duration", 0),
            "completed": data.get("completed", False),
            "created_at": datetime.utcnow().isoformat()
        }
        
        session = orm.review_sessions.create(session_data)
        return jsonify({"session": session.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create review session: {e}"}), 500

@advanced_bp.route("/review-sessions/<session_id>", methods=["PUT"])
@require_auth
def update_review_session(session_id):
    """Update review session"""
    try:
        data = request.get_json()
        updated_session = orm.review_sessions.update(session_id, data)
        return jsonify({"session": updated_session.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update review session: {e}"}), 500

# ============================================================================
# LAB TEMPLATES
# ============================================================================

@advanced_bp.route("/lab-templates", methods=["GET"])
@require_auth
def get_lab_templates():
    """Get lab templates"""
    try:
        template_type = request.args.get('template_type')
        difficulty = request.args.get('difficulty')
        subject = request.args.get('subject')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = []
        expression_values = {}
        
        if template_type:
            filter_conditions.append("template_type = :template_type")
            expression_values[":template_type"] = template_type
        
        if difficulty:
            filter_conditions.append("difficulty = :difficulty")
            expression_values[":difficulty"] = int(difficulty)
        
        if subject:
            filter_conditions.append("subject = :subject")
            expression_values[":subject"] = subject
        
        filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
        
        result = orm.lab_templates.scan(
            filter_expression=filter_expression,
            expression_values=expression_values if expression_values else None,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "templates": [template.to_dict() for template in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get lab templates: {e}"}), 500

@advanced_bp.route("/lab-templates", methods=["POST"])
@require_auth
def create_lab_template():
    """Create lab template"""
    try:
        data = request.get_json()
        
        template_data = {
            "template_type": data.get("template_type"),
            "difficulty": data.get("difficulty", 1),
            "subject": data.get("subject"),
            "name": data.get("name"),
            "description": data.get("description"),
            "content": data.get("content", {}),
            "widgets": data.get("widgets", []),
            "estimated_time": data.get("estimated_time", 30),
            "tags": data.get("tags", [])
        }
        
        template = orm.lab_templates.create(template_data)
        return jsonify({"template": template.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create lab template: {e}"}), 500

# ============================================================================
# WIDGET REGISTRY
# ============================================================================

@advanced_bp.route("/widget-registry", methods=["GET"])
@require_auth
def get_widget_registry():
    """Get widget registry"""
    try:
        widget_type = request.args.get('widget_type')
        domain = request.args.get('domain')
        version = request.args.get('version')
        limit = int(request.args.get('limit', 100))
        
        filter_conditions = []
        expression_values = {}
        
        if widget_type:
            filter_conditions.append("widget_type = :widget_type")
            expression_values[":widget_type"] = widget_type
        
        if domain:
            filter_conditions.append("domain = :domain")
            expression_values[":domain"] = domain
        
        if version:
            filter_conditions.append("version = :version")
            expression_values[":version"] = version
        
        filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
        
        result = orm.widget_registry.scan(
            filter_expression=filter_expression,
            expression_values=expression_values if expression_values else None,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "widgets": [widget.to_dict() for widget in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget registry: {e}"}), 500

@advanced_bp.route("/widget-registry", methods=["POST"])
@require_auth
def create_widget_registry():
    """Create widget registry entry"""
    try:
        data = request.get_json()
        
        widget_data = {
            "widget_type": data.get("widget_type"),
            "domain": data.get("domain"),
            "version": data.get("version", "1.0.0"),
            "name": data.get("name"),
            "description": data.get("description"),
            "config_schema": data.get("config_schema", {}),
            "dependencies": data.get("dependencies", []),
            "is_active": data.get("is_active", True)
        }
        
        widget = orm.widget_registry.create(widget_data)
        return jsonify({"widget": widget.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create widget registry entry: {e}"}), 500

# ============================================================================
# LAB STEPS
# ============================================================================

@advanced_bp.route("/lab-steps", methods=["GET"])
@require_auth
def get_lab_steps():
    """Get lab steps"""
    try:
        lab_id = request.args.get('lab_id')
        step_type = request.args.get('step_type')
        limit = int(request.args.get('limit', 100))
        
        if lab_id:
            result = orm.lab_steps.query(
                index_name="lab-id-index",
                key_condition={"lab_id": lab_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if step_type:
                filter_conditions.append("step_type = :step_type")
                expression_values[":step_type"] = step_type
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.lab_steps.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "steps": [step.to_dict() for step in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get lab steps: {e}"}), 500

@advanced_bp.route("/lab-steps", methods=["POST"])
@require_auth
def create_lab_step():
    """Create lab step"""
    try:
        data = request.get_json()
        
        step_data = {
            "lab_id": data.get("lab_id"),
            "step_order": data.get("step_order"),
            "step_type": data.get("step_type"),
            "title": data.get("title"),
            "content": data.get("content", {}),
            "widgets": data.get("widgets", []),
            "hints": data.get("hints", []),
            "validation": data.get("validation", {}),
            "is_optional": data.get("is_optional", False)
        }
        
        step = orm.lab_steps.create(step_data)
        return jsonify({"step": step.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create lab step: {e}"}), 500

# ============================================================================
# HINTS
# ============================================================================

@advanced_bp.route("/hints", methods=["GET"])
@require_auth
def get_hints():
    """Get hints"""
    try:
        step_id = request.args.get('step_id')
        hint_level = request.args.get('hint_level')
        limit = int(request.args.get('limit', 100))
        
        if step_id:
            result = orm.hints.query(
                index_name="step-id-index",
                key_condition={"step_id": step_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if hint_level:
                filter_conditions.append("hint_level = :hint_level")
                expression_values[":hint_level"] = int(hint_level)
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.hints.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "hints": [hint.to_dict() for hint in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get hints: {e}"}), 500

@advanced_bp.route("/hints", methods=["POST"])
@require_auth
def create_hint():
    """Create hint"""
    try:
        data = request.get_json()
        
        hint_data = {
            "step_id": data.get("step_id"),
            "hint_level": data.get("hint_level"),
            "content": data.get("content"),
            "type": data.get("type", "text"),
            "is_revealed": data.get("is_revealed", False),
            "unlock_condition": data.get("unlock_condition", {})
        }
        
        hint = orm.hints.create(hint_data)
        return jsonify({"hint": hint.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create hint: {e}"}), 500

# ============================================================================
# EDUCATOR CONTENT
# ============================================================================

@advanced_bp.route("/educator-content", methods=["GET"])
@require_auth
def get_educator_content():
    """Get educator content"""
    try:
        educator_id = request.args.get('educator_id')
        content_type = request.args.get('content_type')
        limit = int(request.args.get('limit', 50))
        
        if educator_id:
            result = orm.educator_content.query(
                index_name="educator-id-index",
                key_condition={"educator_id": educator_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if content_type:
                filter_conditions.append("content_type = :content_type")
                expression_values[":content_type"] = content_type
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.educator_content.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "content": [content.to_dict() for content in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get educator content: {e}"}), 500

@advanced_bp.route("/educator-content", methods=["POST"])
@require_auth
def create_educator_content():
    """Create educator content"""
    try:
        data = request.get_json()
        educator_id = request.current_user.get("cognito_user_id")
        
        content_data = {
            "educator_id": educator_id,
            "content_type": data.get("content_type"),
            "title": data.get("title"),
            "description": data.get("description"),
            "content": data.get("content", {}),
            "is_approved": data.get("is_approved", False),
            "tags": data.get("tags", []),
            "difficulty": data.get("difficulty", 1)
        }
        
        content = orm.educator_content.create(content_data)
        return jsonify({"content": content.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create educator content: {e}"}), 500

# ============================================================================
# SYSTEM CONFIGURATION
# ============================================================================

@advanced_bp.route("/system-config", methods=["GET"])
@require_auth
def get_system_config():
    """Get system configuration"""
    try:
        config_category = request.args.get('config_category')
        limit = int(request.args.get('limit', 100))
        
        if config_category:
            result = orm.system_config.query(
                index_name="config-category-index",
                key_condition={"config_category": config_category}
            )
        else:
            result = orm.system_config.scan(pagination=PaginationParams(limit=limit))
        
        return jsonify({
            "config": [config.to_dict() for config in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get system config: {e}"}), 500

@advanced_bp.route("/system-config", methods=["POST"])
@require_auth
def create_system_config():
    """Create system configuration"""
    try:
        data = request.get_json()
        
        config_data = {
            "config_key": data.get("config_key"),
            "config_value": data.get("config_value"),
            "config_category": data.get("config_category"),
            "description": data.get("description"),
            "is_active": data.get("is_active", True)
        }
        
        config = orm.system_config.create(config_data)
        return jsonify({"config": config.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create system config: {e}"}), 500

@advanced_bp.route("/system-config/<config_key>", methods=["PUT"])
@require_auth
def update_system_config(config_key):
    """Update system configuration"""
    try:
        data = request.get_json()
        updated_config = orm.system_config.update(config_key, data)
        return jsonify({"config": updated_config.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update system config: {e}"}), 500

# ============================================================================
# ERROR LOGS
# ============================================================================

@advanced_bp.route("/error-logs", methods=["GET"])
@require_auth
def get_error_logs():
    """Get error logs"""
    try:
        error_type = request.args.get('error_type')
        severity = request.args.get('severity')
        limit = int(request.args.get('limit', 100))
        
        filter_conditions = []
        expression_values = {}
        
        if error_type:
            filter_conditions.append("error_type = :error_type")
            expression_values[":error_type"] = error_type
        
        if severity:
            filter_conditions.append("severity = :severity")
            expression_values[":severity"] = severity
        
        filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
        
        result = orm.error_logs.scan(
            filter_expression=filter_expression,
            expression_values=expression_values if expression_values else None,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "error_logs": [log.to_dict() for log in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get error logs: {e}"}), 500

@advanced_bp.route("/error-logs", methods=["POST"])
@require_auth
def create_error_log():
    """Create error log"""
    try:
        data = request.get_json()
        
        log_data = {
            "error_type": data.get("error_type"),
            "severity": data.get("severity", "info"),
            "message": data.get("message"),
            "user_id": data.get("user_id"),
            "endpoint": data.get("endpoint"),
            "stack_trace": data.get("stack_trace"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        log = orm.error_logs.create(log_data)
        return jsonify({"error_log": log.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create error log: {e}"}), 500
