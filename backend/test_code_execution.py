#!/usr/bin/env python3
"""
Test script for code execution endpoint
"""

import requests
import json

# Test data
BASE_URL = "http://localhost:5000/api/claude"

def test_python_execution():
    """Test Python code execution"""
    print("\n=== Testing Python Code Execution ===")
    
    code = """
# Simple Python test
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print(greet("Python"))
"""
    
    response = requests.post(
        f"{BASE_URL}/execute-code",
        json={
            "code": code,
            "language": "python"
        }
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Success: {result.get('success')}")
    print(f"Output:\n{result.get('output')}")
    print(f"Execution Time: {result.get('executionTime')}ms")
    if result.get('error'):
        print(f"Error: {result.get('error')}")


def test_javascript_execution():
    """Test JavaScript code execution"""
    print("\n=== Testing JavaScript Code Execution ===")
    
    code = """
// Simple JavaScript test
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet("World"));
console.log(greet("JavaScript"));
"""
    
    response = requests.post(
        f"{BASE_URL}/execute-code",
        json={
            "code": code,
            "language": "javascript"
        }
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Success: {result.get('success')}")
    print(f"Output:\n{result.get('output')}")
    print(f"Execution Time: {result.get('executionTime')}ms")
    if result.get('error'):
        print(f"Error: {result.get('error')}")


def test_python_with_tests():
    """Test Python code with test cases"""
    print("\n=== Testing Python Code with Test Cases ===")
    
    code = """
def add(a, b):
    return a + b

def multiply(a, b):
    return a * b
"""
    
    test_cases = [
        {
            "id": "test-1",
            "input": "print(add(2, 3))",
            "expectedOutput": "5",
            "description": "Test add function"
        },
        {
            "id": "test-2",
            "input": "print(multiply(4, 5))",
            "expectedOutput": "20",
            "description": "Test multiply function"
        }
    ]
    
    response = requests.post(
        f"{BASE_URL}/execute-code",
        json={
            "code": code,
            "language": "python",
            "testCases": test_cases
        }
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Success: {result.get('success')}")
    print(f"Output:\n{result.get('output')}")
    print(f"Execution Time: {result.get('executionTime')}ms")
    
    if result.get('testResults'):
        print("\nTest Results:")
        for test_result in result.get('testResults'):
            print(f"  {test_result['id']}: {'PASS' if test_result['passed'] else 'FAIL'}")
            print(f"    Expected: {test_result['expectedOutput']}")
            print(f"    Actual: {test_result['actualOutput']}")


def test_error_handling():
    """Test error handling"""
    print("\n=== Testing Error Handling ===")
    
    code = """
# This will cause an error
print(undefined_variable)
"""
    
    response = requests.post(
        f"{BASE_URL}/execute-code",
        json={
            "code": code,
            "language": "python"
        }
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Success: {result.get('success')}")
    print(f"Output: {result.get('output')}")
    print(f"Error: {result.get('error')}")


def test_cpp_execution():
    """Test C++ code execution"""
    print("\n=== Testing C++ Code Execution ===")
    
    code = """
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    cout << "2 + 2 = " << (2 + 2) << endl;
    return 0;
}
"""
    
    response = requests.post(
        f"{BASE_URL}/execute-code",
        json={
            "code": code,
            "language": "cpp"
        }
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Success: {result.get('success')}")
    print(f"Output:\n{result.get('output')}")
    print(f"Execution Time: {result.get('executionTime')}ms")
    if result.get('error'):
        print(f"Error: {result.get('error')}")


def test_cpp_with_tests():
    """Test C++ code with test cases"""
    print("\n=== Testing C++ Code with Test Cases ===")
    
    code = """
#include <iostream>
using namespace std;

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}
"""
    
    test_cases = [
        {
            "id": "test-1",
            "input": "int main() { cout << add(2, 3) << endl; return 0; }",
            "expectedOutput": "5",
            "description": "Test add function"
        },
        {
            "id": "test-2",
            "input": "int main() { cout << multiply(4, 5) << endl; return 0; }",
            "expectedOutput": "20",
            "description": "Test multiply function"
        }
    ]
    
    response = requests.post(
        f"{BASE_URL}/execute-code",
        json={
            "code": code,
            "language": "cpp",
            "testCases": test_cases
        }
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Success: {result.get('success')}")
    print(f"Output:\n{result.get('output')}")
    print(f"Execution Time: {result.get('executionTime')}ms")
    
    if result.get('testResults'):
        print("\nTest Results:")
        for test_result in result.get('testResults'):
            print(f"  {test_result['id']}: {'PASS' if test_result['passed'] else 'FAIL'}")
            print(f"    Expected: {test_result['expectedOutput']}")
            print(f"    Actual: {test_result['actualOutput']}")


if __name__ == "__main__":
    try:
        test_python_execution()
        test_javascript_execution()
        test_python_with_tests()
        test_cpp_execution()
        test_cpp_with_tests()
        test_error_handling()
        print("\n=== All Tests Completed ===")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend. Make sure the server is running on port 5000")
    except Exception as e:
        print(f"Error: {e}")
