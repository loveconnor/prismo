import os

import boto3
from botocore.exceptions import ClientError
from config import Config


class AWSConfig:
    """AWS configuration and client management"""

    def __init__(self):
        self.region = os.getenv("AWS_REGION", "us-east-1")
        print(self.region)
        self.cognito_user_pool_id = os.getenv("COGNITO_USER_POOL_ID")
        self.cognito_client_id = os.getenv("COGNITO_CLIENT_ID")
        self.cognito_client_secret = os.getenv("COGNITO_CLIENT_SECRET")
        self.dynamodb_table_prefix = os.getenv("DYNAMODB_TABLE_PREFIX", "prismo")

        # Initialize AWS clients
        self._init_clients()

    def _init_clients(self):
        """Initialize AWS service clients"""
        try:
            # Check for AWS credentials
            aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
            aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
            aws_session_token = os.getenv("AWS_SESSION_TOKEN")
            aws_profile = os.getenv("AWS_PROFILE")
            
            # Log credential status (without exposing actual values)
            if aws_access_key_id:
                print("AWS credentials found in environment variables")
            elif aws_profile:
                print(f"Using AWS profile: {aws_profile}")
            else:
                print("Warning: No AWS credentials found. Using default credential chain.")
                print("Make sure to set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file")
            
            # Initialize clients with explicit credentials if provided
            client_kwargs = {"region_name": self.region}
            
            if aws_access_key_id and aws_secret_access_key:
                client_kwargs.update({
                    "aws_access_key_id": aws_access_key_id,
                    "aws_secret_access_key": aws_secret_access_key
                })
                if aws_session_token:
                    client_kwargs["aws_session_token"] = aws_session_token
            elif aws_profile:
                client_kwargs["profile_name"] = aws_profile
            
            self.dynamodb = boto3.client("dynamodb", **client_kwargs)
            self.dynamodb_resource = boto3.resource("dynamodb", **client_kwargs)
            self.cognito = boto3.client("cognito-idp", **client_kwargs)
            self.s3 = boto3.client("s3", **client_kwargs)

        except Exception as e:
            print(f"Error initializing AWS clients: {e}")
            print("Please check your AWS credentials in the .env file")
            raise

    def get_table_name(self, table_type):
        """Generate table name with prefix"""
        return f"{self.dynamodb_table_prefix}-{table_type}"

    def test_connection(self):
        """Test AWS connection"""
        try:
            # Test DynamoDB connection
            response = self.dynamodb.list_tables()
            print(
                f"DynamoDB connection successful. Found {len(response['TableNames'])} tables."
            )

            # Test Cognito connection
            if self.cognito_user_pool_id:
                response = self.cognito.describe_user_pool(
                    UserPoolId=self.cognito_user_pool_id
                )
                print(
                    f"Cognito connection successful. User Pool: {response['UserPool']['Name']}"
                )

            return True
        except ClientError as e:
            print(f"AWS connection error: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error: {e}")
            return False


# Global AWS configuration instance
aws_config = AWSConfig()
