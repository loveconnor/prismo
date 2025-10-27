"""
Prismo Backend Models - Updated to use Supabase ORM

This module provides backward compatibility with the existing models
while leveraging the new Supabase ORM system for improved functionality.
"""

from typing import Dict, List, Optional, Any
from app.orm_supabase import orm, User, Lab, Widget, Collection, Module, Attempt, Mastery, Feedback, ModuleSession

class BaseModel:
    """Base model class for backward compatibility"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        # Map table names to ORM instances
        self.orm_map = {
            'users': orm.users,
            'labs': orm.labs,
            'widgets': orm.widgets,
            'collections': orm.collections,
            'modules': orm.modules,
            'attempts': orm.attempts,
            'mastery': orm.mastery,
            'feedback': orm.feedback
        }
        self.orm = self.orm_map.get(table_name)
    
    def create_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new item using ORM"""
        if self.orm:
            model = self.orm.create(item)
            return model.to_dict()
        raise Exception(f"ORM not found for table: {self.table_name}")
    
    def get_item(self, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get an item by key using ORM"""
        if self.orm:
            model = self.orm.get_by_key(key)
            return model.to_dict() if model else None
        raise Exception(f"ORM not found for table: {self.table_name}")
    
    def update_item(self, key: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an item using ORM"""
        if self.orm:
            model = self.orm.update(key['id'], updates)
            return model.to_dict() if model else {}
        raise Exception(f"ORM not found for table: {self.table_name}")
    
    def delete_item(self, key: Dict[str, Any]) -> bool:
        """Delete an item using ORM"""
        if self.orm:
            return self.orm.delete_by_key(key)
        raise Exception(f"ORM not found for table: {self.table_name}")
    
    def scan_items(self, filter_expression=None, limit: int = 100) -> List[Dict[str, Any]]:
        """Scan items with optional filter using ORM"""
        if self.orm:
            result = self.orm.scan(
                filter_expression=filter_expression,
                limit=limit
            )
            return [item.to_dict() for item in result.items]
        raise Exception(f"ORM not found for table: {self.table_name}")

class User(BaseModel):
    """User model for DynamoDB - Enhanced with ORM"""
    
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
        try:
            print(f"DEBUG: Scanning for user with email: {email}")
            result = self.orm.scan(
                filter_expression='email = :email',
                expression_values={':email': email}
            )
            print(f"DEBUG: Scan result: {result}")
            print(f"DEBUG: Number of items found: {len(result.items) if result.items else 0}")
            if result.items:
                print(f"DEBUG: First item: {result.items[0].to_dict()}")
            return result.items[0].to_dict() if result.items else None
        except Exception as e:
            print(f"ERROR: Failed to get user by email: {e}")
            import traceback
            traceback.print_exc()
            return None

class Lab(BaseModel):
    """Lab model for DynamoDB - Enhanced with ORM"""
    
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
        result = self.orm.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        return [item.to_dict() for item in result.items]
    
    def get_public_labs(self) -> List[Dict[str, Any]]:
        """Get all public labs"""
        result = self.orm.scan(
            filter_expression='is_public = :is_public',
            expression_values={':is_public': True}
        )
        return [item.to_dict() for item in result.items]

class Widget(BaseModel):
    """Widget model for DynamoDB - Enhanced with ORM"""
    
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
        result = self.orm.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        return [item.to_dict() for item in result.items]
    
    def get_public_widgets(self) -> List[Dict[str, Any]]:
        """Get all public widgets"""
        result = self.orm.scan(
            filter_expression='is_public = :is_public',
            expression_values={':is_public': True}
        )
        return [item.to_dict() for item in result.items]

class Collection(BaseModel):
    """Collection model for DynamoDB - Enhanced with ORM"""
    
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
        result = self.orm.query(
            index_name="user-id-index",
            key_condition={"user_id": user_id}
        )
        return [item.to_dict() for item in result.items]
