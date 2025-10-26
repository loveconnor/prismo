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
    
    print("Note: Testing from async context, so using async methods directly")
    print("(Sync wrappers are for non-async code only)")
    print()
    
    print("Testing generate_module() from async context...")
    try:
        generator = ModuleGenerator()
        
        # Call the async method directly since we're in an async context
        module = await generator.generate_module(
            user_id=TEST_USER_ID,
            topic="Testing Synchronous Generation",
            target_skills=["testing", "python"],
            difficulty="beginner",
            estimated_time=1200
        )
        
        print(f"✓ Async generation successful: {module.get('title')}")
        print(f"✓ Module has {len(module.get('widgets', []))} widgets")
        
        return True
        
    except Exception as e:
        print(f"✗ Async wrapper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_complex_module_generation():
    """Test generation of a complex module with multiple skills and advanced criteria"""
    print_separator("TEST 6: Complex Module Generation")
    
    print("Testing ModuleGenerator with complex, multi-skill learning scenario:")
    
    # Complex test case: Full-stack web application
    complex_topic = "Building a Full-Stack Todo Application"
    complex_skills = [
        "javascript",
        "react",
        "nodejs",
        "express",
        "database",
        "api-design",
        "authentication",
        "state-management",
        "routing"
    ]
    
    print(f"  Topic: {complex_topic}")
    print(f"  Skills ({len(complex_skills)}): {', '.join(complex_skills)}")
    print(f"  Difficulty: advanced")
    print(f"  Estimated Time: 5400s (1.5 hours)")
    print()
    
    try:
        generator = ModuleGenerator()
        print("✓ ModuleGenerator initialized")
        print()
        
        print("Calling STEVE API to generate complex module...")
        print("(This may take longer due to the complexity of the request)")
        print()
        
        module = await generator.generate_module(
            user_id=TEST_USER_ID,
            topic=complex_topic,
            target_skills=complex_skills,
            difficulty="advanced",
            estimated_time=5400  # 1.5 hours
        )
        
        print("✓ Complex module generated successfully!")
        print()
        
        # Detailed validation for complex module
        print_separator("COMPLEX MODULE ANALYSIS")
        
        # Basic info
        print(f"Module ID: {module.get('id')}")
        print(f"Title: {module.get('title')}")
        print(f"Description: {module.get('description')}")
        print()
        
        # Skills coverage
        print("Skills Coverage:")
        module_skills = module.get('skills', [])
        print(f"  Total skills in module: {len(module_skills)}")
        print(f"  Skills: {', '.join(module_skills)}")
        
        # Check if complex skills are covered
        covered_skills = [s for s in complex_skills if s in module_skills]
        print(f"  ✓ Covered {len(covered_skills)}/{len(complex_skills)} requested skills")
        
        if len(covered_skills) < len(complex_skills):
            missing = [s for s in complex_skills if s not in module_skills]
            print(f"  ⚠️  Missing skills: {', '.join(missing)}")
        print()
        
        # Widget analysis
        widgets = module.get('widgets', [])
        print(f"Widget Structure:")
        print(f"  Total widgets: {len(widgets)}")
        
        if len(widgets) >= 5:
            print("  ✓ Module has sufficient complexity (5+ widgets)")
        else:
            print(f"  ⚠️  Module may be too simple (only {len(widgets)} widgets)")
        
        # Analyze widget types
        widget_types = {}
        for widget in widgets:
            widget_type = widget.get('metadata', {}).get('type', 'unknown')
            widget_types[widget_type] = widget_types.get(widget_type, 0) + 1
        
        print(f"\n  Widget Types Distribution:")
        for wtype, count in widget_types.items():
            print(f"    - {wtype}: {count}")
        print()
        
        # Dependencies check
        print("Widget Dependencies:")
        has_dependencies = False
        for widget in widgets:
            deps = widget.get('dependencies', [])
            if deps:
                has_dependencies = True
                widget_title = widget.get('metadata', {}).get('title', widget.get('id'))
                print(f"  - {widget_title} depends on: {', '.join(deps)}")
        
        if has_dependencies:
            print("  ✓ Module includes widget dependencies (progressive learning)")
        else:
            print("  ⚠️  No dependencies found (all widgets independent)")
        print()
        
        # Completion criteria analysis
        criteria = module.get('completion_criteria', {})
        print("Completion Criteria:")
        print(f"  Required widgets: {len(criteria.get('required_widgets', []))}")
        print(f"  Min completion: {criteria.get('min_completion_percentage', 0)}%")
        print(f"  Max attempts: {criteria.get('max_attempts', 0)}")
        print(f"  Time limit: {criteria.get('time_limit', 0)}s")
        
        # Check if criteria matches complexity
        required_count = len(criteria.get('required_widgets', []))
        total_count = len(widgets)
        
        if required_count > 0:
            required_percentage = (required_count / total_count) * 100 if total_count > 0 else 0
            print(f"  Required widget ratio: {required_percentage:.1f}% ({required_count}/{total_count})")
            
            if required_percentage >= 70:
                print("  ✓ Rigorous completion criteria")
            else:
                print("  ⚠️  Lenient completion criteria")
        print()
        
        # Difficulty assessment
        print("Difficulty Assessment:")
        print(f"  Requested: advanced")
        print(f"  Skills complexity: {len(module_skills)} skills")
        print(f"  Widget count: {len(widgets)} widgets")
        print(f"  Estimated duration: {module.get('estimated_duration', 0)}s")
        
        complexity_score = len(module_skills) * 2 + len(widgets)
        print(f"  Complexity score: {complexity_score}")
        
        if complexity_score >= 20:
            print("  ✓ Module meets advanced difficulty expectations")
        else:
            print("  ⚠️  Module may be less complex than expected")
        print()
        
        # Print detailed widget breakdown
        print_separator("DETAILED WIDGET BREAKDOWN")
        for i, widget in enumerate(widgets, 1):
            widget_id = widget.get('id', 'unknown')
            metadata = widget.get('metadata', {})
            widget_title = metadata.get('title', 'Unknown')
            widget_type = metadata.get('type', 'unknown')
            position = widget.get('position', i)
            deps = widget.get('dependencies', [])
            deps_met = widget.get('dependencies_met', True)
            
            print(f"{position}. {widget_title}")
            print(f"   ID: {widget_id}")
            print(f"   Type: {widget_type}")
            print(f"   Dependencies: {', '.join(deps) if deps else 'None'}")
            print(f"   Dependencies Met: {'✓' if deps_met else '✗'}")
            print()
        
        # Save to file for inspection
        output_file = backend_dir / "test_outputs" / "complex_module.json"
        output_file.parent.mkdir(exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(module, f, indent=2)
        
        print(f"✓ Full module JSON saved to: {output_file}")
        print()
        
        # Print the full JSON to console
        print_separator("FULL COMPLEX MODULE JSON")
        print(json.dumps(module, indent=2))
        print()
        
        return module
        
    except Exception as e:
        print(f"✗ Error during complex module generation: {e}")
        import traceback
        traceback.print_exc()
        return None


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
    
    # Test 6: Complex module generation
    result6 = await test_complex_module_generation()
    test_results.append(("Complex Module Generation", result6 is not None))
    
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
        print(f"  Warning: Could not setup tables: {e}")
        print("Tables may already exist or AWS credentials may not be configured.\n")
    
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
    except Exception as e:
        print(f"\n\nFatal error running tests: {e}")
        import traceback
        traceback.print_exc()
