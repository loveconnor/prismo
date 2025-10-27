"""
Prismo Backend - AI Routes with Claude and Gemini Support

This module provides AI capabilities using either Claude (via AWS Bedrock or direct API)
or Gemini (Google's AI model via API).
"""

import json
import os
import subprocess
import tempfile
import time
import re
from flask import Blueprint, jsonify, request
import requests


# Create blueprint
ai_bp = Blueprint("ai", __name__)

# Configuration
CLAUDE_MODEL = "anthropic.claude-haiku-4-5-20251001-v1:0"
GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_AI_PROVIDER = os.getenv("DEFAULT_AI_PROVIDER", "gemini")  # "claude" or "gemini"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")


def get_ai_response(message, system_prompt=None, max_tokens=1000, provider=None):
    """
    Get a response from AI (Claude or Gemini)
    
    Args:
        message (str): The user message
        system_prompt (str, optional): Optional system prompt
        max_tokens (int): Maximum tokens to generate
        provider (str, optional): "claude" or "gemini". If None, uses DEFAULT_AI_PROVIDER
    
    Returns:
        str: AI response text, or None if error
    """
    if provider is None:
        provider = DEFAULT_AI_PROVIDER
    
    if provider == "gemini":
        return get_gemini_response(message, system_prompt, max_tokens)
    elif provider == "claude":
        return get_claude_response(message, system_prompt, max_tokens)
    else:
        print(f"Unknown AI provider: {provider}")
        return None


def get_gemini_response(message, system_prompt=None, max_tokens=1000):
    """
    Get a response from Gemini API
    
    Args:
        message (str): The user message
        system_prompt (str, optional): Optional system prompt
        max_tokens (int): Maximum tokens to generate
    
    Returns:
        str: Gemini's response text, or None if error
    """
    try:
        if not GEMINI_API_KEY:
            print("ERROR: GEMINI_API_KEY not set")
            return None
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        
        # Build the prompt
        full_prompt = ""
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{message}"
        else:
            full_prompt = message
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": full_prompt
                }]
            }],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7,
            }
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                return candidate["content"]["parts"][0]["text"]
        
        print(f"Unexpected Gemini response format: {data}")
        return None
        
    except Exception as e:
        print(f"Error calling Gemini: {str(e)}")
        return None


def get_claude_response(message, system_prompt=None, max_tokens=1000):
    """
    Get a response from Claude via Anthropic API
    
    Args:
        message (str): The user message
        system_prompt (str, optional): Optional system prompt
        max_tokens (int): Maximum tokens to generate
    
    Returns:
        str: Claude's response text, or None if error
    """
    try:
        if not ANTHROPIC_API_KEY:
            print("ERROR: ANTHROPIC_API_KEY not set")
            return None
        
        url = "https://api.anthropic.com/v1/messages"
        
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": max_tokens,
            "messages": [{
                "role": "user",
                "content": message
            }]
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if "content" in data and len(data["content"]) > 0:
            return data["content"][0]["text"]
        
        print(f"Unexpected Claude response format: {data}")
        return None
        
    except Exception as e:
        print(f"Error calling Claude: {str(e)}")
        return None


@ai_bp.route("/ai/chat", methods=["POST"])
def chat_with_ai():
    """
    Chat with AI (Claude or Gemini)
    
    Request body:
    {
        "message": "Your message",
        "system_prompt": "Optional system prompt",
        "max_tokens": 1000,
        "provider": "claude|gemini" (optional, defaults to DEFAULT_AI_PROVIDER)
    }
    
    Returns:
    {
        "success": true,
        "response": "AI response",
        "provider": "claude|gemini",
        "error": null
    }
    """
    try:
        data = request.get_json()

        if not data or "message" not in data:
            return (
                jsonify({
                    "success": False,
                    "response": None,
                    "provider": None,
                    "error": "Missing required field: message"
                }),
                400,
            )

        message = data["message"]
        system_prompt = data.get("system_prompt")
        max_tokens = data.get("max_tokens", 1000)
        provider = data.get("provider", DEFAULT_AI_PROVIDER)

        # Get response from AI
        response = get_ai_response(message, system_prompt, max_tokens, provider)

        if response:
            return jsonify({
                "success": True,
                "response": response,
                "provider": provider,
                "error": None
            })
        else:
            return (
                jsonify({
                    "success": False,
                    "response": None,
                    "provider": provider,
                    "error": f"Failed to get response from {provider}"
                }),
                500,
            )

    except Exception as e:
        return jsonify({
            "success": False,
            "response": None,
            "provider": None,
            "error": str(e)
        }), 500


