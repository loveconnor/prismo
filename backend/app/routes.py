from flask import Blueprint, jsonify, render_template
from app.orm import orm


# Main routes blueprint
main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def home():

    return render_template("index.html")


@main_bp.route("/health")
def health():
    return jsonify(
        {
            "status": "healthy",
            "service": "prismo-backend",
            "timestamp": "2024-01-01T00:00:00Z",
        }
    )


# API routes blueprint
api_bp = Blueprint("api", __name__)


@api_bp.route("/labs")
def get_labs():
    """Get all available labs from database"""
    try:
        # Get all labs from the database
        result = orm.labs.scan(limit=100)
        labs = []
        
        for lab in result.items:
            lab_dict = lab.to_dict()
            # Transform the lab data to match the expected structure similar to fullstack-todo-with-steps.json
            transformed_lab = {
                "id": lab_dict.get("id"),
                "title": lab_dict.get("name", ""),
                "description": lab_dict.get("description", ""),
                "skills": lab_dict.get("tags", []),
                "steps": lab_dict.get("content", {}).get("steps", []),
                "widgets": lab_dict.get("content", {}).get("widgets", []),
                "completion_criteria": lab_dict.get("content", {}).get("completion_criteria", {}),
                "estimated_duration": lab_dict.get("estimated_time", 0),
                "version": lab_dict.get("content", {}).get("version", "1.0.0"),
                "lab_type": lab_dict.get("lab_type", ""),
                "difficulty": lab_dict.get("difficulty", 1),
                "is_public": lab_dict.get("is_public", False),
                "created_at": lab_dict.get("created_at"),
                "updated_at": lab_dict.get("updated_at")
            }
            labs.append(transformed_lab)
        
        return jsonify({
            "labs": labs,
            "count": len(labs),
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "error": f"Failed to fetch labs: {str(e)}",
            "status": "error"
        }), 500


@api_bp.route("/labs/<lab_id>")
def get_lab_by_id(lab_id):
    """Get a specific lab by ID from database"""
    try:
        # Get the lab from the database by ID
        lab = orm.labs.get_by_id(lab_id)
        
        if not lab:
            return jsonify({
                "error": f"Lab with ID {lab_id} not found",
                "status": "error"
            }), 404
        
        lab_dict = lab.to_dict()
        
        # Transform the lab data to match the expected structure
        transformed_lab = {
            "id": lab_dict.get("id"),
            "title": lab_dict.get("name", ""),
            "description": lab_dict.get("description", ""),
            "skills": lab_dict.get("tags", []),
            "steps": lab_dict.get("content", {}).get("steps", []),
            "widgets": lab_dict.get("content", {}).get("widgets", []),
            "completion_criteria": lab_dict.get("content", {}).get("completion_criteria", {}),
            "estimated_duration": lab_dict.get("estimated_time", 0),
            "version": lab_dict.get("content", {}).get("version", "1.0.0"),
            "lab_type": lab_dict.get("lab_type", ""),
            "difficulty": lab_dict.get("difficulty", 1),
            "is_public": lab_dict.get("is_public", False),
            "created_at": lab_dict.get("created_at"),
            "updated_at": lab_dict.get("updated_at")
        }
        
        return jsonify(transformed_lab)
        
    except Exception as e:
        return jsonify({
            "error": f"Failed to fetch lab: {str(e)}",
            "status": "error"
        }), 500


@api_bp.route("/widgets")
def get_widgets():
    """Get all available widgets"""
    return jsonify(
        {
            "widgets": [
                {"id": 1, "name": "Timer", "type": "utility"},
                {"id": 2, "name": "Multiple Choice", "type": "quiz"},
                {"id": 3, "name": "Hint Panel", "type": "support"},
            ]
        }
    )
