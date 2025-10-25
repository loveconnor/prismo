#!/usr/bin/env python3
"""
Analytics Routes for Prismo Backend

API routes for analytics, monitoring, and data insights.
"""

from functools import wraps
from flask import Blueprint, jsonify, request
from app.orm import orm, PaginationParams
from app.auth_service import auth_service
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
