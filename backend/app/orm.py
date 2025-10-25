#!/usr/bin/env python3
"""
Prismo Backend ORM - DynamoDB CRUD Operations

A comprehensive ORM for DynamoDB operations with type safety,
query optimization, and relationship management.
"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union, Type, TypeVar, Generic
from dataclasses import dataclass, asdict, field
from enum import Enum
import boto3
from botocore.exceptions import ClientError
from app.aws_config import aws_config

T = TypeVar('T')

class QueryOperator(Enum):
    """DynamoDB query operators"""
    EQ = "="
    NE = "<>"
    LT = "<"
    LE = "<="
    GT = ">"
    GE = ">="
    BEGINS_WITH = "begins_with"
    BETWEEN = "between"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IN = "in"
    NOT_IN = "not_in"

@dataclass
class QueryCondition:
    """Represents a query condition"""
    attribute: str
    operator: QueryOperator
    value: Any
    value2: Any = None  # For BETWEEN operations

@dataclass
class PaginationParams:
    """Pagination parameters"""
    limit: int = 50
    last_evaluated_key: Optional[Dict[str, Any]] = None
    scan_index_forward: bool = True

@dataclass
class QueryResult:
    """Query result with pagination"""
    items: List[Dict[str, Any]]
    count: int
    last_evaluated_key: Optional[Dict[str, Any]] = None
    scanned_count: int = 0

class BaseModel:
    """Base model class for all ORM models"""
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {k: v for k, v in self.__dict__.items() if v is not None}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseModel':
        """Create model from dictionary"""
        return cls(**data)
    
    def save(self) -> 'BaseModel':
        """Save model to database"""
        return self.__class__.create(self.to_dict())
    
    def update(self, **kwargs) -> 'BaseModel':
        """Update model attributes"""
        for key, value in kwargs.items():
            setattr(self, key, value)
        return self.save()
    
    def delete(self) -> bool:
        """Delete model from database"""
        return self.__class__.delete_by_id(self.id)

class DynamoDBORM:
    """DynamoDB ORM with CRUD operations"""
    
    def __init__(self, table_name: str, model_class: Type[BaseModel]):
        self.table_name = aws_config.get_table_name(table_name)
        self.model_class = model_class
        self.dynamodb_resource = aws_config.dynamodb_resource
        self.table = self.dynamodb_resource.Table(self.table_name)
    
    def create(self, data: Dict[str, Any]) -> BaseModel:
        """Create a new record"""
        if 'id' not in data:
            data['id'] = str(uuid.uuid4())
        
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()
        
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow().isoformat()
        
        try:
            self.table.put_item(Item=data)
            return self.model_class.from_dict(data)
        except ClientError as e:
            raise Exception(f"Failed to create record: {e}")
    
    def get_by_id(self, id: str) -> Optional[BaseModel]:
        """Get record by ID"""
        try:
            response = self.table.get_item(Key={'id': id})
            if 'Item' in response:
                return self.model_class.from_dict(response['Item'])
            return None
        except ClientError as e:
            raise Exception(f"Failed to get record: {e}")
    
    def get_by_key(self, key: Dict[str, Any]) -> Optional[BaseModel]:
        """Get record by key"""
        try:
            response = self.table.get_item(Key=key)
            if 'Item' in response:
                return self.model_class.from_dict(response['Item'])
            return None
        except ClientError as e:
            raise Exception(f"Failed to get record: {e}")
    
    def update(self, id: str, updates: Dict[str, Any]) -> Optional[BaseModel]:
        """Update record by ID"""
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        # Build update expression
        update_expression = "SET " + ", ".join([f"{k} = :{k}" for k in updates.keys()])
        expression_values = {f":{k}": v for k, v in updates.items()}
        
        try:
            response = self.table.update_item(
                Key={'id': id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ReturnValues="ALL_NEW"
            )
            return self.model_class.from_dict(response['Attributes'])
        except ClientError as e:
            raise Exception(f"Failed to update record: {e}")
    
    def delete_by_id(self, id: str) -> bool:
        """Delete record by ID"""
        try:
            self.table.delete_item(Key={'id': id})
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete record: {e}")
    
    def delete_by_key(self, key: Dict[str, Any]) -> bool:
        """Delete record by key"""
        try:
            self.table.delete_item(Key=key)
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete record: {e}")
    
    def query(self, 
              index_name: Optional[str] = None,
              key_condition: Optional[Dict[str, Any]] = None,
              filter_expression: Optional[str] = None,
              expression_values: Optional[Dict[str, Any]] = None,
              pagination: Optional[PaginationParams] = None) -> QueryResult:
        """Query records with optional filtering and pagination"""
        
        query_params = {
            'TableName': self.table_name,
            'Limit': pagination.limit if pagination else 50
        }
        
        if index_name:
            query_params['IndexName'] = index_name
        
        if key_condition:
            query_params['KeyConditionExpression'] = key_condition
        
        if filter_expression:
            query_params['FilterExpression'] = filter_expression
        
        if expression_values:
            query_params['ExpressionAttributeValues'] = expression_values
        
        if pagination and pagination.last_evaluated_key:
            query_params['ExclusiveStartKey'] = pagination.last_evaluated_key
        
        if pagination and not pagination.scan_index_forward:
            query_params['ScanIndexForward'] = False
        
        try:
            response = self.table.query(**query_params)
            items = [self.model_class.from_dict(item) for item in response.get('Items', [])]
            
            return QueryResult(
                items=items,
                count=response.get('Count', 0),
                last_evaluated_key=response.get('LastEvaluatedKey'),
                scanned_count=response.get('ScannedCount', 0)
            )
        except ClientError as e:
            raise Exception(f"Failed to query records: {e}")
    
    def scan(self,
             filter_expression: Optional[str] = None,
             expression_values: Optional[Dict[str, Any]] = None,
             pagination: Optional[PaginationParams] = None) -> QueryResult:
        """Scan records with optional filtering and pagination"""
        
        scan_params = {
            'TableName': self.table_name,
            'Limit': pagination.limit if pagination else 50
        }
        
        if filter_expression:
            scan_params['FilterExpression'] = filter_expression
        
        if expression_values:
            scan_params['ExpressionAttributeValues'] = expression_values
        
        if pagination and pagination.last_evaluated_key:
            scan_params['ExclusiveStartKey'] = pagination.last_evaluated_key
        
        try:
            response = self.table.scan(**scan_params)
            items = [self.model_class.from_dict(item) for item in response.get('Items', [])]
            
            return QueryResult(
                items=items,
                count=response.get('Count', 0),
                last_evaluated_key=response.get('LastEvaluatedKey'),
                scanned_count=response.get('ScannedCount', 0)
            )
        except ClientError as e:
            raise Exception(f"Failed to scan records: {e}")
    
    def batch_get(self, keys: List[Dict[str, Any]]) -> List[BaseModel]:
        """Batch get multiple records"""
        try:
            response = self.dynamodb.batch_get_item(
                RequestItems={
                    self.table_name: {
                        'Keys': keys
                    }
                }
            )
            
            items = response.get('Responses', {}).get(self.table_name, [])
            return [self.model_class.from_dict(item) for item in items]
        except ClientError as e:
            raise Exception(f"Failed to batch get records: {e}")
    
    def batch_write(self, items: List[Dict[str, Any]], operation: str = 'put') -> bool:
        """Batch write multiple records"""
        try:
            with self.table.batch_writer() as batch:
                for item in items:
                    if operation == 'put':
                        batch.put_item(Item=item)
                    elif operation == 'delete':
                        batch.delete_item(Key={'id': item['id']})
            
            return True
        except ClientError as e:
            raise Exception(f"Failed to batch write records: {e}")
    
    def count(self, filter_expression: Optional[str] = None, 
              expression_values: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filtering"""
        scan_params = {
            'TableName': self.table_name,
            'Select': 'COUNT'
        }
        
        if filter_expression:
            scan_params['FilterExpression'] = filter_expression
        
        if expression_values:
            scan_params['ExpressionAttributeValues'] = expression_values
        
        try:
            response = self.table.scan(**scan_params)
            return response.get('Count', 0)
        except ClientError as e:
            raise Exception(f"Failed to count records: {e}")
    
    def exists(self, id: str) -> bool:
        """Check if record exists"""
        try:
            response = self.table.get_item(
                Key={'id': id},
                ProjectionExpression='id'
            )
            return 'Item' in response
        except ClientError as e:
            raise Exception(f"Failed to check if record exists: {e}")

