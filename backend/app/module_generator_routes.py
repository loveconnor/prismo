"""
Module Generator Routes

API endpoints for AI-powered module generation using AWS Bedrock
"""

import asyncio
import json
import os
from datetime import datetime
from flask import Blueprint, jsonify, request
from app.auth_service import CognitoAuthService
from app.ace_engine import ace_engine
import traceback

# Create blueprint
module_generator_bp = Blueprint("module_generator", __name__)

# Initialize auth service
auth_service = CognitoAuthService()


def save_module_to_filesystem(module: dict, module_id: str):
    """
    Save generated module to filesystem for easy access
    
    Args:
        module: The generated module dictionary
        module_id: The unique module ID
    """
    try:
        # Get the path to the frontend assets folder
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_root = os.path.dirname(current_dir)
        project_root = os.path.dirname(backend_root)
        
        # Path to auto-generated-labs folder
        auto_gen_path = os.path.join(
            project_root, 
            "src", 
            "assets", 
            "modules", 
            "auto-generated-labs"
        )
        
        # Create directory if it doesn't exist
        os.makedirs(auto_gen_path, exist_ok=True)
        
        # Generate filename from module name or ID
        module_name = module.get("name", module_id)
        # Clean filename
        safe_filename = "".join(c if c.isalnum() or c in ('-', '_') else '-' for c in module_name)
        filename = f"{safe_filename}.json"
        
        filepath = os.path.join(auto_gen_path, filename)
        
        # Add metadata to module
        module_with_meta = module.copy()
        module_with_meta["_metadata"] = {
            "generated_at": datetime.utcnow().isoformat(),
            "module_id": module_id,
            "saved_to_filesystem": True
        }
        
        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(module_with_meta, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Module saved to filesystem: {filepath}")
        
    except Exception as e:
        print(f"⚠️  Failed to save module to filesystem: {e}")
        # Don't fail the request if filesystem save fails
        traceback.print_exc()


def get_user_id_from_token():
    """Extract user ID from JWT token in Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        print("DEBUG: No Authorization header or invalid format")
        return None
    
    token = auth_header.split(" ")[1]
    result = auth_service.verify_token(token)
    
    print(f"DEBUG: Token verification result: {result}")
    
    if not result.get("success"):
        print(f"DEBUG: Token verification failed: {result.get('error')}")
        return None
    
    # Try multiple possible user ID fields
    user_id = (
        result.get("user_id") or 
        result.get("cognito_user_id") or
        result.get("user_data", {}).get("cognito_user_id") or
        result.get("user_data", {}).get("id")
    )
    
    if user_id:
        print(f"DEBUG: Extracted user ID: {user_id}")
        return user_id
    
    print(f"DEBUG: No user ID found in token verification result")
    return None


@module_generator_bp.route("/api/modules/generate", methods=["POST"])
def generate_module():
    """
    Generate a new learning module using AI
    
    Request body:
    {
        "topic": "JavaScript Arrays",
        "subject": "coding",
        "difficulty": "beginner",
        "skills": ["programming", "javascript", "arrays"],
        "goal": "Learn array methods" (optional)
    }
    
    Returns:
    {
        "success": true,
        "module": { ... module data ... },
        "module_id": "uuid"
    }
    """
    try:
        print("\n" + "="*80)
        print("MODULE GENERATION REQUEST")
        print("="*80)
        
        # Get user ID from token
        user_id = get_user_id_from_token()
        
        if not user_id:
            print("ERROR: Authentication failed - no user ID")
            return jsonify({
                "success": False,
                "error": "Authentication required"
            }), 401
        
        print(f"✓ Authenticated user: {user_id}")
        
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400

        print(data)
        
        topic = data.get("topic")
        subject = data.get("subject")
        difficulty = data.get("difficulty", "beginner")
        skills = data.get("skills", [])
        goal = data.get("goal", "")
        
        print(f"📥 Received from frontend:")
        print(f"   Topic: {topic}")
        print(f"   Subject: {subject}")
        print(f"   Difficulty: {difficulty}")
        print(f"   Skills (raw): {skills} (type: {type(skills)})")
        print(f"   Goal: {goal}")
        
        if not topic:
            return jsonify({
                "success": False,
                "error": "Topic is required"
            }), 400
        
        # Ensure skills is a list
        if not isinstance(skills, list):
            skills = [skills] if skills else []
        
        # Make a copy to avoid modifying the original
        target_skills = skills.copy()
        
        # Add subject if not already in skills
        if subject and subject not in target_skills:
            target_skills.append(subject)
        
        # Don't auto-extract from goal - user should add skills explicitly
        # This prevents unwanted words from being added as skills
        
        # Ensure at least one skill
        if not target_skills:
            target_skills = ["general"]
        
        print(f"🎯 Processed skills:")
        print(f"   Frontend skills: {skills}")
        print(f"   Target skills (final): {target_skills}")
        
        # Calculate estimated time based on difficulty
        time_map = {
            "beginner": 1800,      # 30 minutes
            "practice": 2700,      # 45 minutes
            "intermediate": 2700,
            "challenge": 3600,     # 60 minutes
            "advanced": 3600
        }
        estimated_time = time_map.get(difficulty, 1800)
        
        print(f"[Module Generator] Generating module for user {user_id}")
        print(f"  Topic: {topic}")
        print(f"  Skills: {target_skills}")
        print(f"  Difficulty: {difficulty}")
        print(f"  Estimated time: {estimated_time}s")
        
        # Generate the module using ACE Engine
        # Use asyncio to run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            module = loop.run_until_complete(
                ace_engine.module_generator.generate_module(
                    user_id=user_id,
                    topic=topic,
                    target_skills=target_skills,
                    difficulty=difficulty,
                    estimated_time=estimated_time
                )
            )
        finally:
            loop.close()
        
        # Save to database
        module_id = ace_engine.save_generated_module(module, user_id)
        
        # Also save to filesystem for easy access
        save_module_to_filesystem(module, module_id)
        
        print(f"[Module Generator] Successfully generated and saved module: {module_id}")
        
        return jsonify({
            "success": True,
            "module": module,
            "module_id": module_id
        }), 201
        
    except Exception as e:
        print(f"[Module Generator] Error generating module: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Failed to generate module: {str(e)}"
        }), 500


@module_generator_bp.route("/api/modules/generate/personalized", methods=["POST"])
def generate_personalized_module():
    """
    Generate a personalized module based on user's learning profile
    
    Request body:
    {
        "learning_goal": "problem-solving" (optional)
    }
    
    Returns:
    {
        "success": true,
        "module": { ... module data ... },
        "module_id": "uuid"
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
        
        data = request.get_json() or {}
        learning_goal = data.get("learning_goal")
        
        print(f"[Module Generator] Generating personalized module for user {user_id}")
        if learning_goal:
            print(f"  Learning goal: {learning_goal}")
        
        # Generate personalized module using ACE Engine
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            module = loop.run_until_complete(
                ace_engine.module_generator.create_personalized_module(
                    user_id=user_id,
                    learning_goal=learning_goal
                )
            )
        finally:
            loop.close()
        
        # The module is already saved in create_personalized_module
        module_id = module.get("saved_id")
        
        print(f"[Module Generator] Successfully generated personalized module: {module_id}")
        
        return jsonify({
            "success": True,
            "module": module,
            "module_id": module_id
        }), 201
        
    except Exception as e:
        print(f"[Module Generator] Error generating personalized module: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Failed to generate personalized module: {str(e)}"
        }), 500
