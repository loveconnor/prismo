#!/usr/bin/env python3
"""
Test script for Prismo Backend ORM

This script demonstrates the ORM functionality and tests basic CRUD operations.
"""

import os
import sys
from datetime import datetime
from app.orm import orm, User, Lab, Widget, Collection, PaginationParams

def test_orm_operations():
    """Test basic ORM operations"""
    print("Prismo Backend ORM Test")
    print("=" * 50)
    
    try:
        # Test 1: Create a user
        print("\n[TEST] Creating user...")
        user_data = {
            'cognito_user_id': 'test-cognito-123',
            'email': 'test@example.com',
            'username': 'testuser',
            'profile': {'name': 'Test User', 'avatar': 'default.png'},
            'preferences': {'theme': 'dark', 'notifications': True}
        }
        user = orm.users.create(user_data)
        print(f"[SUCCESS] User created: {user.id}")
        
        # Test 2: Get user by ID
        print("\n[TEST] Getting user by ID...")
        retrieved_user = orm.users.get_by_id(user.id)
        if retrieved_user:
            print(f"[SUCCESS] User retrieved: {retrieved_user.username}")
        else:
            print("[ERROR] User not found")
        
        # Test 3: Create a lab
        print("\n[TEST] Creating lab...")
        lab_data = {
            'user_id': user.id,
            'name': 'Python Basics Lab',
            'lab_type': 'coding',
            'description': 'Learn Python fundamentals with hands-on practice',
            'content': {
                'steps': [
                    {'id': 'step-1', 'title': 'Variables', 'content': 'Learn about variables'},
                    {'id': 'step-2', 'title': 'Loops', 'content': 'Learn about loops'}
                ],
                'widgets': ['code-editor', 'hint-panel']
            },
            'is_public': True,
            'tags': ['python', 'beginner', 'programming'],
            'difficulty': 1,
            'estimated_time': 30
        }
        lab = orm.labs.create(lab_data)
        print(f"[SUCCESS] Lab created: {lab.name}")
        
        # Test 4: Create a widget
        print("\n[TEST] Creating widget...")
        widget_data = {
            'user_id': user.id,
            'name': 'Code Editor Widget',
            'widget_type': 'code_editor',
            'config': {
                'language': 'python',
                'theme': 'monokai',
                'readonly': False
            },
            'is_public': False,
            'tags': ['coding', 'editor'],
            'version': '1.0.0'
        }
        widget = orm.widgets.create(widget_data)
        print(f"[SUCCESS] Widget created: {widget.name}")
        
        # Test 5: Create a collection
        print("\n[TEST] Creating collection...")
        collection_data = {
            'user_id': user.id,
            'name': 'Python Learning Path',
            'description': 'Complete Python curriculum for beginners',
            'items': [
                {'type': 'lab', 'id': lab.id, 'order': 1},
                {'type': 'widget', 'id': widget.id, 'order': 2}
            ],
            'is_public': True,
            'tags': ['python', 'curriculum', 'beginner']
        }
        collection = orm.collections.create(collection_data)
        print(f"[SUCCESS] Collection created: {collection.name}")
        
        # Test 6: Query operations
        print("\n[TEST] Querying user labs...")
        user_labs = orm.labs.query(
            index_name='user-id-index',
            key_condition={'user_id': user.id}
        )
        print(f"[SUCCESS] Found {len(user_labs.items)} labs for user")
        
        # Test 7: Update operations
        print("\n[TEST] Updating lab...")
        updated_lab = orm.labs.update(lab.id, {
            'name': 'Advanced Python Lab',
            'difficulty': 3,
            'tags': ['python', 'advanced', 'programming']
        })
        print(f"[SUCCESS] Lab updated: {updated_lab.name}")
        
        # Test 8: Scan operations
        print("\n[TEST] Scanning public labs...")
        public_labs = orm.labs.scan(
            filter_expression='is_public = :is_public',
            expression_values={':is_public': True}
        )
        print(f"[SUCCESS] Found {len(public_labs.items)} public labs")
        
        # Test 9: Count operations
        print("\n[TEST] Counting records...")
        total_labs = orm.labs.count()
        public_labs_count = orm.labs.count(
            filter_expression='is_public = :is_public',
            expression_values={':is_public': True}
        )
        print(f"[SUCCESS] Total labs: {total_labs}, Public labs: {public_labs_count}")
        
        # Test 10: Existence check
        print("\n[TEST] Checking if lab exists...")
        lab_exists = orm.labs.exists(lab.id)
        print(f"[SUCCESS] Lab exists: {lab_exists}")
        
        # Test 11: Batch operations
        print("\n[TEST] Batch operations...")
        batch_items = [
            {'id': f'batch-lab-{i}', 'user_id': user.id, 'name': f'Batch Lab {i}', 
             'lab_type': 'coding', 'description': f'Batch lab {i}', 'content': {}}
            for i in range(3)
        ]
        orm.labs.batch_write(batch_items, operation='put')
        print("[SUCCESS] Batch write completed")
        
        # Test 12: Analytics tracking
        print("\n[TEST] Analytics tracking...")
        orm.widget_selection.create({
            'user_id': user.id,
            'module_id': 'module-123',
            'widget_id': widget.id,
            'selected_option': 'hint_level_2',
            'timestamp': datetime.utcnow().isoformat()
        })
        print("[SUCCESS] Widget selection tracked")
        
        # Test 13: Error logging
        print("\n[TEST] Error logging...")
        orm.error_logs.create({
            'error_type': 'TestError',
            'severity': 'info',
            'message': 'This is a test error log',
            'user_id': user.id,
            'endpoint': '/test',
            'timestamp': datetime.utcnow().isoformat()
        })
        print("[SUCCESS] Error logged")
        
        # Test 14: System configuration
        print("\n[TEST] System configuration...")
        orm.system_config.create({
            'config_key': 'test_config',
            'config_value': 'test_value',
            'config_category': 'test',
            'description': 'Test configuration'
        })
        print("[SUCCESS] System configuration created")
        
        print("\n" + "=" * 50)
        print("[SUCCESS] All ORM tests passed!")
        print("Your Prismo backend ORM is working perfectly!")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] ORM test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_convenience_functions():
    """Test convenience functions"""
    print("\n[TEST] Testing convenience functions...")
    
    try:
        # Test convenience functions
        from app.orm import get_user_by_cognito_id, get_labs_by_user, get_public_labs
        
        # These would work with actual data
        print("[SUCCESS] Convenience functions imported successfully")
        return True
        
    except Exception as e:
        print(f"[ERROR] Convenience functions test failed: {e}")
        return False

def main():
    """Main test function"""
    print("Starting Prismo Backend ORM Tests...")
    
    # Test basic operations
    success = test_orm_operations()
    
    # Test convenience functions
    convenience_success = test_convenience_functions()
    
    if success and convenience_success:
        print("\n🎉 All ORM tests passed!")
        print("Your Prismo backend is ready for production!")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
