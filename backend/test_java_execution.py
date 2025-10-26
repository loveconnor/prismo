#!/usr/bin/env python3
"""
Test script for Java code execution
This demonstrates the new Java compilation and execution functionality
"""

import requests
import json

# Test Java code
java_code = """
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Java execution is working!");
        
        // Test some basic operations
        int sum = 5 + 10;
        System.out.println("5 + 10 = " + sum);
    }
}
"""

# API endpoint
url = "http://localhost:5000/api/claude/execute-code"

# Request payload
payload = {
    "code": java_code,
    "language": "java",
    "testCases": []
}

print("=" * 60)
print("Testing Java Code Execution")
print("=" * 60)
print("\nCode to execute:")
print(java_code)
print("\n" + "=" * 60)
print("Sending request to backend...")
print("=" * 60)

try:
    response = requests.post(url, json=payload)
    result = response.json()
    
    print("\nResponse:")
    print(json.dumps(result, indent=2))
    
    if result.get("success"):
        print("\n✅ SUCCESS!")
        print("\nOutput:")
        print(result.get("output"))
        print(f"\nExecution time: {result.get('executionTime')}ms")
    else:
        print("\n❌ FAILED!")
        print(f"\nError: {result.get('error')}")
        
except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Could not connect to backend server")
    print("Make sure the backend is running on http://localhost:5000")
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")

print("\n" + "=" * 60)
