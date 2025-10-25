"""
Test Module Generator with STEVE API Integration

This test script uses hardcoded data to verify that the ModuleGenerator
correctly integrates with STEVE API and generates valid learning modules.
"""

import json
import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.ace.module_generator import ModuleGenerator
from setup_tables import setup_tables


# Hardcoded test data
TEST_USER_ID = "test_user_12345"
TEST_TOPIC = "JavaScript Array Methods"
TEST_SKILLS = ["programming", "javascript", "arrays", "problem-solving"]
TEST_DIFFICULTY = "beginner"
TEST_ESTIMATED_TIME = 1800


def print_separator(title=""):
    """Print a visual separator"""
    print("\n" + "=" * 80)
    if title:
        print(f"  {title}")
        print("=" * 80)
    print()


def print_module_summary(module):
    """Print a summary of the generated module"""
    print(f"Module ID: {module.get('id')}")
    print(f"Title: {module.get('title')}")
    print(f"Description: {module.get('description')}")
    print(f"Skills: {', '.join(module.get('skills', []))}")
    print(f"Estimated Duration: {module.get('estimated_duration')} seconds")
    print(f"Version: {module.get('version')}")
    print(f"\nNumber of Widgets: {len(module.get('widgets', []))}")
    
    print("\nWidgets in Module:")
    for i, widget in enumerate(module.get('widgets', []), 1):
        widget_id = widget.get('id', 'unknown')
        widget_title = widget.get('metadata', {}).get('title', 'Unknown')
        position = widget.get('position', i)
        print(f"  {position}. {widget_title} (id: {widget_id})")
    
    print("\nCompletion Criteria:")
    criteria = module.get('completion_criteria', {})
    print(f"  Required Widgets: {', '.join(criteria.get('required_widgets', []))}")
    print(f"  Min Completion %: {criteria.get('min_completion_percentage', 0)}%")
    print(f"  Max Attempts: {criteria.get('max_attempts', 0)}")
    print(f"  Time Limit: {criteria.get('time_limit', 0)} seconds")


