#!/usr/bin/env python3
"""
Test script to verify AWS configuration
"""

import os
import sys

from app.aws_config import aws_config


def test_aws_config():
    """Test AWS configuration and connection"""
    print("Testing AWS Configuration...")
    print(f"Region: {aws_config.region}")
    print(f"User Pool ID: {aws_config.cognito_user_pool_id}")
    print(f"Client ID: {aws_config.cognito_client_id}")
    print(f"Table Prefix: {aws_config.dynamodb_table_prefix}")

    print("\nTesting AWS Connection...")
    try:
        # Test connection
        success = aws_config.test_connection()
        if success:
            print("AWS connection successful!")
        else:
            print("AWS connection failed!")
            return False
    except Exception as e:
        print(f"Error testing AWS connection: {e}")
        return False

    print("\nTesting Cognito User Pool...")
    try:
        response = aws_config.cognito.describe_user_pool(
            UserPoolId=aws_config.cognito_user_pool_id
        )
        print(f"User Pool found: {response['UserPool']['Name']}")
        print(f"   Pool ID: {response['UserPool']['Id']}")
        if "Status" in response["UserPool"]:
            print(f"   Status: {response['UserPool']['Status']}")
        else:
            print(f"   Status: Available")
    except Exception as e:
        print(f"Error accessing Cognito User Pool: {e}")
        return False

    print("\nTesting DynamoDB...")
    try:
        response = aws_config.dynamodb.list_tables()
        print(f"DynamoDB connection successful!")
        print(f"   Found {len(response['TableNames'])} tables")

        # Check for our tables
        table_prefix = aws_config.dynamodb_table_prefix
        our_tables = [
            name for name in response["TableNames"] if name.startswith(table_prefix)
        ]
        print(f"   Our tables: {our_tables}")

    except Exception as e:
        print(f"Error accessing DynamoDB: {e}")
        return False

    print("\nAll AWS services are configured correctly!")
    return True


if __name__ == "__main__":
    success = test_aws_config()
    sys.exit(0 if success else 1)