# Model Definitions
@dataclass
class User(BaseModel):
    """User model"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    cognito_user_id: str = ""
    email: str = ""
    username: str = ""
    profile: Dict[str, Any] = field(default_factory=dict)
    preferences: Dict[str, Any] = field(default_factory=dict)
    is_active: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

@dataclass
class Lab(BaseModel):
    """Lab model"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    name: str = ""
    lab_type: str = ""
    description: str = ""
    content: Dict[str, Any] = field(default_factory=dict)
    is_public: bool = False
    tags: List[str] = field(default_factory=list)
    difficulty: int = 1
    estimated_time: int = 30
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

@dataclass
class Widget(BaseModel):
    """Widget model"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    name: str = ""
    widget_type: str = ""
    config: Dict[str, Any] = field(default_factory=dict)
    is_public: bool = False
    tags: List[str] = field(default_factory=list)
    version: str = "1.0.0"
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

@dataclass
class Collection(BaseModel):
    """Collection model"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    name: str = ""
    description: str = ""
    items: List[Dict[str, Any]] = field(default_factory=list)
    is_public: bool = False
    tags: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

@dataclass
class Module(BaseModel):
    """Module model"""
    id: str
    user_id: str
    name: str
    module_type: str
    content: Dict[str, Any]
    is_public: bool
    tags: List[str]
    created_at: str
    updated_at: str