async def test_basic_module_generation():
    """Test basic module generation with hardcoded data"""
    print_separator("TEST 1: Basic Module Generation")
    
    print("Testing ModuleGenerator.generate_module() with hardcoded data:")
    print(f"  User ID: {TEST_USER_ID}")
    print(f"  Topic: {TEST_TOPIC}")
    print(f"  Skills: {TEST_SKILLS}")
    print(f"  Difficulty: {TEST_DIFFICULTY}")
    print(f"  Estimated Time: {TEST_ESTIMATED_TIME}s")
    print()
    
    try:
        generator = ModuleGenerator()
        print("✓ ModuleGenerator initialized successfully")
        print(f"✓ Widget registry loaded: {len(generator.widget_registry)} widgets available")
        print()
        
        print("Calling STEVE API to generate module...")
        module = await generator.generate_module(
            user_id=TEST_USER_ID,
            topic=TEST_TOPIC,
            target_skills=TEST_SKILLS,
            difficulty=TEST_DIFFICULTY,
            estimated_time=TEST_ESTIMATED_TIME
        )
        
        print("✓ Module generated successfully!")
        print()
        
        print_separator("GENERATED MODULE SUMMARY")
        print_module_summary(module)
        
        print_separator("FULL MODULE JSON")
        print(json.dumps(module, indent=2))
        
        return module
        
    except Exception as e:
        print(f"✗ Error during module generation: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_personalized_module():
    """Test personalized module generation"""
    print_separator("TEST 2: Personalized Module Generation")
    
    print("Testing ModuleGenerator.create_personalized_module() with hardcoded user:")
    print(f"  User ID: {TEST_USER_ID}")
    print(f"  Learning Goal: problem-solving")
    print()
    
    try:
        generator = ModuleGenerator()
        print("✓ ModuleGenerator initialized successfully")
        print()
        
        print("Calling STEVE API to generate personalized module...")
        module = await generator.create_personalized_module(
            user_id=TEST_USER_ID,
            learning_goal="problem-solving"
        )
        
        print("✓ Personalized module generated successfully!")
        print()
        
        print_separator("PERSONALIZED MODULE SUMMARY")
        print_module_summary(module)
        
        print_separator("FULL PERSONALIZED MODULE JSON")
        print(json.dumps(module, indent=2))
        
        return module
        
    except Exception as e:
        print(f"✗ Error during personalized module generation: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_module_validation():
    """Test that generated modules meet validation requirements"""
    print_separator("TEST 3: Module Validation")
    
    try:
        generator = ModuleGenerator()
        print("Generating module to validate...")
        
        module = await generator.generate_module(
            user_id=TEST_USER_ID,
            topic="Python Basics",
            target_skills=["python", "programming"],
            difficulty="beginner",
            estimated_time=2400
        )
        
        print("✓ Module generated")
        print("\nValidating module structure...")
        
        # Check required fields
        required_fields = ["id", "title", "description", "skills", "widgets", 
                          "completion_criteria", "estimated_duration", "version"]
        
        validation_results = []
        for field in required_fields:
            if field in module:
                validation_results.append(f"  ✓ Field '{field}' present")
            else:
                validation_results.append(f"  ✗ Field '{field}' MISSING")
        
        print("\n".join(validation_results))
        
        # Check widgets structure
        print("\nValidating widgets...")
        if isinstance(module.get("widgets"), list) and len(module["widgets"]) > 0:
            print(f"  ✓ Module has {len(module['widgets'])} widgets")
            
            for i, widget in enumerate(module["widgets"], 1):
                required_widget_fields = ["id", "metadata", "props", "position", "dependencies_met"]
                missing_fields = [f for f in required_widget_fields if f not in widget]
                
                if missing_fields:
                    print(f"  ✗ Widget {i} missing fields: {missing_fields}")
                else:
                    print(f"  ✓ Widget {i} ({widget.get('id')}) valid")
        else:
            print("  ✗ No valid widgets found")
        
        print("\n" + "=" * 80)
        print("  VALIDATION COMPLETE")
        print("=" * 80)
        
        return module
        
    except Exception as e:
        print(f"✗ Error during validation test: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_different_topics():
    """Test module generation with different topics and skills"""
    print_separator("TEST 4: Multiple Topic Generation")
    
    test_cases = [
        {
            "topic": "React Hooks",
            "skills": ["javascript", "react", "web-development"],
            "difficulty": "intermediate"
        },
        {
            "topic": "Algebraic Equations",
            "skills": ["mathematics", "algebra", "problem-solving"],
            "difficulty": "beginner"
        },
        {
            "topic": "Python Data Structures",
            "skills": ["python", "programming", "data-structures"],
            "difficulty": "intermediate"
        }
    ]
    
    generator = ModuleGenerator()
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}/{len(test_cases)}:")
        print(f"  Topic: {test_case['topic']}")
        print(f"  Skills: {test_case['skills']}")
        print(f"  Difficulty: {test_case['difficulty']}")
        
        try:
            module = await generator.generate_module(
                user_id=TEST_USER_ID,
                topic=test_case['topic'],
                target_skills=test_case['skills'],
                difficulty=test_case['difficulty'],
                estimated_time=1800
            )
            
            print(f"  ✓ Generated: {module.get('title')}")
            print(f"  ✓ Widgets: {len(module.get('widgets', []))}")
            results.append({"success": True, "module": module})
            
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            results.append({"success": False, "error": str(e)})
    
    print("\n" + "=" * 80)
    print(f"  RESULTS: {sum(1 for r in results if r['success'])}/{len(results)} tests passed")
    print("=" * 80)
    
    return results


async def test_synchronous_wrappers():
    """Test synchronous wrapper methods"""
    print_separator("TEST 5: Synchronous Wrapper Methods")
    
    print("Testing generate_module_sync()...")
    try:
        generator = ModuleGenerator()
        
        # This will internally use asyncio.run()
        module = generator.generate_module_sync(
            user_id=TEST_USER_ID,
            topic="Testing Synchronous Generation",
            target_skills=["testing", "python"],
            difficulty="beginner",
            estimated_time=1200
        )
        
        print(f"✓ Sync generation successful: {module.get('title')}")
        print(f"✓ Module has {len(module.get('widgets', []))} widgets")
        
        return True
        
    except Exception as e:
        print(f"✗ Synchronous wrapper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """Run all test cases"""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "MODULE GENERATOR TEST SUITE" + " " * 31 + "║")
    print("║" + " " * 25 + "STEVE API Integration" + " " * 32 + "║")
    print("╚" + "=" * 78 + "╝")
    
    # Check environment variables
    print_separator("Environment Check")
    steve_url = os.getenv("STEVE_API_URL")
    steve_key = os.getenv("STEVE_API_KEY")
    
    print(f"STEVE_API_URL: {steve_url if steve_url else '❌ NOT SET'}")
    print(f"STEVE_API_KEY: {'✓ SET' if steve_key else '❌ NOT SET'}")
    
    if not steve_key:
        print("\n⚠️  WARNING: STEVE_API_KEY not set. Tests may fail or use fallback modules.")
        print("   Set STEVE_API_KEY in your .env file to test actual API integration.")
    
    print()
    
    # Run tests
    test_results = []
    
    # Test 1: Basic generation
    result1 = await test_basic_module_generation()
    test_results.append(("Basic Generation", result1 is not None))
    
    # Test 2: Personalized module
    result2 = await test_personalized_module()
    test_results.append(("Personalized Module", result2 is not None))
    
    # Test 3: Validation
    result3 = await test_module_validation()
    test_results.append(("Module Validation", result3 is not None))
    
    # Test 4: Multiple topics
    result4 = await test_different_topics()
    test_results.append(("Multiple Topics", all(r.get("success", False) for r in result4) if result4 else False))
    
    # Test 5: Synchronous wrappers
    result5 = await test_synchronous_wrappers()
    test_results.append(("Synchronous Wrappers", result5))
    
    # Print final summary
    print_separator("FINAL TEST SUMMARY")
    
    passed = sum(1 for _, success in test_results if success)
    total = len(test_results)
    
    for test_name, success in test_results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status:8} - {test_name}")
    
    print()
    print(f"TOTAL: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check output above for details.")
    
    print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    print("\nStarting Module Generator Tests...")
    print("Using hardcoded test data to verify STEVE API integration\n")
    
    # Setup DynamoDB tables first
    print("Setting up DynamoDB tables...")
    try:
        setup_tables()
        print("✓ DynamoDB tables ready\n")
    except Exception as e:
        print(f"⚠️  Warning: Could not setup tables: {e}")
        print("Tables may already exist or AWS credentials may not be configured.\n")
    
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
    except Exception as e:
        print(f"\n\nFatal error running tests: {e}")
        import traceback
        traceback.print_exc()