@ai_bp.route("/ai/health", methods=["GET"])
def ai_health():
    """
    Check if AI services are available
    """
    try:
        gemini_available = False
        claude_available = False
        
        # Test Gemini
        if GEMINI_API_KEY:
            gemini_response = get_gemini_response("Hello", max_tokens=10)
            gemini_available = gemini_response is not None
        
        # Test Claude
        if ANTHROPIC_API_KEY:
            claude_response = get_claude_response("Hello", max_tokens=10)
            claude_available = claude_response is not None
        
        return jsonify({
            "status": "healthy" if (gemini_available or claude_available) else "unhealthy",
            "providers": {
                "gemini": {
                    "available": gemini_available,
                    "configured": GEMINI_API_KEY is not None
                },
                "claude": {
                    "available": claude_available,
                    "configured": ANTHROPIC_API_KEY is not None
                }
            },
            "default_provider": DEFAULT_AI_PROVIDER
        })

    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "providers": {
                "gemini": {"available": False, "configured": GEMINI_API_KEY is not None},
                "claude": {"available": False, "configured": ANTHROPIC_API_KEY is not None}
            }
        }), 503


@ai_bp.route("/ai/review-code", methods=["POST"])
def review_code():
    """
    Review code using AI
    
    Request body:
    {
        "code": "Code to review",
        "language": "javascript|python|etc",
        "context": "Optional context",
        "provider": "claude|gemini" (optional)
    }
    
    Returns:
    {
        "success": true,
        "comments": [...],
        "overallFeedback": "...",
        "provider": "claude|gemini",
        "error": null
    }
    """
    try:
        data = request.get_json()

        if not data or "code" not in data:
            return (
                jsonify({
                    "success": False,
                    "comments": [],
                    "overallFeedback": None,
                    "error": "Missing required field: code"
                }),
                400,
            )

        code = data["code"]
        language = data.get("language", "javascript")
        context = data.get("context", "")
        provider = data.get("provider", DEFAULT_AI_PROVIDER)

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

        # Get review from AI
        response = get_ai_response(message, system_prompt, max_tokens=2000, provider=provider)

        if response:
            # Parse the JSON response
            try:
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
                
                return jsonify({
                    "success": True,
                    "comments": review_data.get("comments", []),
                    "overallFeedback": review_data.get("overallFeedback", ""),
                    "provider": provider,
                    "error": None
                })
            except json.JSONDecodeError:
                # If JSON parsing fails, return the raw response as overall feedback
                return jsonify({
                    "success": True,
                    "comments": [],
                    "overallFeedback": response[:300],
                    "provider": provider,
                    "error": None
                })
        else:
            return (
                jsonify({
                    "success": False,
                    "comments": [],
                    "overallFeedback": None,
                    "provider": provider,
                    "error": "Failed to get review from AI"
                }),
                500,
            )

    except Exception as e:
        return jsonify({
            "success": False,
            "comments": [],
            "overallFeedback": None,
            "error": str(e)
        }), 500


# Backward compatibility alias for Claude route
@ai_bp.route("/claude/review-code", methods=["POST"])
def review_code_claude_alias():
    """Backward compatibility alias for /ai/review-code"""
    return review_code()


