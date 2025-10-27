#!/usr/bin/env python3
"""
Analytics Routes for Prismo Backend

API routes for analytics, monitoring, and data insights.
"""

from functools import wraps
from flask import Blueprint, jsonify, request
from app.orm_supabase import orm, PaginationParams
from app.auth_service_supabase import auth_service
from datetime import datetime, timedelta
import traceback

# Analytics routes blueprint
analytics_bp = Blueprint("analytics", __name__, url_prefix="/analytics")

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
# WIDGET ANALYTICS
# ============================================================================

@analytics_bp.route("/widget-selection", methods=["GET"])
@require_auth
def get_widget_selection():
    """Get widget selection analytics"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        module_id = request.args.get('module_id')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if module_id:
            filter_conditions.append("module_id = :module_id")
            expression_values[":module_id"] = module_id
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.widget_selection.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "analytics": [item.to_dict() for item in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget selection analytics: {e}"}), 500

@analytics_bp.route("/widget-selection", methods=["POST"])
@require_auth
def track_widget_selection():
    """Track widget selection"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        selection_data = {
            "user_id": user_id,
            "module_id": data.get("module_id"),
            "widget_id": data.get("widget_id"),
            "selected_option": data.get("selected_option"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        selection = orm.widget_selection.create(selection_data)
        return jsonify({"selection": selection.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to track widget selection: {e}"}), 500

# ============================================================================
# FEEDBACK ANALYTICS
# ============================================================================

@analytics_bp.route("/feedback-generated", methods=["GET"])
@require_auth
def get_feedback_generated():
    """Get feedback generation analytics"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        module_id = request.args.get('module_id')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if module_id:
            filter_conditions.append("module_id = :module_id")
            expression_values[":module_id"] = module_id
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.feedback_generated.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "analytics": [item.to_dict() for item in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get feedback analytics: {e}"}), 500

@analytics_bp.route("/feedback-generated", methods=["POST"])
@require_auth
def track_feedback_generated():
    """Track feedback generation"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        feedback_data = {
            "user_id": user_id,
            "module_id": data.get("module_id"),
            "widget_id": data.get("widget_id"),
            "feedback_text": data.get("feedback_text"),
            "rating": data.get("rating"),
            "time_spent": data.get("time_spent"),
            "attempts_taken": data.get("attempts_taken"),
            "module_title": data.get("module_title"),
            "module_description": data.get("module_description"),
            "module_difficulty": data.get("module_difficulty"),
            "module_skills": data.get("module_skills"),
            "estimated_duration": data.get("estimated_duration"),
            "total_widgets": data.get("total_widgets"),
            "completion_percentage": data.get("completion_percentage"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        feedback = orm.feedback_generated.create(feedback_data)
        return jsonify({"feedback": feedback.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to track feedback: {e}"}), 500

# ============================================================================
# LEARNING SESSIONS
# ============================================================================

@analytics_bp.route("/learning-sessions", methods=["GET"])
@require_auth
def get_learning_sessions():
    """Get learning sessions"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        session_date = request.args.get('session_date')
        limit = int(request.args.get('limit', 50))
        
        if session_date:
            result = orm.learning_sessions.query(
                index_name="session-date-index",
                key_condition={"session_date": session_date}
            )
        else:
            result = orm.learning_sessions.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        return jsonify({
            "sessions": [session.to_dict() for session in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get learning sessions: {e}"}), 500

@analytics_bp.route("/learning-sessions", methods=["POST"])
@require_auth
def create_learning_session():
    """Create learning session"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        session_data = {
            "user_id": user_id,
            "session_date": data.get("session_date", datetime.utcnow().strftime("%Y-%m-%d")),
            "duration": data.get("duration"),
            "activities_completed": data.get("activities_completed", 0),
            "skills_practiced": data.get("skills_practiced", []),
            "session_type": data.get("session_type", "practice"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        session = orm.learning_sessions.create(session_data)
        return jsonify({"session": session.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create learning session: {e}"}), 500

# ============================================================================
# SKILL PROGRESS
# ============================================================================

@analytics_bp.route("/skill-progress", methods=["GET"])
@require_auth
def get_skill_progress():
    """Get skill progress"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        skill_tag = request.args.get('skill_tag')
        limit = int(request.args.get('limit', 50))
        
        if skill_tag:
            result = orm.skill_progress.query(
                index_name="skill-tag-index",
                key_condition={"skill_tag": skill_tag}
            )
        else:
            result = orm.skill_progress.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        return jsonify({
            "progress": [progress.to_dict() for progress in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get skill progress: {e}"}), 500

@analytics_bp.route("/skill-progress", methods=["POST"])
@require_auth
def update_skill_progress():
    """Update skill progress"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        progress_data = {
            "user_id": user_id,
            "skill_tag": data.get("skill_tag"),
            "progress_percentage": data.get("progress_percentage"),
            "level": data.get("level"),
            "last_practiced": data.get("last_practiced", datetime.utcnow().isoformat()),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        progress = orm.skill_progress.create(progress_data)
        return jsonify({"progress": progress.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to update skill progress: {e}"}), 500

# ============================================================================
# API USAGE ANALYTICS
# ============================================================================

@analytics_bp.route("/api-usage", methods=["GET"])
@require_auth
def get_api_usage():
    """Get API usage analytics"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        endpoint = request.args.get('endpoint')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if endpoint:
            filter_conditions.append("endpoint = :endpoint")
            expression_values[":endpoint"] = endpoint
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.api_usage.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "usage": [usage.to_dict() for usage in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get API usage: {e}"}), 500

@analytics_bp.route("/api-usage", methods=["POST"])
@require_auth
def track_api_usage():
    """Track API usage"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        usage_data = {
            "user_id": user_id,
            "endpoint": data.get("endpoint"),
            "method": data.get("method"),
            "response_time": data.get("response_time"),
            "status_code": data.get("status_code"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        usage = orm.api_usage.create(usage_data)
        return jsonify({"usage": usage.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to track API usage: {e}"}), 500

# ============================================================================
# DASHBOARD ANALYTICS
# ============================================================================

@analytics_bp.route("/dashboard", methods=["GET"])
@require_auth
def get_dashboard_analytics():
    """Get dashboard analytics for user"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        
        # Get user's recent activity
        recent_sessions = orm.learning_sessions.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        
        # Get skill progress
        skill_progress = orm.skill_progress.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        
        # Get recent attempts
        recent_attempts = orm.attempts.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        
        # Calculate statistics
        total_sessions = len(recent_sessions.items)
        total_skills = len(skill_progress.items)
        completed_attempts = len([a for a in recent_attempts.items if a.status == "completed"])
        
        # Get mastery levels
        mastery_levels = {}
        for progress in skill_progress.items:
            mastery_levels[progress.skill_tag] = progress.level
        
        dashboard_data = {
            "user_id": user_id,
            "total_sessions": total_sessions,
            "total_skills": total_skills,
            "completed_attempts": completed_attempts,
            "mastery_levels": mastery_levels,
            "recent_sessions": [session.to_dict() for session in recent_sessions.items[:5]],
            "skill_progress": [progress.to_dict() for progress in skill_progress.items],
            "recent_attempts": [attempt.to_dict() for attempt in recent_attempts.items[:5]]
        }
        
        return jsonify({"dashboard": dashboard_data}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get dashboard analytics: {e}"}), 500

# ============================================================================
# WIDGET INTERACTION TRACKING
# ============================================================================

@analytics_bp.route("/widget-interactions", methods=["POST"])
@require_auth
def track_widget_interaction():
    """Track widget interaction"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        interaction_data = {
            "user_id": user_id,
            "module_id": data.get("module_id"),
            "widget_id": data.get("widget_id"),
            "interaction_type": data.get("interaction_type"),
            "interaction_data": data.get("interaction_data", {}),
            "time_spent": data.get("time_spent", 0),
            "attempts": data.get("attempts", 0),
            "is_successful": data.get("is_successful", False),
            "error_message": data.get("error_message", ""),
            "session_id": data.get("session_id", "")
        }
        
        interaction = orm.widget_interactions.create(interaction_data)
        return jsonify({"interaction": interaction.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to track widget interaction: {e}"}), 500

@analytics_bp.route("/widget-interactions", methods=["GET"])
@require_auth
def get_widget_interactions():
    """Get widget interactions"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        module_id = request.args.get('module_id')
        widget_id = request.args.get('widget_id')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if module_id:
            filter_conditions.append("module_id = :module_id")
            expression_values[":module_id"] = module_id
            
        if widget_id:
            filter_conditions.append("widget_id = :widget_id")
            expression_values[":widget_id"] = widget_id
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.widget_interactions.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "interactions": [interaction.to_dict() for interaction in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget interactions: {e}"}), 500

@analytics_bp.route("/widget-sessions", methods=["POST"])
@require_auth
def create_widget_session():
    """Create widget session"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        session_data = {
            "user_id": user_id,
            "module_id": data.get("module_id"),
            "session_id": data.get("session_id"),
            "total_widgets": data.get("total_widgets", 0),
            "session_data": data.get("session_data", {})
        }
        
        session = orm.widget_sessions.create(session_data)
        return jsonify({"session": session.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create widget session: {e}"}), 500

@analytics_bp.route("/widget-sessions/<session_id>", methods=["PUT"])
@require_auth
def update_widget_session(session_id):
    """Update widget session"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        # Find the session
        sessions = orm.widget_sessions.scan(
            filter_expression="session_id = :session_id AND user_id = :user_id",
            expression_values={":session_id": session_id, ":user_id": user_id}
        )
        
        if not sessions.items:
            return jsonify({"error": "Session not found"}), 404
            
        session = sessions.items[0]
        
        # Update session data
        updates = {
            "end_time": data.get("end_time", datetime.utcnow().isoformat()),
            "total_time": data.get("total_time", session.total_time),
            "widgets_completed": data.get("widgets_completed", session.widgets_completed),
            "completion_percentage": data.get("completion_percentage", session.completion_percentage),
            "is_completed": data.get("is_completed", session.is_completed),
            "session_data": data.get("session_data", session.session_data)
        }
        
        updated_session = orm.widget_sessions.update(session.id, updates)
        return jsonify({"session": updated_session.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update widget session: {e}"}), 500

@analytics_bp.route("/widget-sessions", methods=["GET"])
@require_auth
def get_widget_sessions():
    """Get widget sessions"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        module_id = request.args.get('module_id')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if module_id:
            filter_conditions.append("module_id = :module_id")
            expression_values[":module_id"] = module_id
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.widget_sessions.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "sessions": [session.to_dict() for session in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget sessions: {e}"}), 500

@analytics_bp.route("/widget-performance", methods=["POST"])
@require_auth
def update_widget_performance():
    """Update widget performance metrics"""
    try:
        data = request.get_json()
        
        # Check if performance record exists
        existing = orm.widget_performance.scan(
            filter_expression="widget_id = :widget_id",
            expression_values={":widget_id": data.get("widget_id")}
        )
        
        if existing.items:
            # Update existing record
            performance = existing.items[0]
            updates = {
                "total_interactions": data.get("total_interactions", performance.total_interactions),
                "successful_interactions": data.get("successful_interactions", performance.successful_interactions),
                "average_time": data.get("average_time", performance.average_time),
                "average_attempts": data.get("average_attempts", performance.average_attempts),
                "error_rate": data.get("error_rate", performance.error_rate),
                "difficulty_score": data.get("difficulty_score", performance.difficulty_score),
                "user_satisfaction": data.get("user_satisfaction", performance.user_satisfaction),
                "last_updated": datetime.utcnow().isoformat()
            }
            performance = orm.widget_performance.update(performance.id, updates)
        else:
            # Create new record
            performance_data = {
                "widget_id": data.get("widget_id"),
                "widget_type": data.get("widget_type", ""),
                "module_id": data.get("module_id", ""),
                "total_interactions": data.get("total_interactions", 0),
                "successful_interactions": data.get("successful_interactions", 0),
                "average_time": data.get("average_time", 0.0),
                "average_attempts": data.get("average_attempts", 0.0),
                "error_rate": data.get("error_rate", 0.0),
                "difficulty_score": data.get("difficulty_score", 0.0),
                "user_satisfaction": data.get("user_satisfaction", 0.0)
            }
            performance = orm.widget_performance.create(performance_data)
        
        return jsonify({"performance": performance.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update widget performance: {e}"}), 500

@analytics_bp.route("/widget-performance", methods=["GET"])
@require_auth
def get_widget_performance():
    """Get widget performance metrics"""
    try:
        widget_id = request.args.get('widget_id')
        module_id = request.args.get('module_id')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = []
        expression_values = {}
        
        if widget_id:
            filter_conditions.append("widget_id = :widget_id")
            expression_values[":widget_id"] = widget_id
            
        if module_id:
            filter_conditions.append("module_id = :module_id")
            expression_values[":module_id"] = module_id
        
        if filter_conditions:
            filter_expression = " AND ".join(filter_conditions)
            result = orm.widget_performance.scan(
                filter_expression=filter_expression,
                expression_values=expression_values,
                pagination=PaginationParams(limit=limit)
            )
        else:
            result = orm.widget_performance.scan(pagination=PaginationParams(limit=limit))
        
        return jsonify({
            "performance": [perf.to_dict() for perf in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget performance: {e}"}), 500

@analytics_bp.route("/widget-usage", methods=["POST"])
@require_auth
def update_widget_usage():
    """Update widget usage statistics"""
    try:
        data = request.get_json()
        
        # Check if usage record exists
        existing = orm.widget_usage.scan(
            filter_expression="widget_id = :widget_id",
            expression_values={":widget_id": data.get("widget_id")}
        )
        
        if existing.items:
            # Update existing record
            usage = existing.items[0]
            updates = {
                "total_users": data.get("total_users", usage.total_users),
                "total_sessions": data.get("total_sessions", usage.total_sessions),
                "total_interactions": data.get("total_interactions", usage.total_interactions),
                "average_session_time": data.get("average_session_time", usage.average_session_time),
                "completion_rate": data.get("completion_rate", usage.completion_rate),
                "popularity_score": data.get("popularity_score", usage.popularity_score),
                "last_used": datetime.utcnow().isoformat()
            }
            usage = orm.widget_usage.update(usage.id, updates)
        else:
            # Create new record
            usage_data = {
                "widget_id": data.get("widget_id"),
                "widget_type": data.get("widget_type", ""),
                "total_users": data.get("total_users", 0),
                "total_sessions": data.get("total_sessions", 0),
                "total_interactions": data.get("total_interactions", 0),
                "average_session_time": data.get("average_session_time", 0.0),
                "completion_rate": data.get("completion_rate", 0.0),
                "popularity_score": data.get("popularity_score", 0.0)
            }
            usage = orm.widget_usage.create(usage_data)
        
        return jsonify({"usage": usage.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update widget usage: {e}"}), 500

@analytics_bp.route("/widget-usage", methods=["GET"])
@require_auth
def get_widget_usage():
    """Get widget usage statistics"""
    try:
        widget_id = request.args.get('widget_id')
        limit = int(request.args.get('limit', 50))
        
        if widget_id:
            result = orm.widget_usage.scan(
                filter_expression="widget_id = :widget_id",
                expression_values={":widget_id": widget_id},
                pagination=PaginationParams(limit=limit)
            )
        else:
            result = orm.widget_usage.scan(pagination=PaginationParams(limit=limit))
        
        return jsonify({
            "usage": [usage.to_dict() for usage in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get widget usage: {e}"}), 500

# ============================================================================
# INSIGHTS AND RECOMMENDATIONS
# ============================================================================

@analytics_bp.route("/insights", methods=["GET"])
@require_auth
def get_learning_insights():
    """Get learning insights and recommendations"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        
        # Get user's skill progress
        skill_progress = orm.skill_progress.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        
        # Get recent attempts
        recent_attempts = orm.attempts.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        
        # Analyze learning patterns
        insights = {
            "strengths": [],
            "weaknesses": [],
            "recommendations": [],
            "learning_velocity": 0,
            "consistency_score": 0
        }
        
        # Identify strengths and weaknesses
        for progress in skill_progress.items:
            if progress.level == "proficient":
                insights["strengths"].append(progress.skill_tag)
            elif progress.level == "learning":
                insights["weaknesses"].append(progress.skill_tag)
        
        # Generate recommendations
        if insights["weaknesses"]:
            insights["recommendations"].append({
                "type": "practice",
                "message": f"Focus on practicing: {', '.join(insights['weaknesses'][:3])}",
                "priority": "high"
            })
        
        if insights["strengths"]:
            insights["recommendations"].append({
                "type": "advance",
                "message": f"Ready to advance in: {', '.join(insights['strengths'][:3])}",
                "priority": "medium"
            })
        
        return jsonify({"insights": insights}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get learning insights: {e}"}), 500
