#!/usr/bin/env python3
"""
Test script for module session tracking functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER_ID = "test-user-123"
TEST_MODULE_ID = "pt04"

def test_module_session_tracking():
    """Test the complete module session tracking flow"""
    
    print("🧪 Testing Module Session Tracking")
    print("=" * 50)
    
    # Test 1: Start a module session
    print("\n1. Starting module session...")
    start_response = requests.post(f"{BASE_URL}/module-sessions/start", 
        json={
            "module_id": TEST_MODULE_ID,
            "total_steps": 5
        },
        headers={"Authorization": "Bearer test-token"}  # In real app, this would be a valid JWT
    )
    
    if start_response.status_code == 200:
        session_data = start_response.json()
        print(f"✅ Session started: {session_data['session']['id']}")
        session_id = session_data['session']['id']
    else:
        print(f"❌ Failed to start session: {start_response.text}")
        return
    
    # Test 2: Update session progress
    print("\n2. Updating session progress...")
    update_response = requests.put(f"{BASE_URL}/module-sessions/{session_id}/update",
        json={
            "status": "in_progress",
            "current_step": 2,
            "progress": 0.4,
            "time_spent": 120
        },
        headers={"Authorization": "Bearer test-token"}
    )
    
    if update_response.status_code == 200:
        print("✅ Session updated successfully")
    else:
        print(f"❌ Failed to update session: {update_response.text}")
    
    # Test 3: Get session details
    print("\n3. Getting session details...")
    get_response = requests.get(f"{BASE_URL}/module-sessions/{session_id}",
        headers={"Authorization": "Bearer test-token"}
    )
    
    if get_response.status_code == 200:
        session_data = get_response.json()
        print(f"✅ Session retrieved: Step {session_data['session']['current_step']}, Progress: {session_data['session']['progress']}")
    else:
        print(f"❌ Failed to get session: {get_response.text}")
    
    # Test 4: Complete session
    print("\n4. Completing session...")
    complete_response = requests.post(f"{BASE_URL}/module-sessions/{session_id}/complete",
        json={
            "final_time_spent": 300,
            "final_score": 85.5
        },
        headers={"Authorization": "Bearer test-token"}
    )
    
    if complete_response.status_code == 200:
        print("✅ Session completed successfully")
    else:
        print(f"❌ Failed to complete session: {complete_response.text}")
    
    # Test 5: Get user sessions
    print("\n5. Getting user sessions...")
    user_sessions_response = requests.get(f"{BASE_URL}/module-sessions/user/{TEST_USER_ID}",
        headers={"Authorization": "Bearer test-token"}
    )
    
    if user_sessions_response.status_code == 200:
        sessions_data = user_sessions_response.json()
        print(f"✅ Found {sessions_data['total']} sessions for user")
        for session in sessions_data['sessions']:
            print(f"   - {session['module_id']}: {session['status']} (Progress: {session['progress']})")
    else:
        print(f"❌ Failed to get user sessions: {user_sessions_response.text}")
    
    print("\n🎉 Session tracking test completed!")

if __name__ == "__main__":
    test_module_session_tracking()
