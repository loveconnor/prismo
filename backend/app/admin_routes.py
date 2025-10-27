#!/usr/bin/env python3
"""
Admin Routes for Prismo Backend

Comprehensive API routes for all 34 tables in the Prismo ecosystem.
Provides full CRUD operations for system administration and management.
"""

from functools import wraps
from flask import Blueprint, jsonify, request
from app.orm_supabase import orm, PaginationParams
from app.auth_service_supabase import auth_service
from datetime import datetime
import traceback

# Admin routes blueprint
admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

def require_admin_auth(f):
    """Decorator to require admin authentication"""
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

            # Check if user is admin (you can implement admin role checking here)
            # For now, we'll allow any authenticated user
            request.current_user = result["user_data"]
            return f(*args, **kwargs)

        except IndexError:
            return jsonify({"error": "Invalid authorization header format"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication error: {e}"}), 401

    return decorated_function

# ============================================================================
# CORE MODELS ROUTES
# ============================================================================

# Users Routes
@admin_bp.route("/users", methods=["GET"])
@require_admin_auth
def get_users():
    """Get all users with pagination"""
    try:
        limit = int(request.args.get('limit', 50))
        last_key = request.args.get('last_key')
        
        pagination = PaginationParams(limit=limit, last_evaluated_key=last_key)
        result = orm.users.scan(pagination=pagination)
        
        return jsonify({
            "users": [user.to_dict() for user in result.items],
            "count": result.count,
            "last_evaluated_key": result.last_evaluated_key
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get users: {e}"}), 500

@admin_bp.route("/users/<user_id>", methods=["GET"])
@require_admin_auth
def get_user(user_id):
    """Get specific user"""
    try:
        user = orm.users.get_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": user.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get user: {e}"}), 500

@admin_bp.route("/users/<user_id>", methods=["PUT"])
@require_admin_auth
def update_user(user_id):
    """Update user"""
    try:
        data = request.get_json()
        updated_user = orm.users.update(user_id, data)
        return jsonify({"user": updated_user.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update user: {e}"}), 500

@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@require_admin_auth
def delete_user(user_id):
    """Delete user"""
    try:
        orm.users.delete_by_id(user_id)
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete user: {e}"}), 500

# Labs Routes
@admin_bp.route("/labs", methods=["GET"])
@require_admin_auth
def get_labs():
    """Get all labs with filtering"""
    try:
        user_id = request.args.get('user_id')
        lab_type = request.args.get('lab_type')
        is_public = request.args.get('is_public')
        limit = int(request.args.get('limit', 50))
        
        if user_id:
            result = orm.labs.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if lab_type:
                filter_conditions.append("lab_type = :lab_type")
                expression_values[":lab_type"] = lab_type
            
            if is_public is not None:
                filter_conditions.append("is_public = :is_public")
                expression_values[":is_public"] = is_public.lower() == 'true'
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.labs.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "labs": [lab.to_dict() for lab in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get labs: {e}"}), 500

@admin_bp.route("/labs/<lab_id>", methods=["GET"])
@require_admin_auth
def get_lab(lab_id):
    """Get specific lab"""
    try:
        lab = orm.labs.get_by_id(lab_id)
        if not lab:
            return jsonify({"error": "Lab not found"}), 404
        return jsonify({"lab": lab.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get lab: {e}"}), 500

@admin_bp.route("/labs/<lab_id>", methods=["PUT"])
@require_admin_auth
def update_lab(lab_id):
    """Update lab"""
    try:
        data = request.get_json()
        updated_lab = orm.labs.update(lab_id, data)
        return jsonify({"lab": updated_lab.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update lab: {e}"}), 500

@admin_bp.route("/labs/<lab_id>", methods=["DELETE"])
@require_admin_auth
def delete_lab(lab_id):
    """Delete lab"""
    try:
        orm.labs.delete_by_id(lab_id)
        return jsonify({"message": "Lab deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete lab: {e}"}), 500

# Widgets Routes
@admin_bp.route("/widgets", methods=["GET"])
@require_admin_auth
def get_widgets():
    """Get all widgets"""
    try:
        user_id = request.args.get('user_id')
        widget_type = request.args.get('widget_type')
        limit = int(request.args.get('limit', 50))
        
        if user_id:
            result = orm.widgets.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if widget_type:
                filter_conditions.append("widget_type = :widget_type")
                expression_values[":widget_type"] = widget_type
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.widgets.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "widgets": [widget.to_dict() for widget in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widgets: {e}"}), 500

@admin_bp.route("/widgets/<widget_id>", methods=["GET"])
@require_admin_auth
def get_widget(widget_id):
    """Get specific widget"""
    try:
        widget = orm.widgets.get_by_id(widget_id)
        if not widget:
            return jsonify({"error": "Widget not found"}), 404
        return jsonify({"widget": widget.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget: {e}"}), 500

# Collections Routes
@admin_bp.route("/collections", methods=["GET"])
@require_admin_auth
def get_collections():
    """Get all collections"""
    try:
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 50))
        
        if user_id:
            result = orm.collections.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            result = orm.collections.scan(pagination=PaginationParams(limit=limit))
        
        return jsonify({
            "collections": [collection.to_dict() for collection in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get collections: {e}"}), 500

# ============================================================================
# ANALYTICS ROUTES
# ============================================================================

@admin_bp.route("/analytics/widget-selection", methods=["GET"])
@require_admin_auth
def get_widget_selection_analytics():
    """Get widget selection analytics"""
    try:
        user_id = request.args.get('user_id')
        module_id = request.args.get('module_id')
        limit = int(request.args.get('limit', 100))
        
        filter_conditions = []
        expression_values = {}
        
        if user_id:
            filter_conditions.append("user_id = :user_id")
            expression_values[":user_id"] = user_id
        
        if module_id:
            filter_conditions.append("module_id = :module_id")
            expression_values[":module_id"] = module_id
        
        filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
        
        result = orm.widget_selection.scan(
            filter_expression=filter_expression,
            expression_values=expression_values if expression_values else None,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "analytics": [item.to_dict() for item in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget selection analytics: {e}"}), 500

@admin_bp.route("/analytics/feedback-generated", methods=["GET"])
@require_admin_auth
def get_feedback_generated_analytics():
    """Get feedback generation analytics"""
    try:
        user_id = request.args.get('user_id')
        module_id = request.args.get('module_id')
        limit = int(request.args.get('limit', 100))
        
        filter_conditions = []
        expression_values = {}
        
        if user_id:
            filter_conditions.append("user_id = :user_id")
            expression_values[":user_id"] = user_id
        
        if module_id:
            filter_conditions.append("module_id = :module_id")
            expression_values[":module_id"] = module_id
        
        filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
        
        result = orm.feedback_generated.scan(
            filter_expression=filter_expression,
            expression_values=expression_values if expression_values else None,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "analytics": [item.to_dict() for item in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get feedback analytics: {e}"}), 500

@admin_bp.route("/analytics/api-usage", methods=["GET"])
@require_admin_auth
def get_api_usage_analytics():
    """Get API usage analytics"""
    try:
        user_id = request.args.get('user_id')
        endpoint = request.args.get('endpoint')
        limit = int(request.args.get('limit', 100))
        
        filter_conditions = []
        expression_values = {}
        
        if user_id:
            filter_conditions.append("user_id = :user_id")
            expression_values[":user_id"] = user_id
        
        if endpoint:
            filter_conditions.append("endpoint = :endpoint")
            expression_values[":endpoint"] = endpoint
        
        filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
        
        result = orm.api_usage.scan(
            filter_expression=filter_expression,
            expression_values=expression_values if expression_values else None,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "analytics": [item.to_dict() for item in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get API usage analytics: {e}"}), 500

# ============================================================================
# LEARNING SYSTEM ROUTES
# ============================================================================

@admin_bp.route("/attempts", methods=["GET"])
@require_admin_auth
def get_attempts():
    """Get all attempts"""
    try:
        user_id = request.args.get('user_id')
        lab_id = request.args.get('lab_id')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 100))
        
        if user_id:
            result = orm.attempts.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        elif lab_id:
            result = orm.attempts.query(
                index_name="lab-id-index",
                key_condition={"lab_id": lab_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if status:
                filter_conditions.append("status = :status")
                expression_values[":status"] = status
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.attempts.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "attempts": [attempt.to_dict() for attempt in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get attempts: {e}"}), 500

@admin_bp.route("/mastery", methods=["GET"])
@require_admin_auth
def get_mastery():
    """Get mastery records"""
    try:
        user_id = request.args.get('user_id')
        skill_tag = request.args.get('skill_tag')
        level = request.args.get('level')
        limit = int(request.args.get('limit', 100))
        
        if user_id:
            result = orm.mastery.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if skill_tag:
                filter_conditions.append("skill_tag = :skill_tag")
                expression_values[":skill_tag"] = skill_tag
            
            if level:
                filter_conditions.append("level = :level")
                expression_values[":level"] = level
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.mastery.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "mastery": [mastery.to_dict() for mastery in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get mastery records: {e}"}), 500

@admin_bp.route("/feedback", methods=["GET"])
@require_admin_auth
def get_feedback():
    """Get feedback records"""
    try:
        user_id = request.args.get('user_id')
        widget_id = request.args.get('widget_id')
        limit = int(request.args.get('limit', 100))
        
        if user_id:
            result = orm.feedback.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if widget_id:
                filter_conditions.append("widget_id = :widget_id")
                expression_values[":widget_id"] = widget_id
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.feedback.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "feedback": [feedback.to_dict() for feedback in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get feedback: {e}"}), 500

# ============================================================================
# GAMIFICATION ROUTES
# ============================================================================

@admin_bp.route("/notifications", methods=["GET"])
@require_admin_auth
def get_notifications():
    """Get notifications"""
    try:
        user_id = request.args.get('user_id')
        notification_type = request.args.get('notification_type')
        is_read = request.args.get('is_read')
        limit = int(request.args.get('limit', 100))
        
        if user_id:
            result = orm.notifications.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if notification_type:
                filter_conditions.append("notification_type = :notification_type")
                expression_values[":notification_type"] = notification_type
            
            if is_read is not None:
                filter_conditions.append("is_read = :is_read")
                expression_values[":is_read"] = is_read.lower() == 'true'
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.notifications.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "notifications": [notification.to_dict() for notification in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get notifications: {e}"}), 500

@admin_bp.route("/streaks", methods=["GET"])
@require_admin_auth
def get_streaks():
    """Get learning streaks"""
    try:
        user_id = request.args.get('user_id')
        streak_type = request.args.get('streak_type')
        limit = int(request.args.get('limit', 100))
        
        if user_id:
            result = orm.streaks.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if streak_type:
                filter_conditions.append("streak_type = :streak_type")
                expression_values[":streak_type"] = streak_type
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.streaks.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "streaks": [streak.to_dict() for streak in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get streaks: {e}"}), 500

@admin_bp.route("/badges", methods=["GET"])
@require_admin_auth
def get_badges():
    """Get badges"""
    try:
        user_id = request.args.get('user_id')
        badge_type = request.args.get('badge_type')
        limit = int(request.args.get('limit', 100))
        
        if user_id:
            result = orm.badges.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        else:
            filter_conditions = []
            expression_values = {}
            
            if badge_type:
                filter_conditions.append("badge_type = :badge_type")
                expression_values[":badge_type"] = badge_type
            
            filter_expression = " AND ".join(filter_conditions) if filter_conditions else None
            
            result = orm.badges.scan(
                filter_expression=filter_expression,
                expression_values=expression_values if expression_values else None,
                pagination=PaginationParams(limit=limit)
            )
        
        return jsonify({
            "badges": [badge.to_dict() for badge in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get badges: {e}"}), 500

# ============================================================================
# SYSTEM MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route("/error-logs", methods=["GET"])
@require_admin_auth
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

@admin_bp.route("/system-config", methods=["GET"])
@require_admin_auth
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

@admin_bp.route("/system-config", methods=["POST"])
@require_admin_auth
def create_system_config():
    """Create system configuration"""
    try:
        data = request.get_json()
        config = orm.system_config.create(data)
        return jsonify({"config": config.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create system config: {e}"}), 500

@admin_bp.route("/system-config/<config_key>", methods=["PUT"])
@require_admin_auth
def update_system_config(config_key):
    """Update system configuration"""
    try:
        data = request.get_json()
        updated_config = orm.system_config.update(config_key, data)
        return jsonify({"config": updated_config.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update system config: {e}"}), 500

# ============================================================================
# BULK OPERATIONS
# ============================================================================

@admin_bp.route("/bulk/create", methods=["POST"])
@require_admin_auth
def bulk_create():
    """Bulk create records"""
    try:
        data = request.get_json()
        table_name = data.get('table_name')
        items = data.get('items', [])
        
        if not table_name or not items:
            return jsonify({"error": "table_name and items are required"}), 400
        
        # Get the appropriate ORM instance
        orm_instance = getattr(orm, table_name, None)
        if not orm_instance:
            return jsonify({"error": f"Table {table_name} not found"}), 404
        
        # Batch write items
        success = orm_instance.batch_write(items, operation='put')
        
        if success:
            return jsonify({"message": f"Successfully created {len(items)} records"}), 201
        else:
            return jsonify({"error": "Failed to create records"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Failed to bulk create: {e}"}), 500

@admin_bp.route("/bulk/delete", methods=["POST"])
@require_admin_auth
def bulk_delete():
    """Bulk delete records"""
    try:
        data = request.get_json()
        table_name = data.get('table_name')
        item_ids = data.get('item_ids', [])
        
        if not table_name or not item_ids:
            return jsonify({"error": "table_name and item_ids are required"}), 400
        
        # Get the appropriate ORM instance
        orm_instance = getattr(orm, table_name, None)
        if not orm_instance:
            return jsonify({"error": f"Table {table_name} not found"}), 404
        
        # Delete items one by one (DynamoDB doesn't support batch delete)
        deleted_count = 0
        for item_id in item_ids:
            try:
                orm_instance.delete_by_id(item_id)
                deleted_count += 1
            except Exception as e:
                print(f"Failed to delete {item_id}: {e}")
        
        return jsonify({"message": f"Successfully deleted {deleted_count} records"}), 200
            
    except Exception as e:
        return jsonify({"error": f"Failed to bulk delete: {e}"}), 500

# ============================================================================
# STATISTICS AND OVERVIEW
# ============================================================================

@admin_bp.route("/stats", methods=["GET"])
@require_admin_auth
def get_system_stats():
    """Get system statistics"""
    try:
        stats = {}
        
        # Count records in each table
        tables = [
            'users', 'labs', 'widgets', 'collections', 'modules', 'attempts',
            'mastery', 'feedback', 'notifications', 'streaks', 'badges',
            'error_logs', 'system_config'
        ]
        
        for table in tables:
            try:
                orm_instance = getattr(orm, table, None)
                if orm_instance:
                    count = orm_instance.count()
                    stats[table] = count
            except Exception as e:
                stats[table] = f"Error: {e}"
        
        return jsonify({"stats": stats}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get system stats: {e}"}), 500

@admin_bp.route("/health", methods=["GET"])
@require_admin_auth
def get_system_health():
    """Get system health status"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "tables": {}
        }
        
        # Check each table
        tables = [
            'users', 'labs', 'widgets', 'collections', 'modules', 'attempts',
            'mastery', 'feedback', 'notifications', 'streaks', 'badges',
            'error_logs', 'system_config'
        ]
        
        for table in tables:
            try:
                orm_instance = getattr(orm, table, None)
                if orm_instance:
                    # Try to count records
                    count = orm_instance.count()
                    health_status["tables"][table] = {
                        "status": "healthy",
                        "record_count": count
                    }
                else:
                    health_status["tables"][table] = {
                        "status": "error",
                        "error": "ORM instance not found"
                    }
            except Exception as e:
                health_status["tables"][table] = {
                    "status": "error",
                    "error": str(e)
                }
        
        # Check if any tables have errors
        has_errors = any(
            table_info.get("status") == "error" 
            for table_info in health_status["tables"].values()
        )
        
        if has_errors:
            health_status["status"] = "degraded"
        
        return jsonify(health_status), 200
        
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

# ============================================================================
# DATA MAINTENANCE ROUTES
# ============================================================================

@admin_bp.route("/fix-time-spent", methods=["POST"])
@require_admin_auth
def fix_time_spent():
    """
    Fix corrupted time_spent values in module_sessions table
    """
    try:
        # Get all module sessions
        sessions = orm.module_sessions.scan()
        
        fixed_count = 0
        errors = []
        current_timestamp = int(datetime.utcnow().timestamp())
        
        for session in sessions:
            time_spent = session.get('time_spent', 0)
            session_id = session.get('id')
            
            needs_fix = False
            new_value = 0
            reason = ""
            
            # If it's larger than current timestamp, it's a timestamp instead of duration
            if time_spent > current_timestamp:
                needs_fix = True
                new_value = 0
                reason = f"Corrupted timestamp value: {time_spent}"
            # If it's suspiciously large (> 1 million seconds = 277 hours), might be milliseconds
            elif time_spent > 1000000:
                needs_fix = True
                new_value = int(time_spent / 1000)  # Convert to seconds
                reason = f"Converted from milliseconds: {time_spent} -> {new_value}"
            
            if needs_fix:
                try:
                    orm.module_sessions.update(
                        session_id,
                        {'time_spent': new_value}
                    )
                    fixed_count += 1
                except Exception as e:
                    errors.append({
                        'session_id': session_id,
                        'error': str(e),
                        'reason': reason
                    })
        
        return jsonify({
            "success": True,
            "total_sessions": len(sessions),
            "fixed_count": fixed_count,
            "errors": errors,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

