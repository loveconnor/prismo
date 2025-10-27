#!/usr/bin/env python3
"""
Prismo Backend ORM - Supabase/PostgreSQL CRUD Operations

A comprehensive ORM for Supabase/PostgreSQL operations with type safety,
query optimization, and relationship management.
"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union, Type, TypeVar
from dataclasses import dataclass, asdict, field
from enum import Enum
from decimal import Decimal
from app.supabase_config import supabase, supabase_admin

T = TypeVar('T')


class QueryOperator(Enum):
    """Query operators"""
    EQ = "eq"
    NE = "neq"
    LT = "lt"
    LE = "lte"
    GT = "gt"
    GE = "gte"
    LIKE = "like"
    ILIKE = "ilike"
    IS = "is"
    IN = "in"
    CONTAINS = "cs"  # contains (for arrays/JSONB)
    CONTAINED_BY = "cd"  # contained by


@dataclass
class PaginationParams:
    """Pagination parameters"""
    limit: int = 50
    offset: int = 0
    order_by: Optional[str] = None
    ascending: bool = True


@dataclass
class QueryResult:
    """Query result with pagination"""
    items: List[Dict[str, Any]]
    count: int


class BaseModel:
    """Base model class for all ORM models"""
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        result = {}
        for k, v in self.__dict__.items():
            if v is not None:
                # Convert Decimal to float for JSON serialization
                if isinstance(v, Decimal):
                    result[k] = float(v)
                else:
                    result[k] = v
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseModel':
        """Create model from dictionary"""
        return cls(**data)


class SupabaseORM:
    """Supabase ORM with CRUD operations"""
    
    def __init__(self, table_name: str, model_class: Type[BaseModel], use_admin: bool = False):
        self.table_name = table_name
        self.model_class = model_class
        self.use_admin = use_admin
        self._client = supabase_admin if use_admin else supabase
    
    @property
    def table(self):
        """Get table reference"""
        return self._client.table(self.table_name)
    
    def create(self, data: Dict[str, Any]) -> BaseModel:
        """Create a new record"""
        if 'id' not in data:
            data['id'] = str(uuid.uuid4())
        
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()
        
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow().isoformat()
        
        try:
            response = self.table.insert(data).execute()
            if response.data and len(response.data) > 0:
                return self.model_class.from_dict(response.data[0])
            raise Exception("No data returned from insert")
        except Exception as e:
            raise Exception(f"Failed to create record in {self.table_name}: {e}")
    
    def get_by_id(self, id: str) -> Optional[BaseModel]:
        """Get record by ID"""
        try:
            response = self.table.select("*").eq("id", id).execute()
            if response.data and len(response.data) > 0:
                return self.model_class.from_dict(response.data[0])
            return None
        except Exception as e:
            raise Exception(f"Failed to get record from {self.table_name}: {e}")
    
    def get_by_key(self, key: Dict[str, Any]) -> Optional[BaseModel]:
        """Get record by key"""
        try:
            query = self.table.select("*")
            for field, value in key.items():
                query = query.eq(field, value)
            
            response = query.execute()
            if response.data and len(response.data) > 0:
                return self.model_class.from_dict(response.data[0])
            return None
        except Exception as e:
            raise Exception(f"Failed to get record from {self.table_name}: {e}")
    
    def update(self, id: str, updates: Dict[str, Any]) -> Optional[BaseModel]:
        """Update record by ID"""
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        try:
            response = self.table.update(updates).eq("id", id).execute()
            if response.data and len(response.data) > 0:
                return self.model_class.from_dict(response.data[0])
            return None
        except Exception as e:
            raise Exception(f"Failed to update record in {self.table_name}: {e}")
    
    def delete_by_id(self, id: str) -> bool:
        """Delete record by ID"""
        try:
            self.table.delete().eq("id", id).execute()
            return True
        except Exception as e:
            raise Exception(f"Failed to delete record from {self.table_name}: {e}")
    
    def delete_by_key(self, key: Dict[str, Any]) -> bool:
        """Delete record by key"""
        try:
            query = self.table.delete()
            for field, value in key.items():
                query = query.eq(field, value)
            query.execute()
            return True
        except Exception as e:
            raise Exception(f"Failed to delete record from {self.table_name}: {e}")
    
    def query(self, 
              filters: Optional[Dict[str, Any]] = None,
              pagination: Optional[PaginationParams] = None) -> QueryResult:
        """Query records with optional filtering and pagination"""
        
        try:
            query = self.table.select("*", count='exact')
            
            # Apply filters
            if filters:
                for field, value in filters.items():
                    if isinstance(value, dict):
                        # Handle operators like {"gt": 5}
                        for op, val in value.items():
                            if op == "eq":
                                query = query.eq(field, val)
                            elif op == "neq":
                                query = query.neq(field, val)
                            elif op == "gt":
                                query = query.gt(field, val)
                            elif op == "gte":
                                query = query.gte(field, val)
                            elif op == "lt":
                                query = query.lt(field, val)
                            elif op == "lte":
                                query = query.lte(field, val)
                            elif op == "like":
                                query = query.like(field, val)
                            elif op == "ilike":
                                query = query.ilike(field, val)
                            elif op == "in":
                                query = query.in_(field, val)
                            elif op == "contains":
                                query = query.contains(field, val)
                    else:
                        # Simple equality
                        query = query.eq(field, value)
            
            # Apply pagination
            if pagination:
                if pagination.order_by:
                    query = query.order(pagination.order_by, desc=not pagination.ascending)
                query = query.range(pagination.offset, pagination.offset + pagination.limit - 1)
            
            response = query.execute()
            items = [self.model_class.from_dict(item) for item in response.data]
            
            return QueryResult(
                items=items,
                count=response.count if response.count is not None else len(items)
            )
        except Exception as e:
            raise Exception(f"Failed to query records from {self.table_name}: {e}")
    
    def query_by_user_id(self, user_id: str, status: Optional[str] = None, 
                        module_id: Optional[str] = None, limit: int = 50) -> List[BaseModel]:
        """Query records by user_id with optional filters"""
        try:
            query = self.table.select("*").eq("user_id", user_id)
            
            if status:
                query = query.eq("status", status)
            
            if module_id:
                query = query.eq("module_id", module_id)
            
            query = query.limit(limit)
            
            response = query.execute()
            return [self.model_class.from_dict(item) for item in response.data]
            
        except Exception as e:
            raise Exception(f"Failed to query by user_id from {self.table_name}: {e}")

    def scan(self,
             filters: Optional[Dict[str, Any]] = None,
             pagination: Optional[PaginationParams] = None,
             limit: int = 100) -> QueryResult:
        """Scan records with optional filtering and pagination"""
        
        # In Supabase/PostgreSQL, scan is similar to query
        if pagination is None:
            pagination = PaginationParams(limit=limit)
        
        return self.query(filters=filters, pagination=pagination)
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filtering"""
        try:
            query = self.table.select("*", count='exact', head=True)
            
            if filters:
                for field, value in filters.items():
                    query = query.eq(field, value)
            
            response = query.execute()
            return response.count if response.count is not None else 0
        except Exception as e:
            raise Exception(f"Failed to count records in {self.table_name}: {e}")
    
    def exists(self, id: str) -> bool:
        """Check if record exists"""
        try:
            response = self.table.select("id").eq("id", id).execute()
            return response.data and len(response.data) > 0
        except Exception as e:
            raise Exception(f"Failed to check if record exists in {self.table_name}: {e}")