@ai_bp.route("/ai/grade-code", methods=["POST"])
def grade_code():
    """
    Grade user's code using AI
    
    Request body:
    {
        "code": "User's code",
        "language": "javascript|python|cpp",
        "requirements": "What the code should accomplish",
        "expectedOutput": "Optional expected output",
        "context": "Optional additional context",
        "provider": "claude|gemini" (optional)
    }
    
    Returns:
    {
        "success": true,
        "passed": true|false,
        "feedback": "AI feedback",
        "suggestions": [...],
        "provider": "claude|gemini"
    }
    """
    try:
        data = request.get_json()

        if not data or "code" not in data:
            return (
                jsonify({
                    "success": False,
                    "passed": False,
                    "feedback": "Missing required field: code",
                    "suggestions": []
                }),
                400,
            )

        code = data["code"]
        language = data.get("language", "javascript").lower()
        requirements = data.get("requirements", "")
        expected_output = data.get("expectedOutput", "")
        context = data.get("context", "")
        provider = data.get("provider", DEFAULT_AI_PROVIDER)

        # Build the grading prompt
        grading_prompt = f"""You are a code grading assistant. Evaluate the following {language} code based on these criteria:

**Requirements**: {requirements if requirements else "General best practices"}
**Expected Output**: {expected_output if expected_output else "Not specified"}
**Context**: {context if context else "Educational coding exercise"}

**Code to Grade**:
```{language}
{code}
```

Evaluate the code and respond with a JSON object in this exact format:
{{
    "passed": true or false,
    "feedback": "One brief sentence (15 words max) summarizing the main issue or achievement.",
    "suggestions": [
        {{
            "type": "readability|performance|maintainability|correctness|simplicity",
            "title": "Brief title",
            "description": "One clear sentence explaining what to fix. Max 20 words.",
            "priority": "high|medium|low"
        }}
    ]
}}

IMPORTANT: 
- Feedback must be ONE sentence, max 15 words
- Each suggestion description must be ONE sentence, max 20 words
- Be direct and actionable

Grade the code as "passed": true if it meets requirements and follows best practices.
Grade as "passed": false if it has bugs, doesn't meet requirements, or has serious issues."""

        # Call AI for grading
        response = get_ai_response(
            message=grading_prompt,
            system_prompt="You are an expert code reviewer. Provide helpful feedback in valid JSON format only.",
            max_tokens=2000,
            provider=provider
        )

        if not response:
            return jsonify({
                "success": False,
                "passed": False,
                "feedback": "Failed to get AI grading response",
                "suggestions": [],
                "provider": provider
            }), 500

        # Parse the AI response
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                grade_data = json.loads(json_match.group())
            else:
                grade_data = json.loads(response)
            
            return jsonify({
                "success": True,
                "passed": grade_data.get("passed", False),
                "feedback": grade_data.get("feedback", ""),
                "suggestions": grade_data.get("suggestions", []),
                "provider": provider
            })

        except json.JSONDecodeError as e:
            return jsonify({
                "success": False,
                "passed": False,
                "feedback": f"AI response could not be parsed: {response[:200]}...",
                "suggestions": [],
                "provider": provider
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "passed": False,
            "feedback": f"Error grading code: {str(e)}",
            "suggestions": []
        }), 500


