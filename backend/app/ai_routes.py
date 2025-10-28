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
            
            # Check for MAX_TOKENS finish reason
            finish_reason = candidate.get("finishReason")
            if finish_reason == "MAX_TOKENS":
                print(f"WARNING: Gemini response hit MAX_TOKENS limit. Consider increasing max_tokens parameter.")
            
            # Try to extract content from various response formats
            if "content" in candidate:
                content = candidate["content"]
                if "parts" in content and len(content["parts"]) > 0:
                    return content["parts"][0].get("text", "")
                elif "text" in content:
                    return content["text"]
            
            # If we hit MAX_TOKENS but got no content, return error message
            if finish_reason == "MAX_TOKENS":
                return None
        
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

        # Get review from AI (increased max_tokens to avoid truncation)
        response = get_ai_response(message, system_prompt, max_tokens=4000, provider=provider)

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
            # Get custom JAR libraries
            from app.libraries_routes import get_enabled_libraries
            jar_files = get_enabled_libraries('java')
            
            print(f"[Execute Java - ai_routes] Custom JAR files: {jar_files}")
            
            # Build classpath with custom libraries
            classpath = temp_dir
            if jar_files:
                classpath = temp_dir + os.pathsep + os.pathsep.join(jar_files)
                print(f"[Execute Java - ai_routes] Classpath: {classpath}")
            
            # Compile the Java code with custom libraries in classpath
            compile_cmd = ['javac', '-cp', classpath, source_file]
            print(f"[Execute Java - ai_routes] Compile command: {' '.join(compile_cmd)}")
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=10,  # 10 second compile timeout
                cwd=temp_dir
            )
            
            if compile_result.returncode != 0:
                # Compilation failed
                return None, f"Compilation Error:\n{compile_result.stderr}"
            
            # Execute the compiled program with custom libraries in classpath
            run_cmd = ['java', '-cp', classpath, class_name]
            run_result = subprocess.run(
                run_cmd,
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


def has_main_entry_point(code, language):
    """
    Detect if code has a main entry point (main method/function)
    
    Returns:
        bool: True if code has main entry point, False otherwise
    """
    language = language.lower()
    
    if language in ["python", "py"]:
        # Check for if __name__ == "__main__":
        return bool(re.search(r'if\s+__name__\s*==\s*["\']__main__["\']', code))
    
    elif language in ["javascript", "js"]:
        # JavaScript doesn't have a standard main, but check for common patterns
        # If code has function calls at top level or IIFE, consider it has entry point
        # For function-only code, there should be no top-level execution
        lines = code.split('\n')
        has_top_level_execution = False
        for line in lines:
            stripped = line.strip()
            # Skip comments and empty lines
            if not stripped or stripped.startswith('//') or stripped.startswith('/*'):
                continue
            # Skip function declarations and class declarations
            if stripped.startswith('function ') or stripped.startswith('class ') or stripped.startswith('const ') or stripped.startswith('let ') or stripped.startswith('var '):
                continue
            # If we find something else that's not a declaration, it's likely top-level execution
            if stripped and not stripped.startswith('}'):
                has_top_level_execution = True
                break
        return has_top_level_execution
    
    elif language == "java":
        # Check for public static void main
        return bool(re.search(r'public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w+\s*\)', code))
    
    elif language in ["cpp", "c++"]:
        # Check for int main or void main
        return bool(re.search(r'(int|void)\s+main\s*\(', code))
    
    return False


def generate_test_cases_with_ai(code, language, context="", provider=None):
    """
    Use AI to generate test cases for function-only code
    
    Args:
        code: The user's code (functions only)
        language: Programming language
        context: Optional context about what the code should do
        provider: AI provider to use (claude or gemini)
        
    Returns:
        list: Generated test cases in the format expected by run_test_cases
    """
    if provider is None:
        provider = DEFAULT_AI_PROVIDER
    
    system_prompt = f"""You are an expert programming instructor. Generate comprehensive test cases for the provided {language} code.

The code contains function/method definitions but no main entry point. Generate test cases that:
1. Test basic functionality
2. Test edge cases (empty inputs, zero, negative numbers, etc.)
3. Test boundary conditions
4. Cover common use cases

Return ONLY a JSON array of test cases in this exact format:
[
  {{
    "id": "test-1",
    "input": "code to call the function with specific inputs",
    "expectedOutput": "expected output as a string",
    "description": "brief description of what this tests"
  }}
]

For Python: Use print() statements to output results
For JavaScript: Use console.log() statements  
For Java: Create a simple main method that calls the functions
For C++: Create a simple main function that calls the functions

Generate 3-5 test cases. Be concise."""

    message = f"""Generate test cases for this {language} code:

```{language}
{code}
```
"""
    
    if context:
        message += f"\n\nContext: {context}"

    try:
        response = get_ai_response(message, system_prompt, max_tokens=1500, provider=provider)
        
        if response:
            # Extract JSON from response
            # Try to find JSON array in the response
            json_match = re.search(r'\[[\s\S]*\]', response)
            if json_match:
                test_cases = json.loads(json_match.group())
                print(f"Generated {len(test_cases)} test cases with AI ({provider})")
                return test_cases
            else:
                print("Could not extract JSON from AI response")
                return []
    except Exception as e:
        print(f"Error generating test cases with AI: {e}")
        return []
    
    return []


def run_test_cases(code, language, test_cases):
    """Run test cases against the code"""
    results = []
    
    for test in test_cases:
        test_id = test.get("id", "")
        test_input = test.get("input", "")
        expected_output = test.get("expectedOutput", "")
        
        # Simple approach: append the input to the code and capture output
        test_code = f"{code}\n{test_input}"
        
        if language in ["python", "py"]:
            output, error = execute_python_code(test_code)
        elif language in ["javascript", "js"]:
            output, error = execute_javascript_code(test_code)
        elif language == "java":
            output, error = execute_java_code(test_code)
        else:
            output, error = None, f"Test execution not supported for {language}"
        
        actual_output = (output or "").strip()
        expected = expected_output.strip()
        
        results.append({
            "id": test_id,
            "passed": actual_output == expected and not error,
            "actualOutput": actual_output if not error else f"Error: {error}",
            "expectedOutput": expected
        })
    
    return results


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
        # Extract user_id from token for custom library support
        from app.module_generator_routes import get_user_id_from_token
        user_id = get_user_id_from_token()
        if user_id:
            print(f"[Execute Code] Authenticated user: {user_id}")
        
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
        context = data.get("context", "")
        provider = data.get("provider", DEFAULT_AI_PROVIDER)

        if language not in ["javascript", "js", "python", "py", "cpp", "c++", "java"]:
            return (
                jsonify({
                    "success": False,
                    "output": None,
                    "error": f"Unsupported language: {language}",
                    "executionTime": 0,
                    "testResults": [],
                    "autoGeneratedTests": False
                }),
                400,
            )

        start_time = time.time()
        auto_generated_tests = False
        
        # Check if code has no main entry point and no test cases provided
        has_main = has_main_entry_point(code, language)
        print(f"[Execute Code] Language: {language}, Has main: {has_main}, Test cases provided: {len(test_cases) if test_cases else 0}")
        
        if not test_cases and not has_main:
            print(f"[Auto-Test] No main entry point detected in {language} code. Generating test cases with AI ({provider})...")
            test_cases = generate_test_cases_with_ai(code, language, context, provider)
            auto_generated_tests = len(test_cases) > 0
            if auto_generated_tests:
                print(f"[Auto-Test] Successfully generated {len(test_cases)} test cases")
                print(f"[Auto-Test] Test cases: {test_cases}")
            else:
                print(f"[Auto-Test] Failed to generate test cases")
        
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
        
        # Run test cases if provided or auto-generated
        test_results = []
        if test_cases and not error:
            test_results = run_test_cases(code, language, test_cases)
        
        if error:
            return jsonify({
                "success": False,
                "output": output,
                "error": error,
                "executionTime": execution_time,
                "testResults": test_results,
                "autoGeneratedTests": auto_generated_tests,
                "generatedTestCases": test_cases if auto_generated_tests else []
            }), 200
        
        return jsonify({
            "success": True,
            "output": output or "Code executed successfully (no output)",
            "error": None,
            "executionTime": execution_time,
            "testResults": test_results,
            "autoGeneratedTests": auto_generated_tests,
            "generatedTestCases": test_cases if auto_generated_tests else []
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "output": None,
            "error": str(e),
            "executionTime": 0,
            "testResults": [],
            "autoGeneratedTests": False,
            "generatedTestCases": []
        }), 500


@ai_bp.route("/claude/execute-code", methods=["POST"])
def execute_code_claude_alias():
    """Backward compatibility alias for /ai/execute-code"""
    return execute_code()


@ai_bp.route("/claude/grade-code", methods=["POST"])
def grade_code_claude_alias():
    """Backward compatibility alias for /ai/grade-code"""
    return grade_code()