@dataclass
class Attempt(BaseModel):
    """Attempt model"""
    id: str
    user_id: str
    lab_id: str
    status: str
    progress: float
    score: Optional[float]
    feedback: Dict[str, Any]
    created_at: str
    updated_at: str

@dataclass
class Mastery(BaseModel):
    """Mastery model"""
    id: str
    user_id: str
    skill_tag: str
    level: str
    progress: float
    last_practiced: str
    created_at: str
    updated_at: str

@dataclass
class Feedback(BaseModel):
    """Feedback model"""
    id: str
    user_id: str
    widget_id: str
    feedback_text: str
    rating: int
    time_spent: int
    attempts_taken: int
    created_at: str

# ORM Instances
class PrismoORM:
    """Main ORM class with all model instances"""
    
    def __init__(self):
        self.table_prefix = aws_config.dynamodb_table_prefix
        
        # Core models
        self.users = DynamoDBORM("users", User)
        self.labs = DynamoDBORM("labs", Lab)
        self.widgets = DynamoDBORM("widgets", Widget)
        self.collections = DynamoDBORM("collections", Collection)
        self.modules = DynamoDBORM("modules", Module)
        self.attempts = DynamoDBORM("attempts", Attempt)
        self.mastery = DynamoDBORM("mastery", Mastery)
        self.feedback = DynamoDBORM("feedback", Feedback)
        
        # Analytics models
        self.widget_selection = DynamoDBORM("widget-selection", BaseModel)
        self.feedback_generated = DynamoDBORM("feedback-generated", BaseModel)
        self.learning_sessions = DynamoDBORM("learning-sessions", BaseModel)
        self.skill_progress = DynamoDBORM("skill-progress", BaseModel)
        
        # Content models
        self.skill_tags = DynamoDBORM("skill-tags", BaseModel)
        self.difficulty_levels = DynamoDBORM("difficulty-levels", BaseModel)
        self.learning_paths = DynamoDBORM("learning-paths", BaseModel)
        self.educator_content = DynamoDBORM("educator-content", BaseModel)
        
        # Advanced models
        self.lab_templates = DynamoDBORM("lab-templates", BaseModel)
        self.widget_registry = DynamoDBORM("widget-registry", BaseModel)
        self.lab_steps = DynamoDBORM("lab-steps", BaseModel)
        self.hints = DynamoDBORM("hints", BaseModel)
        self.user_preferences = DynamoDBORM("user-preferences", BaseModel)
        self.notifications = DynamoDBORM("notifications", BaseModel)
        self.streaks = DynamoDBORM("streaks", BaseModel)
        self.badges = DynamoDBORM("badges", BaseModel)
        self.version_history = DynamoDBORM("version-history", BaseModel)
        self.coach_chat = DynamoDBORM("coach-chat", BaseModel)
        self.walkthrough_sessions = DynamoDBORM("walkthrough-sessions", BaseModel)
        self.micro_assessments = DynamoDBORM("micro-assessments", BaseModel)
        self.sandbox_sessions = DynamoDBORM("sandbox-sessions", BaseModel)
        self.review_sessions = DynamoDBORM("review-sessions", BaseModel)
        self.accessibility_settings = DynamoDBORM("accessibility-settings", BaseModel)
        self.api_usage = DynamoDBORM("api-usage", BaseModel)
        self.error_logs = DynamoDBORM("error-logs", BaseModel)
        self.system_config = DynamoDBORM("system-config", BaseModel)

