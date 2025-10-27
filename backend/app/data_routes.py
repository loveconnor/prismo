from functools import wraps

from app.auth_service_supabase import auth_service
from app.models import Collection, Lab, User, Widget
from flask import Blueprint, jsonify, request


# Data routes blueprint
data_bp = Blueprint("data", __name__, url_prefix="/api")


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


# Lab routes
@data_bp.route("/labs", methods=["GET"])
def get_labs():
    """Get all public labs or user's labs"""
    try:
        lab_model = Lab()

        # Check if user is authenticated
        auth_header = request.headers.get("Authorization")
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                result = auth_service.verify_token(token)
                if result["success"]:
                    # Get user's labs
                    user_labs = lab_model.get_labs_by_user(
                        result["user_data"]["cognito_user_id"]
                    )
                    return jsonify({"labs": user_labs}), 200
            except:
                pass

        # Get public labs
        public_labs = lab_model.get_public_labs()
        return jsonify({"labs": public_labs}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get labs: {e}"}), 500


@data_bp.route("/labs", methods=["POST"])
@require_auth
def create_lab():
    """Create a new lab"""
    try:
        data = request.get_json()

        required_fields = ["name", "lab_type", "description", "content"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        lab_model = Lab()
        lab_data = lab_model.create_lab(
            name=data["name"],
            lab_type=data["lab_type"],
            description=data["description"],
            content=data["content"],
            user_id=request.current_user["cognito_user_id"],
            is_public=data.get("is_public", False),
            tags=data.get("tags", []),
            difficulty=data.get("difficulty", "beginner"),
            estimated_time=data.get("estimated_time", 30),
        )

        return jsonify({"message": "Lab created successfully", "lab": lab_data}), 201

    except Exception as e:
        return jsonify({"error": f"Failed to create lab: {e}"}), 500


@data_bp.route("/labs/<lab_id>", methods=["GET"])
def get_lab(lab_id):
    """Get a specific lab"""
    try:
        lab_model = Lab()
        lab = lab_model.get_item({"id": lab_id})

        if not lab:
            return jsonify({"error": "Lab not found"}), 404

        # Check if user can access this lab
        auth_header = request.headers.get("Authorization")
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                result = auth_service.verify_token(token)
                if result["success"]:
                    # User can access their own labs or public labs
                    if lab["user_id"] == result["user_data"][
                        "cognito_user_id"
                    ] or lab.get("is_public", False):
                        return jsonify({"lab": lab}), 200
            except:
                pass

        # Check if lab is public
        if lab.get("is_public", False):
            return jsonify({"lab": lab}), 200

        return jsonify({"error": "Lab not found or not accessible"}), 404

    except Exception as e:
        return jsonify({"error": f"Failed to get lab: {e}"}), 500


@data_bp.route("/labs/<lab_id>", methods=["PUT"])
@require_auth
def update_lab(lab_id):
    """Update a lab"""
    try:
        lab_model = Lab()
        lab = lab_model.get_item({"id": lab_id})

        if not lab:
            return jsonify({"error": "Lab not found"}), 404

        # Check if user owns this lab
        if lab["user_id"] != request.current_user["cognito_user_id"]:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        updates = {}

        # Only update provided fields
        updatable_fields = [
            "name",
            "description",
            "content",
            "is_public",
            "tags",
            "difficulty",
            "estimated_time",
        ]
        for field in updatable_fields:
            if field in data:
                updates[field] = data[field]

        if updates:
            updated_lab = lab_model.update_item({"id": lab_id}, updates)
            return (
                jsonify({"message": "Lab updated successfully", "lab": updated_lab}),
                200,
            )
        else:
            return jsonify({"message": "No updates provided"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update lab: {e}"}), 500


@data_bp.route("/labs/<lab_id>", methods=["DELETE"])
@require_auth
def delete_lab(lab_id):
    """Delete a lab"""
    try:
        lab_model = Lab()
        lab = lab_model.get_item({"id": lab_id})

        if not lab:
            return jsonify({"error": "Lab not found"}), 404

        # Check if user owns this lab
        if lab["user_id"] != request.current_user["cognito_user_id"]:
            return jsonify({"error": "Unauthorized"}), 403

        lab_model.delete_item({"id": lab_id})
        return jsonify({"message": "Lab deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete lab: {e}"}), 500


# Widget routes
@data_bp.route("/widgets", methods=["GET"])
def get_widgets():
    """Get all public widgets or user's widgets"""
    try:
        widget_model = Widget()

        # Check if user is authenticated
        auth_header = request.headers.get("Authorization")
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                result = auth_service.verify_token(token)
                if result["success"]:
                    # Get user's widgets
                    user_widgets = widget_model.get_widgets_by_user(
                        result["user_data"]["cognito_user_id"]
                    )
                    return jsonify({"widgets": user_widgets}), 200
            except:
                pass

        # Get public widgets
        public_widgets = widget_model.get_public_widgets()
        return jsonify({"widgets": public_widgets}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get widgets: {e}"}), 500


@data_bp.route("/widgets", methods=["POST"])
@require_auth
def create_widget():
    """Create a new widget"""
    try:
        data = request.get_json()

        required_fields = ["name", "widget_type", "config"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        widget_model = Widget()
        widget_data = widget_model.create_widget(
            name=data["name"],
            widget_type=data["widget_type"],
            config=data["config"],
            user_id=request.current_user["cognito_user_id"],
            is_public=data.get("is_public", False),
            tags=data.get("tags", []),
            version=data.get("version", "1.0.0"),
        )

        return (
            jsonify({"message": "Widget created successfully", "widget": widget_data}),
            201,
        )

    except Exception as e:
        return jsonify({"error": f"Failed to create widget: {e}"}), 500


@data_bp.route("/widgets/<widget_id>", methods=["GET"])
def get_widget(widget_id):
    """Get a specific widget"""
    try:
        widget_model = Widget()
        widget = widget_model.get_item({"id": widget_id})

        if not widget:
            return jsonify({"error": "Widget not found"}), 404

        # Check if user can access this widget
        auth_header = request.headers.get("Authorization")
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                result = auth_service.verify_token(token)
                if result["success"]:
                    # User can access their own widgets or public widgets
                    if widget["user_id"] == result["user_data"][
                        "cognito_user_id"
                    ] or widget.get("is_public", False):
                        return jsonify({"widget": widget}), 200
            except:
                pass

        # Check if widget is public
        if widget.get("is_public", False):
            return jsonify({"widget": widget}), 200

        return jsonify({"error": "Widget not found or not accessible"}), 404

    except Exception as e:
        return jsonify({"error": f"Failed to get widget: {e}"}), 500


# Collection routes
@data_bp.route("/collections", methods=["GET"])
@require_auth
def get_collections():
    """Get user's collections"""
    try:
        collection_model = Collection()
        collections = collection_model.get_collections_by_user(
            request.current_user["cognito_user_id"]
        )
        return jsonify({"collections": collections}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get collections: {e}"}), 500


@data_bp.route("/collections", methods=["POST"])
@require_auth
def create_collection():
    """Create a new collection"""
    try:
        data = request.get_json()

        required_fields = ["name", "description", "items"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        collection_model = Collection()
        collection_data = collection_model.create_collection(
            name=data["name"],
            description=data["description"],
            user_id=request.current_user["cognito_user_id"],
            items=data["items"],
            is_public=data.get("is_public", False),
            tags=data.get("tags", []),
        )

        return (
            jsonify(
                {
                    "message": "Collection created successfully",
                    "collection": collection_data,
                }
            ),
            201,
        )

    except Exception as e:
        return jsonify({"error": f"Failed to create collection: {e}"}), 500


@data_bp.route("/collections/<collection_id>", methods=["GET"])
@require_auth
def get_collection(collection_id):
    """Get a specific collection"""
    try:
        collection_model = Collection()
        collection = collection_model.get_item({"id": collection_id})

        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        # Check if user owns this collection
        if collection["user_id"] != request.current_user["cognito_user_id"]:
            return jsonify({"error": "Unauthorized"}), 403

        return jsonify({"collection": collection}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get collection: {e}"}), 500