# Model Definitions
@dataclass
class User(BaseModel):
    """User model"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    auth_user_id: Optional[str] = None
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


@dataclass
class ModuleSession(BaseModel):
    """Module session model - tracks when users start and work on modules"""
    id: str
    user_id: str
    module_id: str
    status: str  # 'started', 'in_progress', 'completed', 'abandoned'
    started_at: str
    last_activity_at: str
    completed_at: Optional[str] = None
    time_spent: int = 0  # in seconds
    progress: Decimal = Decimal('0.0')  # 0.0 to 1.0
    current_step: int = 1
    total_steps: int = 1
    interactions: Optional[str] = None  # JSON string storing array of interaction events
    created_at: str = ""
    updated_at: str = ""


# ORM Instances
class PrismoORM:
    """Main ORM class with all model instances"""
    
    def __init__(self):
        # Core models (use admin client for service operations)
        self.users = SupabaseORM("users", User, use_admin=True)
        self.labs = SupabaseORM("labs", Lab, use_admin=True)
        self.widgets = SupabaseORM("widgets", Widget)
        self.collections = SupabaseORM("collections", Collection)
        self.modules = SupabaseORM("modules", Module, use_admin=True)
        self.attempts = SupabaseORM("attempts", Attempt)
        self.mastery = SupabaseORM("mastery", Mastery)
        self.feedback = SupabaseORM("feedback", Feedback)
        self.module_sessions = SupabaseORM("module_sessions", ModuleSession, use_admin=True)
        
        # Analytics models
        self.widget_selection = SupabaseORM("widget_selection", BaseModel)
        self.feedback_generated = SupabaseORM("feedback_generated", BaseModel)
        self.learning_sessions = SupabaseORM("learning_sessions", BaseModel)
        self.skill_progress = SupabaseORM("skill_progress", BaseModel)
        
        # Content models
        self.skill_tags = SupabaseORM("skill_tags", BaseModel)
        self.difficulty_levels = SupabaseORM("difficulty_levels", BaseModel)
        self.learning_paths = SupabaseORM("learning_paths", BaseModel)
        self.educator_content = SupabaseORM("educator_content", BaseModel)
        
        # Advanced models
        self.lab_templates = SupabaseORM("lab_templates", BaseModel)
        self.widget_registry = SupabaseORM("widget_registry", BaseModel)
        self.lab_steps = SupabaseORM("lab_steps", BaseModel)
        self.hints = SupabaseORM("hints", BaseModel)
        self.user_preferences = SupabaseORM("user_preferences", BaseModel)
        self.notifications = SupabaseORM("notifications", BaseModel)
        self.streaks = SupabaseORM("streaks", BaseModel)
        self.badges = SupabaseORM("badges", BaseModel)
        self.version_history = SupabaseORM("version_history", BaseModel)
        self.coach_chat = SupabaseORM("coach_chat", BaseModel)
        self.walkthrough_sessions = SupabaseORM("walkthrough_sessions", BaseModel)
        self.micro_assessments = SupabaseORM("micro_assessments", BaseModel)
        self.sandbox_sessions = SupabaseORM("sandbox_sessions", BaseModel)
        self.review_sessions = SupabaseORM("review_sessions", BaseModel)
        self.accessibility_settings = SupabaseORM("accessibility_settings", BaseModel)
        self.api_usage = SupabaseORM("api_usage", BaseModel)
        self.error_logs = SupabaseORM("error_logs", BaseModel)
        self.system_config = SupabaseORM("system_config", BaseModel)


# Global ORM instance
orm = PrismoORM()


# Convenience functions
def get_user_by_auth_id(auth_user_id: str) -> Optional[User]:
    """Get user by Supabase Auth ID"""
    return orm.users.get_by_key({"auth_user_id": auth_user_id})


def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email"""
    return orm.users.get_by_key({"email": email})


