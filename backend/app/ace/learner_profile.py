"""
Learner Profile Management

Tracks user learning patterns, completion rates, failure rates, and time taken.
Includes expiry system for inactive users.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any
from dataclasses import dataclass
from decimal import Decimal
from app.orm_supabase import orm


@dataclass
class LearnerProfile:
    """Learner profile to track user learning patterns"""
    user_id: str
    total_modules_attempted: int = 0
    total_modules_completed: int = 0
    average_completion_time: Decimal = Decimal(0.0)
    failure_rate: Decimal = Decimal(0.0)
    preferred_difficulty: str = "beginner"
    learning_pace: str = "normal"  # slow, normal, fast
    last_activity: str = ""
    created_at: str = ""
    updated_at: str = ""
    
    def calculate_completion_rate(self) -> float:
        """Calculate completion rate percentage"""
        if self.total_modules_attempted == 0:
            return 0.0
        return (self.total_modules_completed / self.total_modules_attempted) * 100
    
    def is_profile_stale(self, days_threshold: int = 30) -> bool:
        """Check if profile should be reset due to inactivity"""
        if not self.last_activity:
            return True
        
        last_activity_date = datetime.fromisoformat(self.last_activity)
        threshold_date = datetime.utcnow() - timedelta(days=days_threshold)
        return last_activity_date < threshold_date


class LearnerProfileManager:
    """Manages learner profiles in the database"""
    
    def get_or_create_profile(self, user_id: str) -> LearnerProfile:
        """Get existing learner profile or create new one"""
        # Get user and check if learner_profile exists in preferences JSONB
        user = orm.users.get_by_id(user_id)
        
        if user and user.to_dict().get('preferences', {}).get('learner_profile'):
            raw_data = user.to_dict()['preferences']['learner_profile']
            return LearnerProfile(
                user_id=raw_data['user_id'],
                total_modules_attempted=raw_data.get('total_modules_attempted', 0),
                total_modules_completed=raw_data.get('total_modules_completed', 0),
                average_completion_time=float(raw_data.get('average_completion_time', 0)),
                failure_rate=float(raw_data.get('failure_rate', 0)),
                preferred_difficulty=raw_data.get('preferred_difficulty', 'beginner'),
                learning_pace=raw_data.get('learning_pace', 'normal'),
                last_activity=raw_data.get('last_activity', ''),
                created_at=raw_data.get('created_at', ''),
                updated_at=raw_data.get('updated_at', '')
            )
        
        # Create new profile
        profile = LearnerProfile(
            user_id=user_id,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat(),
            last_activity=datetime.utcnow().isoformat()
        )
        
        # Save to database
        self.save_profile(profile)
        return profile
    
    def update_profile(self, user_id: str, module_id: str, 
                      completed: bool, time_taken: int, score: float = None) -> LearnerProfile:
        """Update learner profile based on module interaction"""
        profile = self.get_or_create_profile(user_id)
        
        # Update statistics
        profile.total_modules_attempted += 1
        if completed:
            profile.total_modules_completed += 1
        
        # Update average completion time (weighted average)
        if profile.average_completion_time == 0:
            profile.average_completion_time = time_taken
        else:
            weight = 0.2
            profile.average_completion_time = (
                profile.average_completion_time * (1 - weight) + time_taken * weight
            )
        
        # Update failure rate
        profile.failure_rate = 1 - profile.calculate_completion_rate() / 100
        
        # Determine learning pace based on completion time
        if time_taken < profile.average_completion_time * 0.8:
            profile.learning_pace = "fast"
        elif time_taken > profile.average_completion_time * 1.2:
            profile.learning_pace = "slow"
        else:
            profile.learning_pace = "normal"
        
        # Update activity timestamp
        profile.last_activity = datetime.utcnow().isoformat()
        profile.updated_at = datetime.utcnow().isoformat()
        
        # Save updated profile
        self.save_profile(profile)
        
        return profile
    
    def save_profile(self, profile: LearnerProfile):
        """Save learner profile to database in users.preferences JSONB field"""
        # Get current user data
        user = orm.users.get_by_id(profile.user_id)
        if not user:
            raise Exception(f"User {profile.user_id} not found")
        
        # Get current preferences or create empty dict
        user_dict = user.to_dict()
        preferences = user_dict.get('preferences', {})
        
        # Update learner_profile in preferences
        preferences['learner_profile'] = {
            "user_id": profile.user_id,
            "total_modules_attempted": profile.total_modules_attempted,
            "total_modules_completed": profile.total_modules_completed,
            "average_completion_time": float(profile.average_completion_time),
            "failure_rate": float(profile.failure_rate),
            "preferred_difficulty": profile.preferred_difficulty,
            "learning_pace": profile.learning_pace,
            "last_activity": profile.last_activity,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at
        }
        
        # Update user with new preferences
        orm.users.update(profile.user_id, {"preferences": preferences})
    
    def reset_stale_profile(self, user_id: str) -> LearnerProfile:
        """Reset learner profile if it's stale due to inactivity"""
        profile = self.get_or_create_profile(user_id)
        
        if profile.is_profile_stale():
            # Reset but keep some basic preferences
            old_preferred_difficulty = profile.preferred_difficulty
            profile = LearnerProfile(
                user_id=user_id,
                preferred_difficulty=old_preferred_difficulty,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat(),
                last_activity=datetime.utcnow().isoformat()
            )
            self.save_profile(profile)
        
        return profile
