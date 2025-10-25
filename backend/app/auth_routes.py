from functools import wraps

from app.auth_service import auth_service
from flask import Blueprint, jsonify, request


# Authentication routes blueprint
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def require_auth(f):
    """Decorator to require authentication"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header required"}), 401

        try:
            # Extract token from "Bearer <token>" format
            token = auth_header.split(" ")[1]

            # Verify token
            result = auth_service.verify_token(token)
            if not result["success"]:
                return jsonify({"error": result["error"]}), 401

            # Add user data to request context
            request.current_user = result["user_data"]
            return f(*args, **kwargs)

        except IndexError:
            return jsonify({"error": "Invalid authorization header format"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication error: {e}"}), 401

    return decorated_function


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["email", "password", "username"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Register user
        result = auth_service.register_user(
            email=data["email"],
            password=data["password"],
            username=data["username"],
            profile=data.get("profile", {}),
        )

        if result["success"]:
            return (
                jsonify(
                    {
                        "message": "User registered successfully",
                        "user_sub": result["user_sub"],
                        "confirmation_required": result["confirmation_required"],
                    }
                ),
                201,
            )
        else:
            return jsonify({"error": result["error"]}), 400

    except Exception as e:
        return jsonify({"error": f"Registration failed: {e}"}), 500


@auth_bp.route("/confirm", methods=["POST"])
def confirm_registration():
    """Confirm user registration"""
    try:
        data = request.get_json()

        if "email" not in data or "confirmation_code" not in data:
            return jsonify({"error": "Email and confirmation code required"}), 400

        result = auth_service.confirm_registration(
            email=data["email"], confirmation_code=data["confirmation_code"]
        )

        if result["success"]:
            return jsonify({"message": result["message"]}), 200
        else:
            return jsonify({"error": result["error"]}), 400

    except Exception as e:
        return jsonify({"error": f"Confirmation failed: {e}"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user"""
    try:
        data = request.get_json()

        if "email" not in data or "password" not in data:
            return jsonify({"error": "Email and password required"}), 400

        result = auth_service.authenticate_user(
            email=data["email"], password=data["password"]
        )

        if result["success"]:
            return (
                jsonify(
                    {
                        "message": "Login successful",
                        "access_token": result["access_token"],
                        "refresh_token": result["refresh_token"],
                        "id_token": result["id_token"],
                        "user_data": result["user_data"],
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": result["error"]}), 401

    except Exception as e:
        return jsonify({"error": f"Login failed: {e}"}), 500


@auth_bp.route("/refresh", methods=["POST"])
def refresh_token():
    """Refresh access token"""
    try:
        data = request.get_json()

        if "refresh_token" not in data:
            return jsonify({"error": "Refresh token required"}), 400

        result = auth_service.refresh_token(data["refresh_token"])

        if result["success"]:
            return (
                jsonify(
                    {
                        "access_token": result["access_token"],
                        "id_token": result.get("id_token"),
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": result["error"]}), 401

    except Exception as e:
        return jsonify({"error": f"Token refresh failed: {e}"}), 500


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Initiate forgot password flow"""
    try:
        data = request.get_json()

        if "email" not in data:
            return jsonify({"error": "Email required"}), 400

        result = auth_service.forgot_password(data["email"])

        if result["success"]:
            return (
                jsonify(
                    {
                        "message": result["message"],
                        "code_delivery": result["code_delivery"],
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": result["error"]}), 400

    except Exception as e:
        return jsonify({"error": f"Password reset failed: {e}"}), 500


@auth_bp.route("/confirm-forgot-password", methods=["POST"])
def confirm_forgot_password():
    """Confirm password reset"""
    try:
        data = request.get_json()

        required_fields = ["email", "confirmation_code", "new_password"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        result = auth_service.confirm_forgot_password(
            email=data["email"],
            confirmation_code=data["confirmation_code"],
            new_password=data["new_password"],
        )

        if result["success"]:
            return jsonify({"message": result["message"]}), 200
        else:
            return jsonify({"error": result["error"]}), 400

    except Exception as e:
        return jsonify({"error": f"Password reset failed: {e}"}), 500


@auth_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    """Get user profile"""
    try:
        return jsonify({"user_data": request.current_user}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get profile: {e}"}), 500


@auth_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Profile data required"}), 400

        # Get current access token
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1]

        result = auth_service.update_user_profile(token, data)

        if result["success"]:
            return jsonify({"message": result["message"]}), 200
        else:
            return jsonify({"error": result["error"]}), 400

    except Exception as e:
        return jsonify({"error": f"Profile update failed: {e}"}), 500


@auth_bp.route("/verify", methods=["POST"])
def verify_token():
    """Verify access token"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header required"}), 401

        token = auth_header.split(" ")[1]
        result = auth_service.verify_token(token)

        if result["success"]:
            return jsonify({"valid": True, "user_data": result["user_data"]}), 200
        else:
            return jsonify({"valid": False, "error": result["error"]}), 401

    except Exception as e:
        return jsonify({"error": f"Token verification failed: {e}"}), 500
