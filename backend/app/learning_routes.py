#!/usr/bin/env python3
"""
Learning System Routes for Prismo Backend

API routes for the core learning system including modules, attempts, mastery, and feedback.
"""

from functools import wraps
from flask import Blueprint, jsonify, request
from app.orm_supabase import orm, PaginationParams
from app.auth_service_supabase import auth_service
from app.ai_routes import get_ai_response
from datetime import datetime
import traceback
import json

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
        # For Supabase, use 'id' field from user data
        user_id = request.current_user.get("id")
        module_type = request.args.get('module_type')
        limit = int(request.args.get('limit', 100))  # Increased default limit
        
        print(f"[Get Modules] user_id: {user_id}, module_type: {module_type}, limit: {limit}")
        
        if user_id:
            try:
                # Use query with filters for Supabase ORM
                filters = {"user_id": user_id}
                result = orm.modules.query(filters=filters, pagination=PaginationParams(limit=limit))
                modules = result.items if hasattr(result, 'items') else []
            except Exception as query_error:
                print(f"[Get Modules] Query by user_id failed: {query_error}")
                modules = []
        else:
            filters = {}
            
            if module_type:
                filters["module_type"] = module_type
            
            result = orm.modules.scan(
                filters=filters if filters else None,
                limit=limit
            )
            modules = result.items if hasattr(result, 'items') else []
        
        # Convert modules to dict format
        modules_list = []
        for module in modules:
            if hasattr(module, 'to_dict'):
                modules_list.append(module.to_dict())
            elif isinstance(module, dict):
                modules_list.append(module)
        
        # Sort by created_at in descending order (newest first)
        modules_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        print(f"[Get Modules] Returning {len(modules_list)} modules")
        
        return jsonify({
            "modules": modules_list,
            "count": len(modules_list)
        }), 200
    except Exception as e:
        print(f"[Get Modules] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to get modules: {str(e)}"}), 500

@learning_bp.route("/modules", methods=["POST"])
@require_auth
def create_module():
    """Create learning module"""
    try:
        data = request.get_json()
        user_id = request.current_user.get("id")
        
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

@learning_bp.route("/modules/<module_id>", methods=["DELETE"])
@require_auth
def delete_module(module_id):
    """Delete module"""
    try:
        # Get the module to verify ownership
        module = orm.modules.get_by_id(module_id)
        if not module:
            return jsonify({"error": "Module not found"}), 404
        
        # Check if user owns this module
        user_id = request.current_user.get("id")
        if module.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        # Delete the module
        orm.modules.delete_by_id(module_id)
        return jsonify({"message": "Module deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete module: {e}"}), 500

# ============================================================================
# ATTEMPTS
# ============================================================================

@learning_bp.route("/attempts", methods=["GET"])
@require_auth
def get_attempts():
    """Get learning attempts"""
    try:
        user_id = request.current_user.get("id")
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
        user_id = request.current_user.get("id")
        
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
        user_id = request.current_user.get("id")
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
        user_id = request.current_user.get("id")
        
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
        user_id = request.current_user.get("id")
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
        user_id = request.current_user.get("id")
        
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
        user_id = request.current_user.get("id")
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
        user_id = request.current_user.get("id")
        
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

# ============================================================================
# LAB RECOMMENDATIONS
# ============================================================================

