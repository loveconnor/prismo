import os
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
        self.user_model = User()

    def register_user(
        self, email: str, password: str, username: str, profile: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Register a new user with Cognito"""
        try:
            # Register user with Cognito
            response = self.cognito.sign_up(
                ClientId=self.client_id,
                Username=email,
                Password=password,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "preferred_username", "Value": username},
                ],
            )

            # Create user record in DynamoDB
            user_data = self.user_model.create_user(
                cognito_user_id=response["UserSub"],
                email=email,
                username=username,
                profile=profile or {},
            )

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
            response = self.cognito.confirm_sign_up(
                ClientId=self.client_id,
                Username=email,
                ConfirmationCode=confirmation_code,
            )

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

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return tokens"""
        try:
            response = self.cognito.initiate_auth(
                ClientId=self.client_id,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={"USERNAME": email, "PASSWORD": password},
            )

            auth_result = response["AuthenticationResult"]

            # Get user info
            user_info = self.cognito.get_user(AccessToken=auth_result["AccessToken"])

            # Get user from DynamoDB
            user_data = self.user_model.get_user_by_cognito_id(user_info["Username"])

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

    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        try:
            response = self.cognito.initiate_auth(
                ClientId=self.client_id,
                AuthFlow="REFRESH_TOKEN_AUTH",
                AuthParameters={"REFRESH_TOKEN": refresh_token},
            )

            auth_result = response["AuthenticationResult"]

            return {
                "success": True,
                "access_token": auth_result["AccessToken"],
                "id_token": auth_result.get("IdToken"),
            }

        except ClientError as e:
            return {"success": False, "error": f"Token refresh failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

    def forgot_password(self, email: str) -> Dict[str, Any]:
        """Initiate forgot password flow"""
        try:
            response = self.cognito.forgot_password(
                ClientId=self.client_id, Username=email
            )

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
            response = self.cognito.confirm_forgot_password(
                ClientId=self.client_id,
                Username=email,
                ConfirmationCode=confirmation_code,
                Password=new_password,
            )

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
            response = self.cognito.get_user(AccessToken=access_token)

            # Get user from DynamoDB
            user_data = self.user_model.get_user_by_cognito_id(response["Username"])

            return {"success": True, "user_data": user_data, "cognito_user": response}

        except ClientError as e:
            return {"success": False, "error": f"Token verification failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {e}"}

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


# Global auth service instance
auth_service = CognitoAuthService()
