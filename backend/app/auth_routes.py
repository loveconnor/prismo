from functools import wraps
import requests
import base64

from app.auth_service import auth_service
from flask import Blueprint, jsonify, request, current_app
from config import config


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


@auth_bp.route("/resend", methods=["POST"])
def resend_verification():
    """Resend verification code"""
    try:
        data = request.get_json()

        if "email" not in data:
            return jsonify({"error": "Email required"}), 400

        result = auth_service.resend_verification_code(data["email"])

        if result["success"]:
            return jsonify({"message": result["message"]}), 200
        else:
            return jsonify({"error": result["error"]}), 400

    except Exception as e:
        return jsonify({"error": f"Resend failed: {e}"}), 500


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
        print("\n" + "="*80)
        print("TOKEN REFRESH REQUEST")
        print("="*80)
        
        data = request.get_json()
        print(f"Request data keys: {data.keys() if data else 'None'}")

        if "refresh_token" not in data:
            print("ERROR: No refresh_token in request")
            return jsonify({"error": "Refresh token required"}), 400

        # Optional: accept username to help with SECRET_HASH calculation
        username = data.get("username")
        print(f"Username from request: {username}")
        print(f"Refresh token (first 30 chars): {data['refresh_token'][:30]}...")
        
        result = auth_service.refresh_token(data["refresh_token"], username=username)
        print(f"Refresh result success: {result.get('success')}")

        if result["success"]:
            print("Token refresh successful, returning new tokens")
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
            print(f"Token refresh failed: {result.get('error')}")
            status_code = 401
            response_data = {"error": result["error"]}
            
            # If re-authentication is required, add flag
            if result.get("requires_reauth"):
                response_data["requires_reauth"] = True
                
            return jsonify(response_data), status_code

    except Exception as e:
        print(f"EXCEPTION in refresh_token: {e}")
        import traceback
        traceback.print_exc()
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


@auth_bp.route("/oauth/callback", methods=["POST"])
def oauth_callback():
    """Handle OAuth callback and exchange authorization code for tokens"""
    try:
        data = request.get_json()
        
        if "code" not in data:
            return jsonify({"error": "Authorization code required"}), 400
        
        auth_code = data["code"]
        redirect_uri = data.get("redirect_uri", current_app.config.get("OAUTH_CALLBACK_URL"))
        
        print(f"DEBUG: OAuth callback - exchanging code for tokens")
        print(f"DEBUG: Redirect URI: {redirect_uri}")
        
        # Exchange authorization code for tokens using Cognito token endpoint
        token_url = f"https://{current_app.config.get('COGNITO_DOMAIN')}.auth.{current_app.config.get('AWS_REGION')}.amazoncognito.com/oauth2/token"
        
        # Prepare the authorization header (client_id:client_secret base64 encoded)
        client_id = current_app.config.get("COGNITO_CLIENT_ID")
        client_secret = current_app.config.get("COGNITO_CLIENT_SECRET")
        
        auth_string = f"{client_id}:{client_secret}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {auth_b64}'
        }
        
        body = {
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'code': auth_code,
            'redirect_uri': redirect_uri
        }
        
        print(f"DEBUG: Requesting tokens from: {token_url}")
        
        # Make request to Cognito token endpoint
        response = requests.post(token_url, headers=headers, data=body)
        
        if response.status_code != 200:
            print(f"ERROR: Token exchange failed: {response.text}")
            return jsonify({
                "error": "Failed to exchange authorization code",
                "details": response.text
            }), 400
        
        tokens = response.json()
        print(f"DEBUG: Successfully received tokens from Cognito")
        
        # Get user info using the access token
        access_token = tokens.get('access_token')
        if not access_token:
            return jsonify({"error": "No access token received"}), 400
        
        # Handle social login (create or get user)
        result = auth_service.handle_social_login(access_token, tokens.get('id_token'))
        
        if result["success"]:
            return jsonify({
                "message": "Login successful",
                "access_token": access_token,
                "refresh_token": tokens.get('refresh_token'),
                "id_token": tokens.get('id_token'),
                "expires_in": tokens.get('expires_in'),
                "user_data": result["user_data"]
            }), 200
        else:
            return jsonify({"error": result["error"]}), 400
        
    except Exception as e:
        print(f"ERROR: OAuth callback failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"OAuth callback failed: {str(e)}"}), 500


@auth_bp.route("/oauth/config", methods=["GET"])
def oauth_config():
    """Get OAuth configuration for frontend"""
    try:
        cognito_domain = current_app.config.get("COGNITO_DOMAIN")
        region = current_app.config.get("AWS_REGION")
        client_id = current_app.config.get("COGNITO_CLIENT_ID")
        callback_url = current_app.config.get("OAUTH_CALLBACK_URL")
        
        # Construct Cognito hosted UI URL
        hosted_ui_url = f"https://{cognito_domain}.auth.{region}.amazoncognito.com"
        
        return jsonify({
            "cognito_domain": cognito_domain,
            "hosted_ui_url": hosted_ui_url,
            "client_id": client_id,
            "callback_url": callback_url,
            "region": region,
            "authorize_endpoint": f"{hosted_ui_url}/oauth2/authorize",
            "token_endpoint": f"{hosted_ui_url}/oauth2/token",
            "logout_endpoint": f"{hosted_ui_url}/logout"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get OAuth config: {str(e)}"}), 500
