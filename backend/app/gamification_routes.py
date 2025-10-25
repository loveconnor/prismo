#!/usr/bin/env python3
"""
Gamification Routes for Prismo Backend

API routes for gamification features including notifications, streaks, badges, and user preferences.
"""

from functools import wraps
from flask import Blueprint, jsonify, request
from app.orm import orm, PaginationParams
from app.auth_service import auth_service
from datetime import datetime, timedelta
import traceback

# Gamification routes blueprint
gamification_bp = Blueprint("gamification", __name__, url_prefix="/gamification")

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
# NOTIFICATIONS
# ============================================================================

@gamification_bp.route("/notifications", methods=["GET"])
@require_auth
def get_notifications():
    """Get user notifications"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        notification_type = request.args.get('notification_type')
        is_read = request.args.get('is_read')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if notification_type:
            filter_conditions.append("notification_type = :notification_type")
            expression_values[":notification_type"] = notification_type
        
        if is_read is not None:
            filter_conditions.append("is_read = :is_read")
            expression_values[":is_read"] = is_read.lower() == 'true'
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.notifications.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "notifications": [notification.to_dict() for notification in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get notifications: {e}"}), 500

@gamification_bp.route("/notifications", methods=["POST"])
@require_auth
def create_notification():
    """Create notification"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        notification_data = {
            "user_id": user_id,
            "notification_type": data.get("notification_type"),
            "title": data.get("title"),
            "message": data.get("message"),
            "is_read": data.get("is_read", False),
            "priority": data.get("priority", "medium"),
            "action_url": data.get("action_url"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        notification = orm.notifications.create(notification_data)
        return jsonify({"notification": notification.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create notification: {e}"}), 500

@gamification_bp.route("/notifications/<notification_id>", methods=["PUT"])
@require_auth
def update_notification(notification_id):
    """Update notification (mark as read)"""
    try:
        data = request.get_json()
        updated_notification = orm.notifications.update(notification_id, data)
        return jsonify({"notification": updated_notification.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update notification: {e}"}), 500

@gamification_bp.route("/notifications/<notification_id>", methods=["DELETE"])
@require_auth
def delete_notification(notification_id):
    """Delete notification"""
    try:
        orm.notifications.delete_by_id(notification_id)
        return jsonify({"message": "Notification deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete notification: {e}"}), 500

# ============================================================================
# STREAKS
# ============================================================================

@gamification_bp.route("/streaks", methods=["GET"])
@require_auth
def get_streaks():
    """Get user streaks"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        streak_type = request.args.get('streak_type')
        limit = int(request.args.get('limit', 10))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if streak_type:
            filter_conditions.append("streak_type = :streak_type")
            expression_values[":streak_type"] = streak_type
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.streaks.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "streaks": [streak.to_dict() for streak in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get streaks: {e}"}), 500

@gamification_bp.route("/streaks", methods=["POST"])
@require_auth
def create_streak():
    """Create or update streak"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        streak_data = {
            "user_id": user_id,
            "streak_type": data.get("streak_type"),
            "current_streak": data.get("current_streak", 1),
            "longest_streak": data.get("longest_streak", 1),
            "last_activity": datetime.utcnow().isoformat(),
            "streak_start_date": data.get("streak_start_date", datetime.utcnow().isoformat())
        }
        
        streak = orm.streaks.create(streak_data)
        return jsonify({"streak": streak.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create streak: {e}"}), 500

@gamification_bp.route("/streaks/<streak_id>", methods=["PUT"])
@require_auth
def update_streak(streak_id):
    """Update streak"""
    try:
        data = request.get_json()
        updated_streak = orm.streaks.update(streak_id, data)
        return jsonify({"streak": updated_streak.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update streak: {e}"}), 500

# ============================================================================
# BADGES
# ============================================================================

@gamification_bp.route("/badges", methods=["GET"])
@require_auth
def get_badges():
    """Get user badges"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        badge_type = request.args.get('badge_type')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if badge_type:
            filter_conditions.append("badge_type = :badge_type")
            expression_values[":badge_type"] = badge_type
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.badges.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "badges": [badge.to_dict() for badge in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get badges: {e}"}), 500

@gamification_bp.route("/badges", methods=["POST"])
@require_auth
def create_badge():
    """Create badge"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        badge_data = {
            "user_id": user_id,
            "badge_type": data.get("badge_type"),
            "title": data.get("title"),
            "description": data.get("description"),
            "icon": data.get("icon"),
            "color": data.get("color"),
            "rarity": data.get("rarity", "common"),
            "earned_at": datetime.utcnow().isoformat()
        }
        
        badge = orm.badges.create(badge_data)
        return jsonify({"badge": badge.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create badge: {e}"}), 500

@gamification_bp.route("/badges/<badge_id>", methods=["GET"])
@require_auth
def get_badge(badge_id):
    """Get specific badge"""
    try:
        badge = orm.badges.get_by_id(badge_id)
        if not badge:
            return jsonify({"error": "Badge not found"}), 404
        return jsonify({"badge": badge.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get badge: {e}"}), 500

# ============================================================================
# USER PREFERENCES
# ============================================================================

@gamification_bp.route("/preferences", methods=["GET"])
@require_auth
def get_user_preferences():
    """Get user preferences"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        
        preferences = orm.user_preferences.get_by_key({"user_id": user_id})
        if not preferences:
            return jsonify({"preferences": {}}), 200
        
        return jsonify({"preferences": preferences.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get user preferences: {e}"}), 500

@gamification_bp.route("/preferences", methods=["POST"])
@require_auth
def create_user_preferences():
    """Create user preferences"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        preferences_data = {
            "user_id": user_id,
            "preference_type": data.get("preference_type", "general"),
            "preferences": data.get("preferences", {}),
            "theme": data.get("theme", "light"),
            "language": data.get("language", "en"),
            "notifications": data.get("notifications", True),
            "accessibility": data.get("accessibility", {})
        }
        
        preferences = orm.user_preferences.create(preferences_data)
        return jsonify({"preferences": preferences.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create user preferences: {e}"}), 500

@gamification_bp.route("/preferences", methods=["PUT"])
@require_auth
def update_user_preferences():
    """Update user preferences"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        updated_preferences = orm.user_preferences.update(user_id, data)
        return jsonify({"preferences": updated_preferences.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update user preferences: {e}"}), 500

# ============================================================================
# ACCESSIBILITY SETTINGS
# ============================================================================

@gamification_bp.route("/accessibility", methods=["GET"])
@require_auth
def get_accessibility_settings():
    """Get accessibility settings"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        
        settings = orm.accessibility_settings.get_by_key({"user_id": user_id})
        if not settings:
            return jsonify({"accessibility": {}}), 200
        
        return jsonify({"accessibility": settings.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get accessibility settings: {e}"}), 500

@gamification_bp.route("/accessibility", methods=["POST"])
@require_auth
def create_accessibility_settings():
    """Create accessibility settings"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        settings_data = {
            "user_id": user_id,
            "setting_type": data.get("setting_type", "general"),
            "font_size": data.get("font_size", "medium"),
            "color_contrast": data.get("color_contrast", "normal"),
            "dyslexia_font": data.get("dyslexia_font", False),
            "screen_reader": data.get("screen_reader", False),
            "keyboard_navigation": data.get("keyboard_navigation", True),
            "high_contrast": data.get("high_contrast", False),
            "reduced_motion": data.get("reduced_motion", False)
        }
        
        settings = orm.accessibility_settings.create(settings_data)
        return jsonify({"accessibility": settings.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create accessibility settings: {e}"}), 500

@gamification_bp.route("/accessibility", methods=["PUT"])
@require_auth
def update_accessibility_settings():
    """Update accessibility settings"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        updated_settings = orm.accessibility_settings.update(user_id, data)
        return jsonify({"accessibility": updated_settings.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update accessibility settings: {e}"}), 500

# ============================================================================
# VERSION HISTORY
# ============================================================================

@gamification_bp.route("/version-history", methods=["GET"])
@require_auth
def get_version_history():
    """Get version history"""
    try:
        attempt_id = request.args.get('attempt_id')
        limit = int(request.args.get('limit', 50))
        
        if attempt_id:
            result = orm.version_history.query(
                index_name="attempt-id-index",
                key_condition={"attempt_id": attempt_id}
            )
        else:
            result = orm.version_history.scan(pagination=PaginationParams(limit=limit))
        
        return jsonify({
            "versions": [version.to_dict() for version in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get version history: {e}"}), 500

@gamification_bp.route("/version-history", methods=["POST"])
@require_auth
def create_version_history():
    """Create version history entry"""
    try:
        data = request.get_json()
        
        version_data = {
            "attempt_id": data.get("attempt_id"),
            "version_number": data.get("version_number"),
            "content": data.get("content"),
            "changes": data.get("changes"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        version = orm.version_history.create(version_data)
        return jsonify({"version": version.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create version history: {e}"}), 500

# ============================================================================
# COACH CHAT
# ============================================================================

@gamification_bp.route("/coach-chat", methods=["GET"])
@require_auth
def get_coach_chat():
    """Get coach chat messages"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        session_id = request.args.get('session_id')
        limit = int(request.args.get('limit', 50))
        
        if session_id:
            result = orm.coach_chat.query(
                index_name="session-id-index",
                key_condition={"session_id": session_id}
            )
        else:
            result = orm.coach_chat.query(
                index_name="user-id-index",
                key_condition={"user_id": user_id}
            )
        
        return jsonify({
            "messages": [message.to_dict() for message in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get coach chat: {e}"}), 500

@gamification_bp.route("/coach-chat", methods=["POST"])
@require_auth
def create_coach_chat():
    """Create coach chat message"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        message_data = {
            "user_id": user_id,
            "session_id": data.get("session_id"),
            "message_type": data.get("message_type", "user"),
            "content": data.get("content"),
            "sender": data.get("sender", "user"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        message = orm.coach_chat.create(message_data)
        return jsonify({"message": message.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create coach chat message: {e}"}), 500

# ============================================================================
# WALKTHROUGH SESSIONS
# ============================================================================

@gamification_bp.route("/walkthrough-sessions", methods=["GET"])
@require_auth
def get_walkthrough_sessions():
    """Get walkthrough sessions"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        step_id = request.args.get('step_id')
        session_status = request.args.get('session_status')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if step_id:
            filter_conditions.append("step_id = :step_id")
            expression_values[":step_id"] = step_id
        
        if session_status:
            filter_conditions.append("session_status = :session_status")
            expression_values[":session_status"] = session_status
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.walkthrough_sessions.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "sessions": [session.to_dict() for session in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get walkthrough sessions: {e}"}), 500

@gamification_bp.route("/walkthrough-sessions", methods=["POST"])
@require_auth
def create_walkthrough_session():
    """Create walkthrough session"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        session_data = {
            "user_id": user_id,
            "step_id": data.get("step_id"),
            "session_status": data.get("session_status", "active"),
            "current_step": data.get("current_step", 1),
            "total_steps": data.get("total_steps"),
            "started_at": datetime.utcnow().isoformat()
        }
        
        session = orm.walkthrough_sessions.create(session_data)
        return jsonify({"session": session.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create walkthrough session: {e}"}), 500

# ============================================================================
# MICRO ASSESSMENTS
# ============================================================================

@gamification_bp.route("/micro-assessments", methods=["GET"])
@require_auth
def get_micro_assessments():
    """Get micro assessments"""
    try:
        user_id = request.current_user.get("cognito_user_id")
        skill_tag = request.args.get('skill_tag')
        assessment_type = request.args.get('assessment_type')
        limit = int(request.args.get('limit', 50))
        
        filter_conditions = ["user_id = :user_id"]
        expression_values = {":user_id": user_id}
        
        if skill_tag:
            filter_conditions.append("skill_tag = :skill_tag")
            expression_values[":skill_tag"] = skill_tag
        
        if assessment_type:
            filter_conditions.append("assessment_type = :assessment_type")
            expression_values[":assessment_type"] = assessment_type
        
        filter_expression = " AND ".join(filter_conditions)
        
        result = orm.micro_assessments.scan(
            filter_expression=filter_expression,
            expression_values=expression_values,
            pagination=PaginationParams(limit=limit)
        )
        
        return jsonify({
            "assessments": [assessment.to_dict() for assessment in result.items],
            "count": result.count
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get micro assessments: {e}"}), 500

@gamification_bp.route("/micro-assessments", methods=["POST"])
@require_auth
def create_micro_assessment():
    """Create micro assessment"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("cognito_user_id")
        
        assessment_data = {
            "user_id": user_id,
            "skill_tag": data.get("skill_tag"),
            "assessment_type": data.get("assessment_type"),
            "question": data.get("question"),
            "answer": data.get("answer"),
            "is_correct": data.get("is_correct"),
            "time_spent": data.get("time_spent"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        assessment = orm.micro_assessments.create(assessment_data)
        return jsonify({"assessment": assessment.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create micro assessment: {e}"}), 500