# Global ORM instance
orm = PrismoORM()

# Convenience functions
def get_user_by_cognito_id(cognito_user_id: str) -> Optional[User]:
    """Get user by Cognito ID"""
    result = orm.users.query(
        index_name="user-id-index",
        key_condition={"cognito_user_id": cognito_user_id}
    )
    return result.items[0] if result.items else None

def get_labs_by_user(user_id: str) -> List[Lab]:
    """Get labs by user ID"""
    result = orm.labs.query(
        index_name="user-id-index",
        key_condition={"user_id": user_id}
    )
    return result.items

def get_public_labs() -> List[Lab]:
    """Get public labs"""
    result = orm.labs.scan(
        filter_expression="is_public = :is_public",
        expression_values={":is_public": True}
    )
    return result.items

def get_widgets_by_user(user_id: str) -> List[Widget]:
    """Get widgets by user ID"""
    result = orm.widgets.query(
        index_name="user-id-index",
        key_condition={"user_id": user_id}
    )
    return result.items

def get_public_widgets() -> List[Widget]:
    """Get public widgets"""
    result = orm.widgets.scan(
        filter_expression="is_public = :is_public",
        expression_values={":is_public": True}
    )
    return result.items

def get_collections_by_user(user_id: str) -> List[Collection]:
    """Get collections by user ID"""
    result = orm.collections.query(
        index_name="user-id-index",
        key_condition={"user_id": user_id}
    )
    return result.items

def get_attempts_by_user(user_id: str) -> List[Attempt]:
    """Get attempts by user ID"""
    result = orm.attempts.query(
        index_name="user-id-index",
        key_condition={"user_id": user_id}
    )
    return result.items

def get_mastery_by_user(user_id: str) -> List[Mastery]:
    """Get mastery records by user ID"""
    result = orm.mastery.query(
        index_name="user-id-index",
        key_condition={"user_id": user_id}
    )
    return result.items

def get_feedback_by_user(user_id: str) -> List[Feedback]:
    """Get feedback by user ID"""
    result = orm.feedback.query(
        index_name="user-id-index",
        key_condition={"user_id": user_id}
    )
    return result.items
