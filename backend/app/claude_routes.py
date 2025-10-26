import json
import os

import boto3
from flask import Blueprint, jsonify, request


# Create blueprint
claude_bp = Blueprint("claude", __name__)
MODEL = "anthropic.claude-haiku-4-5-20251001-v1:0"


def get_claude_response(message, system_prompt=None, max_tokens=1000):
    """
    Get a response from Claude Sonnet 3.5 via AWS Bedrock

    Args:
        message (str): The user message to send to Claude
        system_prompt (str, optional): Optional system prompt to set context
        max_tokens (int): Maximum tokens to generate (default: 1000)

    Returns:
        str: Claude's response text, or None if error
    """
    try:
        # Initialize the Bedrock client
        bedrock_runtime = boto3.client(
            service_name="bedrock-runtime", region_name="us-east-1"
        )

        # Build messages array
        messages = []
        if system_prompt:
            messages.append({"role": "user", "content": f"System: {system_prompt}"})
        messages.append({"role": "user", "content": message})

        # Prepare the request body
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "messages": messages,
        }

        # Call Claude using inference profile
        response = bedrock_runtime.invoke_model(
            body=json.dumps(request_body),
            modelId=f"us.{MODEL}",
        )

        # Parse the response
        response_body = json.loads(response["body"].read())

        # Extract and return the content
        if "content" in response_body and len(response_body["content"]) > 0:
            return response_body["content"][0]["text"]
        else:
            return None

    except Exception as e:
        print(f"Error calling Claude: {str(e)}")
        return None


@claude_bp.route("/claude/chat", methods=["POST"])
def chat_with_claude():
    """
    Chat with Claude Sonnet 3.5

    Request body:
    {
        "message": "Your message to Claude",
        "system_prompt": "Optional system prompt",
        "max_tokens": 1000
    }

    Returns:
    {
        "success": true,
        "response": "Claude's response",
        "error": null
    }
    """
    try:
        data = request.get_json()

        if not data or "message" not in data:
            return (
                jsonify(
                    {
                        "success": False,
                        "response": None,
                        "error": "Missing required field: message",
                    }
                ),
                400,
            )

        message = data["message"]
        system_prompt = data.get("system_prompt")
        max_tokens = data.get("max_tokens", 1000)

        # Get response from Claude
        response = get_claude_response(message, system_prompt, max_tokens)

        if response:
            return jsonify({"success": True, "response": response, "error": None})
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "response": None,
                        "error": "Failed to get response from Claude",
                    }
                ),
                500,
            )

    except Exception as e:
        return jsonify({"success": False, "response": None, "error": str(e)}), 500


@claude_bp.route("/claude/health", methods=["GET"])
def claude_health():
    """
    Check if Claude service is available
    """
    try:
        # Test with a simple message
        response = get_claude_response("Hello", max_tokens=10)

        if response:
            return jsonify(
                {"status": "healthy", "service": "claude-sonnet-3.5", "available": True}
            )
        else:
            return (
                jsonify(
                    {
                        "status": "unhealthy",
                        "service": "claude-sonnet-3.5",
                        "available": False,
                    }
                ),
                503,
            )

    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "service": "claude-sonnet-3.5",
                    "available": False,
                    "error": str(e),
                }
            ),
            503,
        )
