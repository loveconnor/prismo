import json
import os
import re

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


@claude_bp.route("/claude/execute-code", methods=["POST"])
def execute_code():
    """
    Execute JavaScript, Python, or C++ code in a sandboxed environment

    Request body:
    {
        "code": "Code to execute",
        "language": "javascript|python|cpp",
        "testCases": [
            {
                "id": "test-1",
                "input": "input value",
                "expectedOutput": "expected output",
                "description": "Test description"
            }
        ]
    }

    Returns:
    {
        "success": true,
        "output": "Program output",
        "error": null,
        "executionTime": 123,
        "testResults": [
            {
                "id": "test-1",
                "passed": true,
                "actualOutput": "actual output",
                "expectedOutput": "expected output"
            }
        ]
    }
    """
    try:
        import subprocess
        import tempfile
        import time
        
        data = request.get_json()

        if not data or "code" not in data:
            return (
                jsonify(
                    {
                        "success": False,
                        "output": None,
                        "error": "Missing required field: code",
                        "executionTime": 0,
                        "testResults": []
                    }
                ),
                400,
            )

        code = data["code"]
        language = data.get("language", "javascript").lower()
        test_cases = data.get("testCases", [])
        context = data.get("context", "")  # Optional context for test generation

        if language not in ["javascript", "js", "python", "py", "cpp", "c++", "java"]:
            return (
                jsonify(
                    {
                        "success": False,
                        "output": None,
                        "error": f"Unsupported language: {language}",
                        "executionTime": 0,
                        "testResults": [],
                        "autoGeneratedTests": False
                    }
                ),
                400,
            )

        start_time = time.time()
        auto_generated_tests = False
        
        # Check if code has no main entry point and no test cases provided
        if not test_cases and not has_main_entry_point(code, language):
            print(f"No main entry point detected in {language} code. Generating test cases with AI...")
            test_cases = generate_test_cases_with_ai(code, language, context)
            auto_generated_tests = len(test_cases) > 0
            if auto_generated_tests:
                print(f"Successfully generated {len(test_cases)} test cases")
        
        # Execute code based on language
        if language in ["python", "py"]:
            output, error = execute_python_code(code)
        elif language in ["cpp", "c++"]:
            output, error = execute_cpp_code(code)
        elif language == "java":
            output, error = execute_java_code(code)
        else:  # javascript or js
            output, error = execute_javascript_code(code)
        
        execution_time = int((time.time() - start_time) * 1000)  # Convert to ms
        
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
        print(f"ERROR in execute_code: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "output": None,
            "error": str(e),
            "executionTime": 0,
            "testResults": [],
            "autoGeneratedTests": False,
            "generatedTestCases": []
        }), 500


def execute_python_code(code):
    """Execute Python code in a subprocess with timeout"""
    import subprocess
    import tempfile
    
    try:
        # Create a temporary file for the Python code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute the Python code with a timeout
            result = subprocess.run(
                ['python3', temp_file],
                capture_output=True,
                text=True,
                timeout=5  # 5 second timeout
            )
            
            output = result.stdout
            error = result.stderr if result.returncode != 0 else None
            
            return output, error
            
        finally:
            # Clean up temp file
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
    """Execute JavaScript code using Node.js in a subprocess with timeout"""
    import subprocess
    import tempfile
    
    try:
        # Create a temporary file for the JavaScript code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute the JavaScript code with a timeout
            result = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=5  # 5 second timeout
            )
            
            output = result.stdout
            error = result.stderr if result.returncode != 0 else None
            
            return output, error
            
        finally:
            # Clean up temp file
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


def execute_cpp_code(code):
    """Compile and execute C++ code using g++ in a subprocess with timeout"""
    import subprocess
    import tempfile
    import os
    
    try:
        # Create a temporary directory for compilation
        temp_dir = tempfile.mkdtemp()
        source_file = os.path.join(temp_dir, 'program.cpp')
        executable_file = os.path.join(temp_dir, 'program')
        
        # Write the C++ code to a file
        with open(source_file, 'w') as f:
            f.write(code)
        
        try:
            # Compile the C++ code
            compile_result = subprocess.run(
                ['g++', '-std=c++17', source_file, '-o', executable_file],
                capture_output=True,
                text=True,
                timeout=10  # 10 second compile timeout
            )
            
            if compile_result.returncode != 0:
                # Compilation failed
                return None, f"Compilation Error:\n{compile_result.stderr}"
            
            # Execute the compiled program
            run_result = subprocess.run(
                [executable_file],
                capture_output=True,
                text=True,
                timeout=5  # 5 second execution timeout
            )
            
            output = run_result.stdout
            error = run_result.stderr if run_result.returncode != 0 else None
            
            return output, error
            
        finally:
            # Clean up temp files
            try:
                if os.path.exists(source_file):
                    os.unlink(source_file)
                if os.path.exists(executable_file):
                    os.unlink(executable_file)
                os.rmdir(temp_dir)
            except:
                pass
                
    except subprocess.TimeoutExpired:
        return None, "Error: Code execution timed out (5 second limit)"
    except FileNotFoundError:
        return None, "Error: g++ compiler is not installed on the server"
    except Exception as e:
        return None, f"Error executing C++ code: {str(e)}"


def execute_java_code(code):
    """Compile and execute Java code using javac and java in a subprocess with timeout"""
    import subprocess
    import tempfile
    import os
    import re
    
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
            
            print(f"[Execute Java] Custom JAR files: {jar_files}")
            
            # Build classpath with custom libraries
            classpath = temp_dir
            if jar_files:
                classpath = temp_dir + os.pathsep + os.pathsep.join(jar_files)
                print(f"[Execute Java] Classpath: {classpath}")
            
            # Compile the Java code with custom libraries in classpath
            compile_cmd = ['javac', '-cp', classpath, source_file]
            print(f"[Execute Java] Compile command: {' '.join(compile_cmd)}")
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


