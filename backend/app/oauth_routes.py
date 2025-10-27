#!/usr/bin/env python3
"""
OAuth Routes for Prismo Backend

Google OAuth authentication routes for user login and registration.
"""

import os
import requests
from flask import Blueprint, jsonify, request, redirect, session
from app.auth_service_supabase import auth_service
from app.orm_supabase import orm
import secrets
import hashlib
import base64

# OAuth routes blueprint
oauth_bp = Blueprint("oauth", __name__, url_prefix="/oauth")

# Google OAuth configuration
GOOGLE_CLIENT_ID = "174911154905-3d2k5au7monn142921u3f455lkgu5a2v.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")  # Set this in your .env file
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5000/oauth/google/callback")

@oauth_bp.route("/google/login", methods=["GET"])
def google_login():
    """Initiate Google OAuth login"""
    try:
        # Generate state parameter for security
        state = secrets.token_urlsafe(32)
        session['oauth_state'] = state
        
        # Google OAuth URL
        google_auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={GOOGLE_CLIENT_ID}&"
            f"redirect_uri={GOOGLE_REDIRECT_URI}&"
            f"scope=openid%20email%20profile&"
            f"response_type=code&"
            f"state={state}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        
        return jsonify({
            "auth_url": google_auth_url,
            "state": state
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to initiate Google login: {e}"}), 500

@oauth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        if error:
            return jsonify({"error": f"OAuth error: {error}"}), 400
        
        if not code:
            return jsonify({"error": "Authorization code not provided"}), 400
        
        # Verify state parameter
        if state != session.get('oauth_state'):
            return jsonify({"error": "Invalid state parameter"}), 400
        
        # Exchange code for access token
        token_data = {
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': GOOGLE_REDIRECT_URI
        }
        
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data=token_data
        )
        
        if token_response.status_code != 200:
            error_detail = token_response.text
            return jsonify({
                "error": "Failed to exchange code for token",
                "details": error_detail,
                "status_code": token_response.status_code
            }), 400
        
        token_info = token_response.json()
        access_token = token_info.get('access_token')
        
        if not access_token:
            return jsonify({"error": "No access token received"}), 400
        
        # Get user info from Google
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_info_response.status_code != 200:
            return jsonify({"error": "Failed to get user info from Google"}), 400
        
        user_info = user_info_response.json()
        
        # Extract user information
        google_id = user_info.get('id')
        email = user_info.get('email')
        name = user_info.get('name')
        picture = user_info.get('picture')
        verified_email = user_info.get('verified_email', False)
        
        if not email or not verified_email:
            return jsonify({"error": "Email not verified by Google"}), 400
        
        # Check if user exists in our system
        existing_user = orm.users.get_by_key({"cognito_user_id": google_id})
        
        if existing_user:
            # User exists, log them in
            user_data = existing_user.to_dict()
            return jsonify({
                "message": "Login successful",
                "user": user_data,
                "access_token": access_token,  # In production, generate your own JWT
                "user_id": user_data['id']
            }), 200
        else:
            # Create new user
            user_data = {
                "cognito_user_id": google_id,
                "email": email,
                "username": email.split('@')[0],  # Use email prefix as username
                "profile": {
                    "name": name,
                    "picture": picture,
                    "provider": "google"
                },
                "preferences": {
                    "theme": "light",
                    "notifications": True
                },
                "is_active": True
            }
            
            new_user = orm.users.create(user_data)
            user_dict = new_user.to_dict()
            
            return jsonify({
                "message": "Registration successful",
                "user": user_dict,
                "access_token": access_token,  # In production, generate your own JWT
                "user_id": user_dict['id']
            }), 201
            
    except Exception as e:
        return jsonify({"error": f"OAuth callback failed: {e}"}), 500

@oauth_bp.route("/google/userinfo", methods=["GET"])
def google_userinfo():
    """Get user info from Google access token"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header required"}), 401
        
        access_token = auth_header.split(" ")[1]
        
        # Get user info from Google
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_info_response.status_code != 200:
            return jsonify({"error": "Invalid access token"}), 401
        
        user_info = user_info_response.json()
        
        return jsonify({
            "user_info": user_info
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get user info: {e}"}), 500

@oauth_bp.route("/google/revoke", methods=["POST"])
def google_revoke():
    """Revoke Google access token"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header required"}), 401
        
        access_token = auth_header.split(" ")[1]
        
        # Revoke token with Google
        revoke_response = requests.post(
            'https://oauth2.googleapis.com/revoke',
            data={'token': access_token}
        )
        
        if revoke_response.status_code == 200:
            return jsonify({"message": "Token revoked successfully"}), 200
        else:
            return jsonify({"error": "Failed to revoke token"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Failed to revoke token: {e}"}), 500

@oauth_bp.route("/google/refresh", methods=["POST"])
def google_refresh():
    """Refresh Google access token"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({"error": "Refresh token required"}), 400
        
        # Exchange refresh token for new access token
        token_data = {
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data=token_data
        )
        
        if token_response.status_code != 200:
            return jsonify({"error": "Failed to refresh token"}), 400
        
        token_info = token_response.json()
        
        return jsonify({
            "access_token": token_info.get('access_token'),
            "expires_in": token_info.get('expires_in'),
            "token_type": token_info.get('token_type', 'Bearer')
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to refresh token: {e}"}), 500

@oauth_bp.route("/status", methods=["GET"])
def oauth_status():
    """Get OAuth configuration status"""
    try:
        return jsonify({
            "google_oauth": {
                "client_id": GOOGLE_CLIENT_ID,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "scopes": ["openid", "email", "profile"],
                "configured": bool(GOOGLE_CLIENT_SECRET)
            },
            "endpoints": {
                "login": "/oauth/google/login",
                "callback": "/oauth/google/callback",
                "userinfo": "/oauth/google/userinfo",
                "revoke": "/oauth/google/revoke",
                "refresh": "/oauth/google/refresh"
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get OAuth status: {e}"}), 500
