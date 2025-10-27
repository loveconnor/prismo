"""
Prismo Backend - Supabase Authentication Service

This module handles all authentication operations using Supabase Auth.
"""

from typing import Any, Dict, Optional
from app.supabase_config import supabase, supabase_admin
from app.orm_supabase import orm, User


class SupabaseAuthService:
    """Supabase authentication service"""

    def __init__(self):
        self.auth = supabase.auth
        self.admin_auth = supabase_admin.auth
        self.user_orm = orm.users
    
    def register_user(
        self, email: str, password: str, username: str, profile: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Register a new user with Supabase Auth"""
        if profile is None:
            profile = {}
        
        try:
            # Check if username is already taken
            existing_user = orm.users.get_by_key({"username": username})
            if existing_user:
                return {"success": False, "error": "Username already taken"}
            
            # Register user with Supabase Auth
            auth_response = self.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "username": username,
                        "display_name": profile.get("display_name", username)
                    }
                }
            })
            
            if not auth_response.user:
                return {"success": False, "error": "Failed to create auth user"}
            
            # Create user record in our users table
            user_data = {
                "auth_user_id": auth_response.user.id,
                "email": email,
                "username": username,
                "profile": profile or {},
                "is_active": True
            }
            
            user = self.user_orm.create(user_data)
            
            print(f"✓ Created user in database: {user.to_dict()}")
            
            return {
                "success": True,
                "user_id": auth_response.user.id,
                "email": email,
                "username": username,
                "confirmation_required": not auth_response.user.email_confirmed_at,
                "user_data": user.to_dict(),
                "session": {
                    "access_token": auth_response.session.access_token if auth_response.session else None,
                    "refresh_token": auth_response.session.refresh_token if auth_response.session else None
                } if auth_response.session else None
            }

        except Exception as e:
            error_message = str(e)
            
            # Handle common errors
            if "already registered" in error_message.lower() or "duplicate" in error_message.lower():
                return {"success": False, "error": "Email already registered"}
            elif "password" in error_message.lower():
                return {"success": False, "error": "Password does not meet requirements"}
            else:
                return {"success": False, "error": f"Registration failed: {error_message}"}
    
    def confirm_registration(
        self, email: str, confirmation_code: str
    ) -> Dict[str, Any]:
        """Confirm user registration with OTP"""
        try:
            # Verify email with OTP
            response = self.auth.verify_otp({
                "email": email,
                "token": confirmation_code,
                "type": "signup"
            })
            
            if response.user:
                return {
                    "success": True,
                    "message": "Email confirmed successfully",
                    "user_id": response.user.id
                }
            else:
                return {"success": False, "error": "Confirmation failed"}

        except Exception as e:
            error_message = str(e)
            
            if "invalid" in error_message.lower():
                return {"success": False, "error": "Invalid confirmation code"}
            elif "expired" in error_message.lower():
                return {"success": False, "error": "Confirmation code has expired"}
            else:
                return {"success": False, "error": f"Confirmation failed: {error_message}"}
    
    def resend_verification_code(self, email: str) -> Dict[str, Any]:
        """Resend verification code"""
        try:
            # Resend confirmation email
            response = self.auth.resend({
                "type": "signup",
                "email": email
            })
            
            return {
                "success": True,
                "message": "Verification code sent to your email"
            }

        except Exception as e:
            return {"success": False, "error": f"Failed to resend code: {str(e)}"}
    
    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return tokens"""
        try:
            # Sign in with Supabase Auth
            auth_response = self.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if not auth_response.user or not auth_response.session:
                return {"success": False, "error": "Invalid credentials"}
            
            # Get user data from our database
            user_data = orm.users.get_by_key({"auth_user_id": auth_response.user.id})
            
            if not user_data:
                return {"success": False, "error": "User profile not found"}
            
            return {
                "success": True,
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "id_token": auth_response.session.access_token,  # Use access_token as id_token for compatibility
                "expires_in": auth_response.session.expires_in,
                "user_data": user_data.to_dict(),  # Changed from "user" to "user_data"
                "auth_user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "email_confirmed": auth_response.user.email_confirmed_at is not None
                }
            }

        except Exception as e:
            error_message = str(e)
            
            if "invalid" in error_message.lower() or "credentials" in error_message.lower():
                return {"success": False, "error": "Invalid email or password"}
            elif "not confirmed" in error_message.lower():
                return {"success": False, "error": "Email not confirmed. Please check your email."}
            else:
                return {"success": False, "error": f"Authentication failed: {error_message}"}
    
    def refresh_session(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh user session"""
        try:
            response = self.auth.refresh_session(refresh_token)
            
            if not response.session:
                return {"success": False, "error": "Failed to refresh session"}
            
            # Get user data if available
            user_data = None
            if response.user:
                user_record = orm.users.get_by_key({"auth_user_id": response.user.id})
                if user_record:
                    user_data = user_record.to_dict()
            
            result = {
                "success": True,
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "expires_in": response.session.expires_in
            }
            
            # Include user data if available
            if user_data:
                result["user_data"] = user_data
            
            return result

        except Exception as e:
            return {"success": False, "error": f"Session refresh failed: {str(e)}"}
    
    def sign_out(self, access_token: str) -> Dict[str, Any]:
        """Sign out user"""
        try:
            # Set the session before signing out
            self.auth.set_session(access_token, access_token)
            self.auth.sign_out()
            
            return {"success": True, "message": "Signed out successfully"}

        except Exception as e:
            return {"success": False, "error": f"Sign out failed: {str(e)}"}
    
    def get_user_from_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user data from access token"""
        try:
            # Get user from token
            response = self.auth.get_user(access_token)
            
            if not response.user:
                return None
            
            # Get full user data from our database
            user_data = orm.users.get_by_key({"auth_user_id": response.user.id})
            
            if user_data:
                return user_data.to_dict()
            
            return None

        except Exception as e:
            print(f"Error getting user from token: {e}")
            return None
    
    def initiate_password_reset(self, email: str) -> Dict[str, Any]:
        """Send password reset email"""
        try:
            self.auth.reset_password_email(email)
            
            return {
                "success": True,
                "message": "Password reset email sent. Please check your inbox."
            }

        except Exception as e:
            return {"success": False, "error": f"Failed to send reset email: {str(e)}"}
    
    def update_password(self, access_token: str, new_password: str) -> Dict[str, Any]:
        """Update user password"""
        try:
            # Set session
            self.auth.set_session(access_token, access_token)
            
            # Update password
            response = self.auth.update_user({
                "password": new_password
            })
            
            if response.user:
                return {
                    "success": True,
                    "message": "Password updated successfully"
                }
            else:
                return {"success": False, "error": "Failed to update password"}

        except Exception as e:
            return {"success": False, "error": f"Password update failed: {str(e)}"}
    
    def update_user_profile(
        self, user_id: str, profile_updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user profile"""
        try:
            # Get current user
            user = orm.users.get_by_id(user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Update profile
            updated_user = orm.users.update(user_id, profile_updates)
            
            if updated_user:
                return {
                    "success": True,
                    "user": updated_user.to_dict()
                }
            else:
                return {"success": False, "error": "Failed to update profile"}

        except Exception as e:
            return {"success": False, "error": f"Profile update failed: {str(e)}"}
    
    def delete_user(self, user_id: str, access_token: str) -> Dict[str, Any]:
        """Delete user account"""
        try:
            # Get user to find auth_user_id
            user = orm.users.get_by_id(user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Delete from Supabase Auth (this will cascade to our tables via RLS)
            # Note: User deletion in Supabase requires admin privileges
            self.admin_auth.admin.delete_user(user.auth_user_id)
            
            return {
                "success": True,
                "message": "User account deleted successfully"
            }

        except Exception as e:
            return {"success": False, "error": f"Account deletion failed: {str(e)}"}
    
    def verify_token(self, access_token: str) -> Dict[str, Any]:
        """Verify if access token is valid and return user data"""
        try:
            response = self.auth.get_user(access_token)
            
            if not response.user:
                return {"success": False, "error": "Invalid token"}
            
            # Get user data from our database
            user_data = orm.users.get_by_key({"auth_user_id": response.user.id})
            
            if not user_data:
                return {"success": False, "error": "User profile not found"}
            
            return {
                "success": True,
                "user_data": user_data.to_dict()
            }
        except Exception as e:
            return {"success": False, "error": f"Token verification failed: {str(e)}"}


# Global auth service instance
auth_service = SupabaseAuthService()