@learning_bp.route("/recommendations", methods=["POST"])
@require_auth
def get_lab_recommendations():
    """
    Generate AI-powered lab recommendations based on user's learning history
    If no completed labs, recommends from existing available labs
    
    Request body:
    {
        "count": 3  // Optional, default 3
    }
    
    Returns recommended labs (existing or topics to generate)
    """
    try:
        print(f"[Recommendations] current_user type: {type(request.current_user)}")
        print(f"[Recommendations] current_user: {request.current_user}")
        
        # Safely extract user_id - use 'id' for Supabase
        if request.current_user is None:
            return jsonify({"error": "User not authenticated"}), 401
            
        user_id = request.current_user.get("id")
        print(f"[Recommendations] user_id: {user_id}, type: {type(user_id)}")
        
        # Ensure user_id is a string
        if not user_id or not isinstance(user_id, str):
            print(f"[Recommendations] ERROR: Invalid user_id. current_user keys: {request.current_user.keys() if isinstance(request.current_user, dict) else 'not a dict'}")
            return jsonify({"error": "Invalid user data"}), 401
        
        data = request.get_json() or {}
        count = data.get("count", 3)
        
        # Get user's completed sessions
        sessions_result = orm.module_sessions.query_by_user_id(
            user_id=user_id
        )
        
        # Convert to list if needed
        completed_sessions = [s for s in sessions_result if s.status == "completed"]
        in_progress_sessions = [s for s in sessions_result if s.status in ["started", "in_progress"]]
        
        # Get IDs of labs the user has already done or is doing
        user_lab_ids = set([s.module_id for s in sessions_result])
        
        # Get user's owned modules (labs they created)
        try:
            user_modules_result = orm.modules.query_by_user_id(user_id=user_id, limit=50)
            user_owned_modules = user_modules_result if isinstance(user_modules_result, list) else []
            print(f"[Recommendations] Found {len(user_owned_modules)} user-owned modules")
        except Exception as e:
            print(f"[Recommendations] Error querying user modules: {e}")
            user_owned_modules = []
        
        # If user has no completed labs, generate recommendations based on owned labs
        if len(completed_sessions) == 0:
            if len(user_owned_modules) > 0:
                # Use AI to recommend next labs based on owned modules
                print(f"[Recommendations] Using AI with {len(user_owned_modules)} owned modules as context")
                
                owned_module_info = []
                for module in user_owned_modules[:10]:  # Limit to recent 10
                    content = module.content or {}
                    owned_module_info.append({
                        "title": content.get("title", module.name),
                        "skills": content.get("skills", module.tags or []),
                        "difficulty": content.get("difficulty", 2),
                        "description": content.get("description", "")
                    })
                
                # Build AI prompt for owned modules
                system_prompt = """You are an expert learning path advisor for coding education. 
The user has created several labs but hasn't completed any yet.
Based on the labs they've created, recommend new lab topics that would complement their interests and gradually increase in complexity."""
                
                user_context = f"""
User's Created Labs (not yet completed):
{json.dumps(owned_module_info, indent=2)}

Based on the labs they've created, please recommend {count} new lab topics that would:
1. Build on similar themes or technologies
2. Introduce complementary skills
3. Gradually increase in difficulty

For each recommendation, provide:
1. Lab title (concise, specific)
2. Brief description (1-2 sentences)
3. Key skills to learn (3-5 skills)
4. Suggested difficulty level (1-5, where 1=beginner, 5=expert)

Respond in valid JSON format like this:
{{
  "recommendations": [
    {{
      "title": "Lab Title",
      "description": "Brief description of what they'll learn",
      "skills": ["skill1", "skill2", "skill3"],
      "difficulty": 3,
      "reasoning": "Why this complements their created labs"
    }}
  ]
}}
"""
                
                # Get AI recommendations
                ai_response = get_ai_response(
                    message=user_context,
                    system_prompt=system_prompt,
                    max_tokens=2000
                )
                
                if ai_response:
                    try:
                        # Extract JSON from response
                        json_start = ai_response.find('{')
                        json_end = ai_response.rfind('}') + 1
                        if json_start >= 0 and json_end > json_start:
                            json_str = ai_response[json_start:json_end]
                            recommendations_data = json.loads(json_str)
                        else:
                            recommendations_data = json.loads(ai_response)
                        
                        # Mark AI recommendations as not existing (need to be generated)
                        recommendations = recommendations_data.get("recommendations", [])
                        for rec in recommendations:
                            rec["is_existing"] = False
                        
                        return jsonify({
                            "success": True,
                            "recommendations": recommendations,
                            "source": "ai_owned_modules"
                        }), 200
                    except json.JSONDecodeError:
                        print(f"[Recommendations] Failed to parse AI response for owned modules")
                        # Fall through to existing labs fallback
            
            # Fallback: Get all available modules and recommend some
            print(f"[Recommendations] Falling back to existing available labs")
            try:
                all_modules_result = orm.modules.scan(limit=50)
                all_modules = all_modules_result.items if hasattr(all_modules_result, 'items') else []
            except Exception as e:
                print(f"[Recommendations] Error scanning modules: {e}")
                all_modules = []
            
            # Prioritize user's own modules first, then others
            user_module_ids = set([m.id for m in user_owned_modules])
            user_modules_not_started = [m for m in user_owned_modules if m.id not in user_lab_ids]
            other_modules = [m for m in all_modules if m.id not in user_module_ids and m.id not in user_lab_ids]
            
            # Combine: prioritize user's own labs, then others
            available_modules = user_modules_not_started + other_modules
            
            # Convert to recommendation format
            recommendations = []
            for module in available_modules[:count]:
                content = module.content or {}
                is_user_owned = module.id in user_module_ids
                recommendations.append({
                    "title": content.get("title", module.name),
                    "description": content.get("description", "Learn new coding skills"),
                    "skills": content.get("skills", module.tags or []),
                    "difficulty": content.get("difficulty", 2),
                    "reasoning": "Your own lab - ready to start!" if is_user_owned else "Great starting point for your learning journey",
                    "module_id": module.id,  # Include existing module ID
                    "is_existing": True  # Flag to indicate this is an existing lab
                })
            
            return jsonify({
                "success": True,
                "recommendations": recommendations,
                "source": "existing_labs"
            }), 200
        
        # Get module details for completed labs
        completed_modules = []
        for session in completed_sessions[:10]:  # Limit to last 10 for context
            try:
                module = orm.modules.get(session.module_id)
                if module:
                    completed_modules.append({
                        "title": module.content.get("title", module.name),
                        "skills": module.content.get("skills", module.tags),
                        "difficulty": module.content.get("difficulty", 2)
                    })
            except:
                continue
        
        # Build AI prompt
        system_prompt = """You are an expert learning path advisor for coding education. 
Your job is to recommend personalized lab topics based on a student's learning history.
Provide recommendations that build on their completed work while introducing new concepts."""
        
        user_context = f"""
User's Learning History:
- Completed {len(completed_sessions)} labs
- Currently working on {len(in_progress_sessions)} labs

Recent Completed Labs:
{json.dumps(completed_modules, indent=2)}

Please recommend {count} new lab topics that would be good next steps for this learner.
For each recommendation, provide:
1. Lab title (concise, specific)
2. Brief description (1-2 sentences)
3. Key skills to learn (3-5 skills)
4. Suggested difficulty level (1-5, where 1=beginner, 5=expert)

Respond in valid JSON format like this:
{{
  "recommendations": [
    {{
      "title": "Lab Title",
      "description": "Brief description of what they'll learn",
      "skills": ["skill1", "skill2", "skill3"],
      "difficulty": 3,
      "reasoning": "Why this is recommended based on their history"
    }}
  ]
}}
"""
        
        # Get AI recommendations
        ai_response = get_ai_response(
            message=user_context,
            system_prompt=system_prompt,
            max_tokens=2000
        )
        
        if not ai_response:
            # Fallback to simple recommendations if AI fails
            return jsonify({
                "success": True,
                "recommendations": [
                    {
                        "title": "Advanced Coding Concepts",
                        "description": "Continue your learning journey with intermediate challenges",
                        "skills": ["problem-solving", "algorithms"],
                        "difficulty": 3,
                        "reasoning": "Based on your progress",
                        "is_existing": False
                    }
                ],
                "source": "fallback"
            }), 200
        
        # Parse AI response
        try:
            # Extract JSON from response (in case there's extra text)
            json_start = ai_response.find('{')
            json_end = ai_response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = ai_response[json_start:json_end]
                recommendations_data = json.loads(json_str)
            else:
                recommendations_data = json.loads(ai_response)
            
            # Mark AI recommendations as not existing (need to be generated)
            recommendations = recommendations_data.get("recommendations", [])
            for rec in recommendations:
                rec["is_existing"] = False
            
            return jsonify({
                "success": True,
                "recommendations": recommendations,
                "source": "ai"
            }), 200
            
        except json.JSONDecodeError:
            # If JSON parsing fails, return error
            return jsonify({
                "success": False,
                "error": "Failed to parse AI recommendations",
                "raw_response": ai_response
            }), 500
            
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Failed to generate recommendations: {str(e)}"
        }), 500
