#!/usr/bin/env python3
"""
Script to help set up AWS credentials for Prismo backend
"""

import os
import sys
from pathlib import Path

def setup_aws_credentials():
    """Interactive setup for AWS credentials"""
    print("🔧 Prismo AWS Credentials Setup")
    print("=" * 40)
    
    # Check if .env file exists
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ .env file not found!")
        print("Please create a .env file first with your basic configuration.")
        return False
    
    # Read current .env content
    with open(env_path, 'r') as f:
        content = f.read()
    
    # Check if credentials are already set
    if "AWS_ACCESS_KEY_ID=" in content and "your_access_key_here" not in content:
        print("✅ AWS credentials already configured!")
        return True
    
    print("\n📋 You need to provide your AWS credentials.")
    print("You can get these from:")
    print("1. AWS Console → IAM → Users → Your User → Security credentials")
    print("2. AWS CLI: `aws configure list`")
    print("3. AWS SSO: `aws sso login`")
    
    print("\n🔑 Enter your AWS credentials:")
    access_key = input("AWS Access Key ID: ").strip()
    secret_key = input("AWS Secret Access Key: ").strip()
    session_token = input("AWS Session Token (optional, press Enter to skip): ").strip()
    
    if not access_key or not secret_key:
        print("❌ Access Key ID and Secret Access Key are required!")
        return False
    
    # Update .env file
    lines = content.split('\n')
    updated_lines = []
    
    for line in lines:
        if line.startswith("AWS_ACCESS_KEY_ID="):
            updated_lines.append(f"AWS_ACCESS_KEY_ID={access_key}")
        elif line.startswith("AWS_SECRET_ACCESS_KEY="):
            updated_lines.append(f"AWS_SECRET_ACCESS_KEY={secret_key}")
        elif line.startswith("AWS_SESSION_TOKEN="):
            if session_token:
                updated_lines.append(f"AWS_SESSION_TOKEN={session_token}")
            else:
                updated_lines.append("# AWS_SESSION_TOKEN=  # Not needed for permanent credentials")
        else:
            updated_lines.append(line)
    
    # Add credentials if they don't exist
    if not any(line.startswith("AWS_ACCESS_KEY_ID=") for line in lines):
        updated_lines.append(f"AWS_ACCESS_KEY_ID={access_key}")
    if not any(line.startswith("AWS_SECRET_ACCESS_KEY=") for line in lines):
        updated_lines.append(f"AWS_SECRET_ACCESS_KEY={secret_key}")
    if session_token and not any(line.startswith("AWS_SESSION_TOKEN=") for line in lines):
        updated_lines.append(f"AWS_SESSION_TOKEN={session_token}")
    
    # Write updated content
    with open(env_path, 'w') as f:
        f.write('\n'.join(updated_lines))
    
    print("\n✅ AWS credentials have been added to your .env file!")
    print("\n🧪 Testing AWS connection...")
    
    # Test the connection
    try:
        from app.aws_config import aws_config
        success = aws_config.test_connection()
        if success:
            print("🎉 AWS connection successful!")
            return True
        else:
            print("❌ AWS connection failed. Please check your credentials.")
            return False
    except Exception as e:
        print(f"❌ Error testing connection: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Prismo AWS Credentials Setup")
        print("Usage: python setup_aws_credentials.py")
        print("\nThis script will help you configure AWS credentials for your Prismo backend.")
        return
    
    try:
        success = setup_aws_credentials()
        if success:
            print("\n🚀 You're all set! Your Prismo backend should now be able to connect to AWS services.")
        else:
            print("\n💡 If you need help, check the AWS_CREDENTIALS_SETUP.md file for detailed instructions.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Setup cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