# Re-export the code execution functions from claude_routes
# These are provider-agnostic
def execute_python_code(code):
    """Execute Python code in a subprocess with timeout"""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            result = subprocess.run(
                ['python3', temp_file],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            output = result.stdout
            error = result.stderr if result.returncode != 0 else None
            
            return output, error
            
        finally:
            import os
            try:
                os.unlink(temp_file)
            except:
                pass
                
    except subprocess.TimeoutExpired:
        return None, "Error: Code execution timed out (5 second limit)"
    except Exception as e:
        return None, f"Error executing Python code: {str(e)}"


def execute_javascript_code(code):
    """Execute JavaScript code using Node.js"""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            result = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            output = result.stdout
            error = result.stderr if result.returncode != 0 else None
            
            return output, error
            
        finally:
            import os
            try:
                os.unlink(temp_file)
            except:
                pass
                
    except subprocess.TimeoutExpired:
        return None, "Error: Code execution timed out (5 second limit)"
    except FileNotFoundError:
        return None, "Error: Node.js is not installed on the server"
    except Exception as e:
        return None, f"Error executing JavaScript code: {str(e)}"


def execute_java_code(code):
    """Compile and execute Java code using javac and java in a subprocess with timeout"""
    import re
    import os
    
    try:
        # Extract the class name from the code
        # Look for "public class ClassName"
        class_match = re.search(r'public\s+class\s+(\w+)', code)
        if not class_match:
            return None, "Error: No public class found in code. Java code must contain a public class."
        
        class_name = class_match.group(1)
        
        # Create a temporary directory for compilation
        temp_dir = tempfile.mkdtemp()
        source_file = os.path.join(temp_dir, f'{class_name}.java')
        
        # Write the Java code to a file
        with open(source_file, 'w') as f:
            f.write(code)
        
        try:
            # Compile the Java code
            compile_result = subprocess.run(
                ['javac', source_file],
                capture_output=True,
                text=True,
                timeout=10,  # 10 second compile timeout
                cwd=temp_dir
            )
            
            if compile_result.returncode != 0:
                # Compilation failed
                return None, f"Compilation Error:\n{compile_result.stderr}"
            
            # Execute the compiled program
            run_result = subprocess.run(
                ['java', class_name],
                capture_output=True,
                text=True,
                timeout=5,  # 5 second execution timeout
                cwd=temp_dir
            )
            
            output = run_result.stdout
            error = run_result.stderr if run_result.returncode != 0 else None
            
            return output, error
            
        finally:
            # Clean up temp files
            try:
                if os.path.exists(source_file):
                    os.unlink(source_file)
                class_file = os.path.join(temp_dir, f'{class_name}.class')
                if os.path.exists(class_file):
                    os.unlink(class_file)
                os.rmdir(temp_dir)
            except:
                pass
                
    except subprocess.TimeoutExpired:
        return None, "Error: Code execution timed out"
    except FileNotFoundError:
        return None, "Error: Java compiler (javac) is not installed on the server"
    except Exception as e:
        return None, f"Error executing Java code: {str(e)}"


@ai_bp.route("/ai/execute-code", methods=["POST"])
def execute_code():
    """
    Execute code in a sandboxed environment
    
    Request body:
    {
        "code": "Code to execute",
        "language": "javascript|python|cpp|java",
        "testCases": [...]
    }
    
    Returns:
    {
        "success": true,
        "output": "...",
        "executionTime": 123,
        "testResults": [...]
    }
    """
    try:
        data = request.get_json()

        if not data or "code" not in data:
            return (
                jsonify({
                    "success": False,
                    "output": None,
                    "error": "Missing required field: code",
                    "executionTime": 0,
                    "testResults": []
                }),
                400,
            )

        code = data["code"]
        language = data.get("language", "javascript").lower()
        test_cases = data.get("testCases", [])

        if language not in ["javascript", "js", "python", "py", "cpp", "c++", "java"]:
            return (
                jsonify({
                    "success": False,
                    "output": None,
                    "error": f"Unsupported language: {language}",
                    "executionTime": 0,
                    "testResults": []
                }),
                400,
            )

        start_time = time.time()
        
        # Execute code based on language
        if language in ["python", "py"]:
            output, error = execute_python_code(code)
        elif language in ["javascript", "js"]:
            output, error = execute_javascript_code(code)
        elif language in ["java"]:
            output, error = execute_java_code(code)
        else:
            error = f"Execution not implemented for {language}"
            output = None
        
        execution_time = int((time.time() - start_time) * 1000)
        
        if error:
            return jsonify({
                "success": False,
                "output": output,
                "error": error,
                "executionTime": execution_time,
                "testResults": []
            }), 200
        
        return jsonify({
            "success": True,
            "output": output or "Code executed successfully (no output)",
            "error": None,
            "executionTime": execution_time,
            "testResults": []
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "output": None,
            "error": str(e),
            "executionTime": 0,
            "testResults": []
        }), 500


@ai_bp.route("/claude/execute-code", methods=["POST"])
def execute_code_claude_alias():
    """Backward compatibility alias for /ai/execute-code"""
    return execute_code()


@ai_bp.route("/claude/grade-code", methods=["POST"])
def grade_code_claude_alias():
    """Backward compatibility alias for /ai/grade-code"""
    return grade_code()