def get_user_by_username(username: str) -> Optional[User]:
    """Get user by username"""
    return orm.users.get_by_key({"username": username})


def get_labs_by_user(user_id: str) -> List[Lab]:
    """Get labs by user ID"""
    result = orm.labs.query(filters={"user_id": user_id})
    return result.items


def get_public_labs() -> List[Lab]:
    """Get public labs"""
    result = orm.labs.query(filters={"is_public": True})
    return result.items


def get_widgets_by_user(user_id: str) -> List[Widget]:
    """Get widgets by user ID"""
    result = orm.widgets.query(filters={"user_id": user_id})
    return result.items


def get_public_widgets() -> List[Widget]:
    """Get public widgets"""
    result = orm.widgets.query(filters={"is_public": True})
    return result.items


def get_collections_by_user(user_id: str) -> List[Collection]:
    """Get collections by user ID"""
    result = orm.collections.query(filters={"user_id": user_id})
    return result.items


def get_attempts_by_user(user_id: str) -> List[Attempt]:
    """Get attempts by user ID"""
    result = orm.attempts.query(filters={"user_id": user_id})
    return result.items


def get_mastery_by_user(user_id: str) -> List[Mastery]:
    """Get mastery records by user ID"""
    result = orm.mastery.query(filters={"user_id": user_id})
    return result.items


def get_feedback_by_user(user_id: str) -> List[Feedback]:
    """Get feedback by user ID"""
    result = orm.feedback.query(filters={"user_id": user_id})
    return result.items
