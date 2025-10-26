#!/usr/bin/env python3
"""
Frontend Routes for Prismo Backend

Routes to serve the Angular frontend and handle SPA routing.
"""

import os
from functools import wraps

from flask import (Blueprint, jsonify, render_template, request,
                   send_from_directory)


# Frontend routes blueprint
frontend_bp = Blueprint("frontend", __name__)


def require_auth(f):
    """Decorator to require authentication for protected routes"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For now, we'll allow all routes - implement auth check later
        return f(*args, **kwargs)

    return decorated_function


@frontend_bp.route("/")
def index():
    """Serve the main Angular application"""
    return render_template("index.csr.html")


@frontend_bp.route("/dashboard")
@require_auth
def dashboard():
    """Serve the dashboard page"""
    return render_template("dashboard/index.html")


@frontend_bp.route("/labs")
@require_auth
def labs():
    """Serve the labs page"""
    return render_template("labs/index.html")


@frontend_bp.route("/components")
@require_auth
def components():
    """Serve the components page"""
    return render_template("components/index.html")


@frontend_bp.route("/widget-lab")
@require_auth
def widget_lab():
    """Serve the widget lab page"""
    return render_template("widget-lab/index.html")


@frontend_bp.route("/labs/demo")
@require_auth
def demo_lab():
    """Serve the demo lab page"""
    return render_template("labs/demo/index.html")


@frontend_bp.route("/login")
def login():
    """Serve the login page"""
    return render_template("login/index.html")


@frontend_bp.route("/register")
def register():
    """Serve the register page"""
    return render_template("register/index.html")


@frontend_bp.route("/forgot-password")
def forgot_password():
    """Serve the forgot password page"""
    return render_template("forgot-password/index.html")


@frontend_bp.route("/oauth/callback")
def oauth_callback():
    """Handle OAuth callback from Angular"""
    # This will be handled by the Angular app
    return render_template("index.csr.html")


# Static file serving is handled by Flask's built-in static file serving
# with custom MIME type handling in the catch-all route below

@frontend_bp.route("/test-route")
def test_route():
    """Test route to verify routing is working"""
    return "Test route working"


@frontend_bp.route("/<path:filename>")
def static_files(filename):
    """Serve static files (JS, CSS, images) with correct MIME types"""
    # Check if it's a static file by extension
    if "." in filename:
        # Try to find the file in any of the static directories
        # Check browser folder first (Angular build output), then js, css, images
        static_dirs = ["browser", "js", "css", "images"]

        for static_dir in static_dirs:
            try:
                # Check if file exists in this directory
                import os

                # Use absolute path from the backend static folder
                file_path = os.path.join("backend", "static", static_dir, filename)
                print(f"Looking for {filename} in {static_dir} (path: {file_path}) - exists: {os.path.exists(file_path)}")
                if os.path.exists(file_path):
                    print(f"Serving {filename} from {static_dir}")
                    # Use absolute path for send_from_directory
                    abs_path = os.path.abspath(os.path.join("backend", "static", static_dir))
                    if filename.endswith(".js"):
                        return send_from_directory(
                            abs_path, filename, mimetype="application/javascript"
                        )
                    elif filename.endswith(".css"):
                        return send_from_directory(
                            abs_path, filename, mimetype="text/css"
                        )
                    else:
                        return send_from_directory(abs_path, filename)
            except Exception as e:
                print(f"Error serving {filename} from {static_dir}: {e}")
                continue

    # If not a static file, serve the main Angular app
    print(f"File {filename} not found, serving index.csr.html")
    return render_template("index.csr.html")


@frontend_bp.route("/api/config")
def api_config():
    """Provide frontend configuration"""
    return jsonify(
        {
            "apiUrl": "http://localhost:5000",
            "backendUrl": "http://localhost:5000",
            "googleClientId": "174911154905-3d2k5au7monn142921u3f455lkgu5a2v.apps.googleusercontent.com",
            "oauthRedirectUri": "http://localhost:5000/oauth/callback",
            "environment": "development",
        }
    )


@frontend_bp.route("/health-check")
def health_check():
    """Health check for frontend"""
    return jsonify(
        {
            "status": "healthy",
            "frontend": "angular",
            "backend": "flask",
            "timestamp": "2024-01-01T00:00:00Z",
        }
    )
