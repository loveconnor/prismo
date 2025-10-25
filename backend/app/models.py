from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid
from app.aws_config import aws_config

class BaseModel:
    """Base model class for DynamoDB operations"""
    
    def __init__(self, table_name: str):
        self.table_name = aws_config.get_table_name(table_name)
        self.table = aws_config.dynamodb_resource.Table(self.table_name)
    
    def create_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new item in DynamoDB"""
        try:
            # Add metadata
            item['id'] = str(uuid.uuid4())
            item['created_at'] = datetime.utcnow().isoformat()
            item['updated_at'] = datetime.utcnow().isoformat()
            
            self.table.put_item(Item=item)
            return item
        except Exception as e:
            raise Exception(f"Error creating item: {e}")
    
    def get_item(self, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get an item by key"""
        try:
            response = self.table.get_item(Key=key)
            return response.get('Item')
        except Exception as e:
            raise Exception(f"Error getting item: {e}")
    
    def update_item(self, key: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an item"""
        try:
            updates['updated_at'] = datetime.utcnow().isoformat()
            
            # Build update expression
            update_expression = "SET " + ", ".join([f"{k} = :{k}" for k in updates.keys()])
            expression_values = {f":{k}": v for k, v in updates.items()}
            
            response = self.table.update_item(
                Key=key,
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ReturnValues="ALL_NEW"
            )
            return response['Attributes']
        except Exception as e:
            raise Exception(f"Error updating item: {e}")
    
    def delete_item(self, key: Dict[str, Any]) -> bool:
        """Delete an item"""
        try:
            self.table.delete_item(Key=key)
            return True
        except Exception as e:
            raise Exception(f"Error deleting item: {e}")
    
    def scan_items(self, filter_expression=None, limit: int = 100) -> List[Dict[str, Any]]:
        """Scan items with optional filter"""
        try:
            scan_kwargs = {'Limit': limit}
            if filter_expression:
                scan_kwargs['FilterExpression'] = filter_expression
            
            response = self.table.scan(**scan_kwargs)
            return response.get('Items', [])
        except Exception as e:
            raise Exception(f"Error scanning items: {e}")

class User(BaseModel):
    """User model for DynamoDB"""
    
    def __init__(self):
        super().__init__('users')
    
    def create_user(self, cognito_user_id: str, email: str, username: str, **kwargs) -> Dict[str, Any]:
        """Create a new user"""
        user_data = {
            'cognito_user_id': cognito_user_id,
            'email': email,
            'username': username,
            'profile': kwargs.get('profile', {}),
            'preferences': kwargs.get('preferences', {}),
            'is_active': True
        }
        return self.create_item(user_data)
    
    def get_user_by_cognito_id(self, cognito_user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Cognito user ID"""
        return self.get_item({'cognito_user_id': cognito_user_id})
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        response = self.table.scan(
            FilterExpression='email = :email',
            ExpressionAttributeValues={':email': email}
        )
        items = response.get('Items', [])
        return items[0] if items else None

class Lab(BaseModel):
    """Lab model for DynamoDB"""
    
    def __init__(self):
        super().__init__('labs')
    
    def create_lab(self, name: str, lab_type: str, description: str, 
                   content: Dict[str, Any], user_id: str, **kwargs) -> Dict[str, Any]:
        """Create a new lab"""
        lab_data = {
            'name': name,
            'lab_type': lab_type,  # 'math', 'writing', 'coding'
            'description': description,
            'content': content,
            'user_id': user_id,
            'is_public': kwargs.get('is_public', False),
            'tags': kwargs.get('tags', []),
            'difficulty': kwargs.get('difficulty', 'beginner'),
            'estimated_time': kwargs.get('estimated_time', 30)
        }
        return self.create_item(lab_data)
    
    def get_labs_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all labs for a user"""
        return self.scan_items(
            filter_expression='user_id = :user_id',
            limit=1000
        )
    
    def get_public_labs(self) -> List[Dict[str, Any]]:
        """Get all public labs"""
        return self.scan_items(
            filter_expression='is_public = :is_public',
            limit=1000
        )

class Widget(BaseModel):
    """Widget model for DynamoDB"""
    
    def __init__(self):
        super().__init__('widgets')
    
    def create_widget(self, name: str, widget_type: str, config: Dict[str, Any], 
                     user_id: str, **kwargs) -> Dict[str, Any]:
        """Create a new widget"""
        widget_data = {
            'name': name,
            'widget_type': widget_type,  # 'timer', 'multiple_choice', 'hint_panel'
            'config': config,
            'user_id': user_id,
            'is_public': kwargs.get('is_public', False),
            'tags': kwargs.get('tags', []),
            'version': kwargs.get('version', '1.0.0')
        }
        return self.create_item(widget_data)
    
    def get_widgets_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all widgets for a user"""
        return self.scan_items(
            filter_expression='user_id = :user_id',
            limit=1000
        )
    
    def get_public_widgets(self) -> List[Dict[str, Any]]:
        """Get all public widgets"""
        return self.scan_items(
            filter_expression='is_public = :is_public',
            limit=1000
        )

class Collection(BaseModel):
    """Collection model for DynamoDB"""
    
    def __init__(self):
        super().__init__('collections')
    
    def create_collection(self, name: str, description: str, user_id: str, 
                         items: List[Dict[str, Any]], **kwargs) -> Dict[str, Any]:
        """Create a new collection"""
        collection_data = {
            'name': name,
            'description': description,
            'user_id': user_id,
            'items': items,  # List of lab/widget IDs
            'is_public': kwargs.get('is_public', False),
            'tags': kwargs.get('tags', [])
        }
        return self.create_item(collection_data)
    
    def get_collections_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all collections for a user"""
        return self.scan_items(
            filter_expression='user_id = :user_id',
            limit=1000
        )
