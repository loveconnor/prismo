#!/usr/bin/env python3
"""
Script to fix corrupted time_spent values in module_sessions table
"""

import boto3
import os
from datetime import datetime

# Initialize DynamoDB
region = os.getenv("AWS_REGION", "us-east-1")
dynamodb = boto3.resource('dynamodb', region_name=region)

table = dynamodb.Table('prismo_module_sessions')

def fix_time_spent():
    """Scan all module sessions and fix corrupted time_spent values"""
    
    print("Scanning module_sessions table...")
    response = table.scan()
    items = response.get('Items', [])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))
    
    print(f"Found {len(items)} module sessions\n")
    
    fixed_count = 0
    current_timestamp = int(datetime.now().timestamp())
    
    for item in items:
        session_id = item.get('id')
        time_spent = item.get('time_spent', 0)
        
        # Check if time_spent looks corrupted
        needs_fix = False
        new_value = 0
        
        # If it's larger than current timestamp, it's definitely wrong
        if time_spent > current_timestamp:
            print(f"Session {session_id}: CORRUPTED - time_spent={time_spent} (looks like timestamp)")
            needs_fix = True
            new_value = 0  # Reset to 0
        # If it's suspiciously large (> 1 million seconds = 277 hours), might be milliseconds
        elif time_spent > 1000000:
            print(f"Session {session_id}: SUSPICIOUS - time_spent={time_spent} (possibly milliseconds)")
            new_value = int(time_spent / 1000)  # Convert to seconds
            needs_fix = True
        # If it's reasonable but > 24 hours for a single session
        elif time_spent > 86400:  # 24 hours
            print(f"Session {session_id}: QUESTIONABLE - time_spent={time_spent}s ({time_spent/3600:.1f}h)")
            print(f"  Created: {item.get('created_at')}")
            print(f"  Updated: {item.get('updated_at')}")
        else:
            # Normal value
            continue
        
        if needs_fix:
            print(f"  → Fixing: {time_spent} → {new_value}")
            table.update_item(
                Key={'id': session_id},
                UpdateExpression='SET time_spent = :val',
                ExpressionAttributeValues={':val': new_value}
            )
            fixed_count += 1
            print(f"  ✓ Fixed\n")
    
    print(f"\nSummary:")
    print(f"  Total sessions: {len(items)}")
    print(f"  Fixed: {fixed_count}")
    print(f"  Done!")

if __name__ == '__main__':
    fix_time_spent()
