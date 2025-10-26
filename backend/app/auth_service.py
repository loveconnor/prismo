import os
import hashlib
import hmac
import base64
from typing import Any, Dict, Optional

import boto3
from app.aws_config import aws_config
from app.models import User
from botocore.exceptions import ClientError


class CognitoAuthService:
    """Cognito authentication service"""

    def __init__(self):
        self.cognito = aws_config.cognito
        self.user_pool_id = aws_config.cognito_user_pool_id
        self.client_id = aws_config.cognito_client_id
        self.client_secret = aws_config.cognito_client_secret
        self.user_model = User()
    
    def _get_secret_hash(self, username: str) -> str:
        """Generate SECRET_HASH for Cognito operations"""
        if not self.client_secret:
            print("Warning: No client secret configured, but Cognito may require it")
            return None
        
        # Use the correct SECRET_HASH calculation from AWS docs
        message = username + self.client_id
        secret_hash = base64.b64encode(
            hmac.new(
                bytes(self.client_secret, 'utf-8'), 
                bytes(message, 'utf-8'), 
                digestmod=hashlib.sha256
            ).digest()
        ).decode()
        
        return secret_hash

    def register_user(
        self, email: str, password: str, username: str, profile: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Register a new user with Cognito"""
        if profile is None:
            profile = {}
        try:
            # Prepare sign up parameters
            sign_up_params = {
                "ClientId": self.client_id,
                "Username": username,  # Use username as the Cognito username
                "Password": password,
                "UserAttributes": [
                    {"Name": "email", "Value": email},
                    {"Name": "preferred_username", "Value": username},
                    {"Name": "nickname", "Value": username},  # Required attribute
                    {"Name": "name", "Value": profile.get("first_name", username) + " " + profile.get("last_name", "User")},  # Required attribute
                ],
            }
            
            # Add SECRET_HASH if client secret is configured
            secret_hash = self._get_secret_hash(username)  # Use username for secret hash
            if secret_hash:
                sign_up_params["SecretHash"] = secret_hash
            
            # Register user with Cognito
            response = self.cognito.sign_up(**sign_up_params)

            # Create user record in DynamoDB
            user_data = self.user_model.create_user(
                cognito_user_id=response["UserSub"],
                email=email,
                username=username,
                profile=profile or {},
            )
            
            print(f"DEBUG: Created user in DynamoDB: {user_data}")
            print(f"DEBUG: User email: {email}, username: {username}")

            return {
                "success": True,
                "user_sub": response["UserSub"],
                "confirmation_required": response.get("CodeDeliveryDetails"),
                "user_data": user_data,
            }

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "UsernameExistsException":
                return {"success": False, "error": "User already exists"}
            elif error_code == "InvalidPasswordException":
                return {
                    "success": False,
                    "error": "Password does not meet requirements",
                }
            else:
                return {"success": False, "error": f"Registration failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def confirm_registration(
        self, email: str, confirmation_code: str
    ) -> Dict[str, Any]:
        """Confirm user registration"""
        try:
            # First, we need to find the username associated with this email
            user_data = self.user_model.get_user_by_email(email)
            print(f"DEBUG: Looking up user by email: {email}")
            print(f"DEBUG: User data found: {user_data}")
            
            if not user_data:
                return {"success": False, "error": "User not found"}
            
            username = user_data.get('username')
            print(f"DEBUG: Username from user data: {username}")
            
            if not username:
                return {"success": False, "error": "Username not found for this email"}
            
            # Prepare confirm sign up parameters
            confirm_params = {
                "ClientId": self.client_id,
                "Username": username,  # Use username for confirmation
                "ConfirmationCode": confirmation_code,
            }
            
            # Add SECRET_HASH if client secret is configured
            secret_hash = self._get_secret_hash(username)
            if secret_hash:
                confirm_params["SecretHash"] = secret_hash
            
            response = self.cognito.confirm_sign_up(**confirm_params)

            return {"success": True, "message": "Registration confirmed successfully"}

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "CodeMismatchException":
                return {"success": False, "error": "Invalid confirmation code"}
            elif error_code == "ExpiredCodeException":
                return {"success": False, "error": "Confirmation code has expired"}
            else:
                return {"success": False, "error": f"Confirmation failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def resend_verification_code(self, email: str) -> Dict[str, Any]:
        """Resend verification code"""
        try:
            # First, we need to find the username associated with this email
            user_data = self.user_model.get_user_by_email(email)
            if not user_data:
                return {"success": False, "error": "User not found"}
            
            username = user_data.get('username')
            if not username:
                return {"success": False, "error": "Username not found for this email"}
            
            # Prepare resend parameters
            resend_params = {
                "ClientId": self.client_id,
                "Username": username
            }
            
            # Add SECRET_HASH if client secret is configured
            secret_hash = self._get_secret_hash(username)
            if secret_hash:
                resend_params["SecretHash"] = secret_hash
            
            response = self.cognito.resend_confirmation_code(**resend_params)

            return {
                "success": True,
                "message": "Verification code sent",
                "code_delivery": response.get("CodeDeliveryDetails"),
            }

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "UserNotFoundException":
                return {"success": False, "error": "User not found"}
            elif error_code == "InvalidParameterException":
                return {"success": False, "error": "User is already confirmed"}
            else:
                return {"success": False, "error": f"Resend failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return tokens"""
        try:
            # First, we need to find the username associated with this email
            # Since Cognito uses username as the login identifier, we need to look up the user
            print(f"DEBUG: Authenticating user with email: {email}")
            user_data = self.user_model.get_user_by_email(email)
            print(f"DEBUG: User data from DynamoDB: {user_data}")
            
            if not user_data:
                print(f"DEBUG: User not found in DynamoDB for email: {email}")
                return {"success": False, "error": "User not found"}
            
            username = user_data.get('username')
            print(f"DEBUG: Username from user data: {username}")
            
            if not username:
                print(f"DEBUG: Username not found in user data")
                return {"success": False, "error": "Username not found for this email"}
            
            # Prepare auth parameters for password auth
            auth_params = {
                "USERNAME": username,  # Use username for authentication
                "PASSWORD": password
            }
            
            # Add SECRET_HASH if client secret is configured
            secret_hash = self._get_secret_hash(username)
            if secret_hash:
                auth_params["SECRET_HASH"] = secret_hash
            
            # Try USER_PASSWORD_AUTH first (requires client configuration)
            try:
                response = self.cognito.initiate_auth(
                    ClientId=self.client_id,
                    AuthFlow="USER_PASSWORD_AUTH",  # Use password auth
                    AuthParameters=auth_params,
                )
            except Exception as e:
                if "USER_PASSWORD_AUTH flow not enabled" in str(e):
                    # Fallback to USER_AUTH (choice-based authentication)
                    print("USER_PASSWORD_AUTH not enabled, trying USER_AUTH...")
                    response = self.cognito.initiate_auth(
                        ClientId=self.client_id,
                        AuthFlow="USER_AUTH",  # Use choice-based auth
                        AuthParameters=auth_params,
                    )
                else:
                    raise e

            # Handle different response structures
            if "AuthenticationResult" in response:
                auth_result = response["AuthenticationResult"]
            elif "ChallengeName" in response:
                # This is a challenge-based response, not a direct authentication
                return {"success": False, "error": "Authentication requires additional challenges"}
            else:
                return {"success": False, "error": f"Unexpected response structure: {response}"}

            # Get user info
            user_info = self.cognito.get_user(AccessToken=auth_result["AccessToken"])

            # Get user from DynamoDB using email since we're now using email as username
            user_data = self.user_model.get_user_by_email(email)

            return {
                "success": True,
                "access_token": auth_result["AccessToken"],
                "refresh_token": auth_result["RefreshToken"],
                "id_token": auth_result["IdToken"],
                "user_data": user_data,
            }

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "NotAuthorizedException":
                return {"success": False, "error": "Invalid credentials"}
            elif error_code == "UserNotConfirmedException":
                return {"success": False, "error": "User not confirmed"}
            else:
                return {"success": False, "error": f"Authentication failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def refresh_token(self, refresh_token: str, username: str = None) -> Dict[str, Any]:
        """
        Refresh access token
        
        Args:
            refresh_token: The refresh token
            username: Optional username for SECRET_HASH calculation
        """
        try:
            # Prepare auth parameters
            auth_params = {"REFRESH_TOKEN": refresh_token}
            
            # Try to extract username from the refresh token if not provided
            if not username:
                import jwt
                try:
                    # Decode without verification to extract username
                    decoded = jwt.decode(refresh_token, options={"verify_signature": False})
                    username = decoded.get('username') or decoded.get('cognito:username')
                    if username:
                        print(f"DEBUG: Extracted username from refresh token: {username}")
                except Exception as decode_error:
                    print(f"DEBUG: Could not decode refresh token: {decode_error}")
            
            # Add SECRET_HASH if we have both client secret and username
            if username and self.client_secret:
                secret_hash = self._get_secret_hash(username)
                if secret_hash:
                    auth_params["SECRET_HASH"] = secret_hash
                    print(f"DEBUG: Added SECRET_HASH for user: {username}")
            elif self.client_secret:
                print("WARNING: Client secret is configured but no username available for SECRET_HASH")
            
            response = self.cognito.initiate_auth(
                ClientId=self.client_id,
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters=auth_params,
            )

            auth_result = response["AuthenticationResult"]

            return {
                "success": True,
                "access_token": auth_result["AccessToken"],
                "id_token": auth_result.get("IdToken"),
            }

        except ClientError as e:
            error_message = str(e)
            print(f"ERROR: Token refresh failed: {error_message}")
            
            # If SECRET_HASH mismatch, suggest re-login
            if "SecretHash does not match" in error_message:
                return {
                    "success": False, 
                    "error": "Token refresh failed due to authentication mismatch. Please log in again.",
                    "requires_reauth": True
                }
            
            return {"success": False, "error": f"Token refresh failed: {e}"}
        except Exception as e:
            print(f"ERROR: Unexpected error during token refresh: {e}")
            return {"success": False, "error": f"Unexpected error: {e}"}

    def forgot_password(self, email: str) -> Dict[str, Any]:
        """Initiate forgot password flow"""
        try:
            # Prepare forgot password parameters
            forgot_params = {
                "ClientId": self.client_id,
                "Username": email
            }
            
            # Add SECRET_HASH if client secret is configured
            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                forgot_params["SecretHash"] = secret_hash
            
            response = self.cognito.forgot_password(**forgot_params)

            return {
                "success": True,
                "message": "Password reset code sent",
                "code_delivery": response.get("CodeDeliveryDetails"),
            }

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "UserNotFoundException":
                return {"success": False, "error": "User not found"}
            else:
                return {"success": False, "error": f"Password reset failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def confirm_forgot_password(
        self, email: str, confirmation_code: str, new_password: str
    ) -> Dict[str, Any]:
        """Confirm password reset"""
        try:
            # Prepare confirm forgot password parameters
            confirm_params = {
                "ClientId": self.client_id,
                "Username": email,
                "ConfirmationCode": confirmation_code,
                "Password": new_password,
            }
            
            # Add SECRET_HASH if client secret is configured
            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                confirm_params["SecretHash"] = secret_hash
            
            response = self.cognito.confirm_forgot_password(**confirm_params)

            return {"success": True, "message": "Password reset successfully"}

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "CodeMismatchException":
                return {"success": False, "error": "Invalid confirmation code"}
            elif error_code == "ExpiredCodeException":
                return {"success": False, "error": "Confirmation code has expired"}
            else:
                return {"success": False, "error": f"Password reset failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def verify_token(self, access_token: str) -> Dict[str, Any]:
        """Verify access token and get user info"""
        try:
            print(f"DEBUG: Verifying token (first 30 chars): {access_token[:30]}...")
            
            # First try to decode as JWT to get user info directly
            import jwt
            try:
                # Decode without verification to get the payload
                decoded = jwt.decode(access_token, options={'verify_signature': False})
                user_id = decoded.get('sub')
                username = decoded.get('username')
                print(f"DEBUG: JWT decoded - user_id: {user_id}, username: {username}")
                
                if user_id and username:
                    # Get user from DynamoDB using the user ID
                    try:
                        user_data = self.user_model.get_user_by_cognito_id(user_id)
                        print(f"DEBUG: User data retrieved from DynamoDB: {bool(user_data)}")
                        
                        if user_data:
                            return {
                                "success": True, 
                                "user_data": user_data, 
                                "user_id": user_id,
                                "username": username,
                                "cognito_user": {"Username": username}
                            }
                        else:
                            print(f"WARNING: No user found in DynamoDB for user_id: {user_id}")
                            # Continue to Cognito verification as fallback
                    except Exception as db_error:
                        print(f"WARNING: DynamoDB lookup failed: {db_error}")
                        # Continue to Cognito verification as fallback
            except Exception as jwt_error:
                print(f"JWT decode failed: {jwt_error}")
            
            # Fallback to Cognito get_user method
            print("DEBUG: Falling back to Cognito get_user method")
            response = self.cognito.get_user(AccessToken=access_token)
            print(f"DEBUG: Cognito get_user succeeded for user: {response.get('Username')}")

            # Get user from DynamoDB
            user_data = self.user_model.get_user_by_cognito_id(response["Username"])

            return {"success": True, "user_data": user_data, "cognito_user": response}

        except ClientError as e:
            error_msg = f"Token verification failed: {e}"
            print(f"ERROR: {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Unexpected error: {e}"
            print(f"ERROR: {error_msg}")
            return {"success": False, "error": error_msg}

    def update_user_profile(
        self, access_token: str, profile_updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user profile"""
        try:
            # Update Cognito attributes
            user_attributes = []
            for key, value in profile_updates.items():
                if key in ["email", "name", "phone_number"]:
                    user_attributes.append({"Name": key, "Value": str(value)})

            if user_attributes:
                self.cognito.update_user_attributes(
                    AccessToken=access_token, UserAttributes=user_attributes
                )

            # Update DynamoDB user record
            user_info = self.cognito.get_user(AccessToken=access_token)
            user_data = self.user_model.get_user_by_cognito_id(user_info["Username"])

            if user_data:
                self.user_model.update_item(
                    {"cognito_user_id": user_info["Username"]},
                    {"profile": {**user_data.get("profile", {}), **profile_updates}},
                )

            return {"success": True, "message": "Profile updated successfully"}

        except ClientError as e:
            return {"success": False, "error": f"Profile update failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def handle_social_login(self, access_token: str, id_token: str = None) -> Dict[str, Any]:
        """Handle social login (Google OAuth via Cognito)"""
        try:
            import jwt
            
            print(f"DEBUG: Handling social login with access token")
            
            # Get user info from Cognito
            user_info = self.cognito.get_user(AccessToken=access_token)
            cognito_user_id = user_info["Username"]
            
            print(f"DEBUG: Cognito user ID: {cognito_user_id}")
            
            # Extract user attributes
            attributes = {attr["Name"]: attr["Value"] for attr in user_info["UserAttributes"]}
            email = attributes.get("email")
            name = attributes.get("name", "")
            picture = attributes.get("picture", "")
            
            print(f"DEBUG: User email: {email}, name: {name}")
            
            if not email:
                return {"success": False, "error": "Email not provided by social provider"}
            
            # Check if user already exists in DynamoDB
            existing_user = self.user_model.get_user_by_email(email)
            
            if existing_user:
                print(f"DEBUG: Existing user found: {existing_user.get('id')}")
                
                # Update last login and any missing profile info
                update_data = {}
                if not existing_user.get("cognito_user_id"):
                    update_data["cognito_user_id"] = cognito_user_id
                
                if picture and not existing_user.get("profile", {}).get("picture"):
                    if "profile" not in update_data:
                        update_data["profile"] = existing_user.get("profile", {})
                    update_data["profile"]["picture"] = picture
                    update_data["profile"]["provider"] = "google"
                
                if update_data:
                    self.user_model.update_item(
                        {"id": existing_user["id"]},
                        update_data
                    )
                    # Refresh user data
                    existing_user = self.user_model.get_by_id(existing_user["id"])
                
                return {
                    "success": True,
                    "user_data": existing_user,
                    "is_new_user": False
                }
            else:
                print(f"DEBUG: Creating new user for email: {email}")
                
                # Create new user in DynamoDB
                username = email.split('@')[0]
                
                # Check if username exists, append number if needed
                base_username = username
                counter = 1
                while self.user_model.get_user_by_username(username):
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user_data = self.user_model.create_user(
                    cognito_user_id=cognito_user_id,
                    email=email,
                    username=username,
                    profile={
                        "name": name,
                        "picture": picture,
                        "provider": "google"
                    }
                )
                
                print(f"DEBUG: New user created: {user_data.get('id')}")
                
                return {
                    "success": True,
                    "user_data": user_data,
                    "is_new_user": True
                }
                
        except ClientError as e:
            error_msg = f"Social login failed: {e}"
            print(f"ERROR: {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Unexpected error during social login: {e}"
            print(f"ERROR: {error_msg}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": error_msg}


# Global auth service instance
auth_service = CognitoAuthService()