def run_test_cases(code, language, test_cases):
    """Run test cases against the code"""
    results = []
    
    for test in test_cases:
        test_id = test.get("id", "")
        test_input = test.get("input", "")
        expected_output = test.get("expectedOutput", "")
        
        # For now, we'll implement a basic test runner
        # In a real implementation, this would need more sophisticated handling
        # of function calls, input parameters, etc.
        
        # Simple approach: append the input to the code and capture output
        test_code = f"{code}\n{test_input}"
        
        if language in ["python", "py"]:
            output, error = execute_python_code(test_code)
        elif language in ["cpp", "c++"]:
            output, error = execute_cpp_code(test_code)
        elif language == "java":
            output, error = execute_java_code(test_code)
        else:
            output, error = execute_javascript_code(test_code)
        
        actual_output = (output or "").strip()
        expected = expected_output.strip()
        
        results.append({
            "id": test_id,
            "passed": actual_output == expected and not error,
            "actualOutput": actual_output if not error else f"Error: {error}",
            "expectedOutput": expected
        })
    
    return results


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


def generate_test_cases_with_ai(code, language, context=""):
    """
    Use AI to generate test cases for function-only code
    
    Args:
        code: The user's code (functions only)
        language: Programming language
        context: Optional context about what the code should do
        
    Returns:
        list: Generated test cases in the format expected by run_test_cases
    """
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
        response = get_claude_response(message, system_prompt, max_tokens=1500)
        
        if response:
            # Extract JSON from response
            # Try to find JSON array in the response
            json_match = re.search(r'\[[\s\S]*\]', response)
            if json_match:
                test_cases = json.loads(json_match.group())
                print(f"Generated {len(test_cases)} test cases with AI")
                return test_cases
            else:
                print("Could not extract JSON from AI response")
                return []
    except Exception as e:
        print(f"Error generating test cases with AI: {e}")
        return []
    
    return []


@claude_bp.route("/claude/grade-code", methods=["POST"])
def grade_code():
    """
    Grade user's code using AI to determine if it meets the requirements
    
    Request body:
    {
        "code": "User's code to grade",
        "language": "javascript|python|cpp",
        "requirements": "What the code should accomplish",
        "expectedOutput": "Optional expected output",
        "context": "Optional additional context"
    }
    
    Returns:
    {
        "success": true,
        "passed": true|false,
        "feedback": "AI feedback on the code",
        "refactoredCode": "Suggested improved version (if failed)",
        "suggestions": [
            {
                "type": "readability|performance|maintainability|correctness|simplicity",
                "title": "Suggestion title",
                "description": "Detailed description",
                "priority": "high|medium|low"
            }
        ]
    }
    """
    try:
        data = request.get_json()

        if not data or "code" not in data:
            return (
                jsonify(
                    {
                        "success": False,
                        "passed": False,
                        "feedback": "Missing required field: code",
                        "refactoredCode": None,
                        "suggestions": []
                    }
                ),
                400,
            )

        code = data["code"]
        language = data.get("language", "javascript").lower()
        requirements = data.get("requirements", "")
        expected_output = data.get("expectedOutput", "")
        context = data.get("context", "")

        # Build the grading prompt for Claude
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
            "title": "Brief title (e.g., 'Add return statement')",
            "description": "One clear sentence explaining what to fix. Max 20 words.",
            "priority": "high|medium|low"
        }}
    ]
}}

IMPORTANT: 
- Do NOT include a "refactoredCode" field
- Do NOT provide the solution code
- Feedback must be ONE sentence, max 15 words
- Each suggestion description must be ONE sentence, max 20 words
- Be direct and actionable

Grade the code as "passed": true if:
- It accomplishes the stated requirements
- It produces the expected output (if specified)
- It follows basic best practices for {language}
- It has no critical errors or bugs

Grade as "passed": false if:
- It doesn't meet the requirements
- It has bugs or errors
- It has serious performance or readability issues
- The logic is fundamentally flawed

In your suggestions, be specific about WHAT needs to be fixed but don't write the code for the student. Guide them to the solution."""

        # Call Claude for grading
        response = get_claude_response(
            message=grading_prompt,
            system_prompt="You are an expert code reviewer and educator. Provide helpful, constructive feedback in valid JSON format only.",
            max_tokens=2000
        )

        if not response:
            return jsonify({
                "success": False,
                "passed": False,
                "feedback": "Failed to get AI grading response",
                "refactoredCode": None,
                "suggestions": []
            }), 500

        # Parse the AI response
        try:
            # Extract JSON from the response (in case there's markdown formatting)
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                grade_data = json.loads(json_match.group())
            else:
                grade_data = json.loads(response)
            
            return jsonify({
                "success": True,
                "passed": grade_data.get("passed", False),
                "feedback": grade_data.get("feedback", ""),
                "refactoredCode": grade_data.get("refactoredCode", None),
                "suggestions": grade_data.get("suggestions", [])
            })

        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response as JSON: {str(e)}")
            print(f"Response was: {response}")
            return jsonify({
                "success": False,
                "passed": False,
                "feedback": f"AI response could not be parsed: {response[:200]}...",
                "refactoredCode": None,
                "suggestions": []
            }), 500

    except Exception as e:
        print(f"ERROR in grade_code: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "passed": False,
            "feedback": f"Error grading code: {str(e)}",
            "refactoredCode": None,
            "suggestions": []
        }), 500
