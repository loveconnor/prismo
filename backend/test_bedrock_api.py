#!/usr/bin/env python3
"""
Test script to verify Bedrock API token authentication
"""

import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_bedrock_api():
    """Test the Bedrock API with a simple prompt"""
    
    # Get the API token from environment
    bedrock_api_token = os.getenv("BEDROCK_API_TOKEN")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    
    if not bedrock_api_token:
        print("❌ Error: BEDROCK_API_TOKEN not found in environment variables")
        return False
    
    print("✓ Bedrock API token loaded")
    print(f"✓ Using region: {aws_region}")
    print("-" * 60)
    
    # Simple prompt for testing
    prompt = "Hello! Can you tell me a short joke about programming?"
    
    # Prepare the request body for Claude Sonnet 3.5
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [{"role": "user", "content": prompt}],
    }
    
    # AWS Bedrock endpoint
    url = f"https://bedrock-runtime.{aws_region}.amazonaws.com/model/us.anthropic.claude-3-5-sonnet-20241022-v2:0/invoke"
    
    # Headers with the Bearer token
    headers = {
        "Authorization": f"Bearer {bedrock_api_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    
    print(f"📡 Sending test prompt to Claude Sonnet 3.5...")
    print(f"   Prompt: {prompt}")
    print("-" * 60)
    
    try:
        # Make the API call
        response = requests.post(url, headers=headers, data=json.dumps(request_body))
        
        # Check if the request was successful
        if response.status_code == 200:
            response_body = response.json()
            
            # Extract and print the content
            if "content" in response_body and len(response_body["content"]) > 0:
                content = response_body["content"][0]["text"]
                print("✅ SUCCESS! Claude's response:")
                print("-" * 60)
                print(content)
                print("-" * 60)
                return True
            else:
                print("⚠️  No content found in response")
                print(f"Full response: {response_body}")
                return False
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing AWS Bedrock API Connection")
    print("=" * 60)
    
    success = test_bedrock_api()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Test PASSED - Bedrock API is working correctly!")
    else:
        print("❌ Test FAILED - Please check your credentials and try again")
    print("=" * 60)
