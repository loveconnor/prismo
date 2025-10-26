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


@claude_bp.route("/claude/review-code", methods=["POST"])
def review_code():
    """
    Review code using Claude AI

    Request body:
    {
        "code": "Code to review",
        "language": "javascript|python|etc",
        "context": "Optional context about what the code should do"
    }

    Returns:
    {
        "success": true,
        "comments": [
            {
                "lineNumber": 5,
                "type": "suggestion|warning|error|info",
                "message": "Review comment",
                "title": "Brief title"
            }
        ],
        "overallFeedback": "Overall assessment",
        "error": null
    }
    """
    try:
        print("=== Code Review Request Received ===")
        data = request.get_json()
        print(f"Request data keys: {data.keys() if data else 'None'}")

        if not data or "code" not in data:
            print("ERROR: Missing code field")
            return (
                jsonify(
                    {
                        "success": False,
                        "comments": [],
                        "overallFeedback": None,
                        "error": "Missing required field: code",
                    }
                ),
                400,
            )

        code = data["code"]
        language = data.get("language", "javascript")
        context = data.get("context", "")

        print(f"Code length: {len(code)} chars")
        print(f"Language: {language}")
        print(f"Context: {context}")

        # Build the system prompt for code review
        system_prompt = f"""You are an expert code reviewer and programming instructor.
Review the provided {language} code and provide constructive feedback.

Focus on:
- Code correctness and potential bugs
- Best practices and style
- Performance optimization opportunities
- Security concerns
- Educational insights for learning

Return your review as a JSON object with this structure:
{{
    "comments": [
        {{
            "lineNumber": <number>,
            "type": "suggestion|warning|error|info",
            "title": "Brief title (max 50 chars)",
            "message": "Detailed feedback (max 200 chars)"
        }}
    ],
    "overallFeedback": "Brief overall assessment (max 300 chars)"
}}

Be concise, friendly, and educational. Limit to 3-5 most important comments."""

        # Build the message
        message = f"""Review this {language} code:

```{language}
{code}
```
"""
        
        if context:
            message += f"\n\nContext: {context}"

        print("Calling Claude AI...")
        # Get review from Claude
        response = get_claude_response(message, system_prompt, max_tokens=2000)
        print(f"Claude response received: {len(response) if response else 0} chars")

        if response:
            # Parse the JSON response
            try:
                print("Parsing Claude response...")
                # Extract JSON from markdown code blocks if present
                if "```json" in response:
                    json_start = response.find("```json") + 7
                    json_end = response.find("```", json_start)
                    response = response[json_start:json_end].strip()
                elif "```" in response:
                    json_start = response.find("```") + 3
                    json_end = response.find("```", json_start)
                    response = response[json_start:json_end].strip()
                
                review_data = json.loads(response)
                print(f"Successfully parsed review with {len(review_data.get('comments', []))} comments")
                
                return jsonify({
                    "success": True,
                    "comments": review_data.get("comments", []),
                    "overallFeedback": review_data.get("overallFeedback", ""),
                    "error": None
                })
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print(f"Raw response: {response[:200]}...")
                # If JSON parsing fails, return the raw response as overall feedback
                return jsonify({
                    "success": True,
                    "comments": [],
                    "overallFeedback": response[:300],  # Limit length
                    "error": None
                })
        else:
            print("ERROR: No response from Claude")
            return (
                jsonify(
                    {
                        "success": False,
                        "comments": [],
                        "overallFeedback": None,
                        "error": "Failed to get review from AI",
                    }
                ),
                500,
            )

    except Exception as e:
        print(f"ERROR in review_code: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "comments": [],
            "overallFeedback": None,
            "error": str(e)
        }), 500
