"""
ACE Engine - Main Adaptive Content Engine

This is the main interface for the Adaptive Content Engine.
Coordinates all components: learner profiles, skill trees, module selection, and generation.
"""

from typing import Dict, List, Optional, Any
from app.models import User as UserModel, Lab as LabModel
from .learner_profile import LearnerProfileManager
from .skill_tree import SkillTreeManager
from .module_selector import ModuleSelector
from .module_generator import ModuleGenerator


class ACEEngine:
    """
    Adaptive Content Engine - Main AI engine for personalized learning
    
    This class provides a unified interface to all ACE functionality:
    - Learner profile tracking and management
    - Skill tree development and analysis
    - AI-driven module recommendations
    - Custom module generation
    """
    
    def __init__(self):
        self.user_model = UserModel()
        self.lab_model = LabModel()
        
        # Initialize component managers
        self.profile_manager = LearnerProfileManager()
        self.skill_manager = SkillTreeManager()
        self.module_selector = ModuleSelector()
        self.module_generator = ModuleGenerator()
    
    # Learner Profile Methods
    def get_learner_profile(self, user_id: str):
        """Get user's current learner profile"""
        return self.profile_manager.get_or_create_profile(user_id)
    
    def update_learner_profile(self, user_id: str, module_id: str, 
                             completed: bool, time_taken: int, score: float = None):
        """Update learner profile based on module interaction"""
        return self.profile_manager.update_profile(user_id, module_id, completed, time_taken, score)
    
    def reset_stale_profile(self, user_id: str):
        """Reset learner profile if it's stale due to inactivity"""
        return self.profile_manager.reset_stale_profile(user_id)
    
    # Skill Tree Methods
    def get_skill_tree(self, user_id: str):
        """Get user's current skill tree"""
        return self.skill_manager.get_or_create_skill_tree(user_id)
    
    def update_skill_tree_from_module(self, user_id: str, module_skills: List[str], 
                                    performance_score: float):
        """Update skill tree based on module completion"""
        return self.skill_manager.update_skill_tree_from_module(user_id, module_skills, performance_score)
    
    def analyze_skill_gaps(self, user_id: str, required_skills: List[str]) -> Dict[str, Any]:
        """Analyze skill gaps for a user given required skills"""
        return self.skill_manager.analyze_skill_gaps(user_id, required_skills)
    
    def get_skill_progression_path(self, user_id: str, target_skill: str) -> List[str]:
        """Get the learning path to achieve a target skill"""
        return self.skill_manager.get_skill_progression_path(user_id, target_skill)
    
    # Module Selection Methods
    def recommend_modules(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Recommend modules based on learner profile and skill tree"""
        return self.module_selector.recommend_modules(user_id, limit)
    
    def select_next_module(self, user_id: str, learning_goal: str = None) -> Optional[Dict[str, Any]]:
        """Select the single best next module for a user"""
        return self.module_selector.select_next_module(user_id, learning_goal)
    
    def get_learning_path(self, user_id: str, target_skills: List[str], 
                         max_modules: int = 10) -> List[Dict[str, Any]]:
        """Generate a learning path to achieve target skills"""
        return self.module_selector.get_learning_path(user_id, target_skills, max_modules)
    
    # Module Generation Methods
    def generate_module(self, user_id: str, topic: str, target_skills: List[str], 
                       difficulty: str = "beginner", estimated_time: int = 1800) -> Dict[str, Any]:
        """Generate a new module in the exact required JSON format"""
        return self.module_generator.generate_module_sync(user_id, topic, target_skills, difficulty, estimated_time)
    
    def create_personalized_module(self, user_id: str, learning_goal: str = None) -> Dict[str, Any]:
        """Create a personalized module based on user's current state"""
        return self.module_generator.create_personalized_module_sync(user_id, learning_goal)
    
    def save_generated_module(self, module: Dict[str, Any], user_id: str) -> str:
        """Save generated module to database and return module ID"""
        return self.module_generator.save_generated_module(module, user_id)
    
    # Comprehensive Analysis Methods
    def get_comprehensive_user_analysis(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive analysis of user's learning state"""
        profile = self.profile_manager.get_or_create_profile(user_id)
        skill_tree = self.skill_manager.get_or_create_skill_tree(user_id)
        recommendations = self.module_selector.recommend_modules(user_id, limit=3)
        
        # Calculate skill statistics
        total_skills = len(skill_tree.skills)
        mastered_skills = sum(1 for skill in skill_tree.skills.values() 
                            if skill.proficiency_level >= 75)
        intermediate_skills = sum(1 for skill in skill_tree.skills.values() 
                                if 50 <= skill.proficiency_level < 75)
        beginner_skills = sum(1 for skill in skill_tree.skills.values() 
                            if 25 <= skill.proficiency_level < 50)
        novice_skills = sum(1 for skill in skill_tree.skills.values() 
                          if skill.proficiency_level < 25)
        
        return {
            "user_id": user_id,
            "profile": {
                "completion_rate": profile.calculate_completion_rate(),
                "failure_rate": profile.failure_rate,
                "learning_pace": profile.learning_pace,
                "preferred_difficulty": profile.preferred_difficulty,
                "total_modules_attempted": profile.total_modules_attempted,
                "total_modules_completed": profile.total_modules_completed,
                "average_completion_time": profile.average_completion_time,
                "last_activity": profile.last_activity,
                "is_stale": profile.is_profile_stale()
            },
            "skills": {
                "total_skills": total_skills,
                "mastered_skills": mastered_skills,
                "intermediate_skills": intermediate_skills,
                "beginner_skills": beginner_skills,
                "novice_skills": novice_skills,
                "skill_distribution": {
                    "mastered": (mastered_skills / total_skills * 100) if total_skills > 0 else 0,
                    "intermediate": (intermediate_skills / total_skills * 100) if total_skills > 0 else 0,
                    "beginner": (beginner_skills / total_skills * 100) if total_skills > 0 else 0,
                    "novice": (novice_skills / total_skills * 100) if total_skills > 0 else 0
                },
                "recommended_next_skills": skill_tree.get_recommended_next_skills()[:5],
                "areas_for_improvement": [
                    skill.skill_name for skill in skill_tree.skills.values()
                    if skill.proficiency_level < 50 and skill.times_practiced > 2
                ][:5]
            },
            "recommendations": {
                "modules": recommendations,
                "next_module": recommendations[0] if recommendations else None,
                "recommended_learning_goals": skill_tree.get_recommended_next_skills()[:3]
            }
        }
    
    def process_module_completion(self, user_id: str, module_data: Dict[str, Any], 
                                performance_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process module completion and update all user data
        
        Args:
            user_id: The user who completed the module
            module_data: The module that was completed (with skills, etc.)
            performance_data: Performance metrics (score, time_taken, completed, etc.)
        
        Returns:
            Updated user analysis and next recommendations
        """
        # Extract performance metrics
        completed = performance_data.get("completed", False)
        time_taken = performance_data.get("time_taken", 1800)
        score = performance_data.get("score", 0.0)
        module_id = module_data.get("id", "unknown")
        module_skills = module_data.get("skills", [])
        
        # Update learner profile
        updated_profile = self.profile_manager.update_profile(
            user_id, module_id, completed, time_taken, score
        )
        
        # Update skill tree if module was completed
        if completed and module_skills:
            # Convert score to performance score (0-100)
            performance_score = min(100.0, max(0.0, score))
            self.skill_manager.update_skill_tree_from_module(
                user_id, module_skills, performance_score
            )
        
        # Get updated analysis and recommendations
        analysis = self.get_comprehensive_user_analysis(user_id)
        
        # Add completion-specific information
        analysis["completion_result"] = {
            "module_completed": completed,
            "performance_score": score,
            "time_taken": time_taken,
            "skills_practiced": module_skills,
            "profile_updated": True,
            "skill_tree_updated": completed
        }
        
        return analysis
    
    def get_adaptive_recommendations(self, user_id: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get adaptive recommendations based on current context
        
        Args:
            user_id: The user to get recommendations for
            context: Optional context like current topic, difficulty preferences, etc.
        
        Returns:
            Adaptive recommendations tailored to context
        """
        # Get base recommendations
        recommendations = self.module_selector.recommend_modules(user_id, limit=10)
        
        # Apply contextual filtering if provided
        if context:
            learning_goal = context.get("learning_goal")
            difficulty_preference = context.get("difficulty")
            time_constraint = context.get("max_time")
            
            filtered_recommendations = []
            for rec in recommendations:
                module = rec["module"]
                
                # Filter by learning goal
                if learning_goal:
                    module_skills = module.get("skills", [])
                    module_content = f"{module.get('title', '')} {module.get('description', '')}"
                    if not (learning_goal.lower() in " ".join(module_skills).lower() or 
                           learning_goal.lower() in module_content.lower()):
                        continue
                
                # Filter by difficulty
                if difficulty_preference:
                    estimated_difficulty = self.module_selector._estimate_module_difficulty(module)
                    preferred_num = self.module_selector._map_difficulty_to_number(difficulty_preference)
                    if abs(estimated_difficulty - preferred_num) > 1:
                        continue
                
                # Filter by time constraint
                if time_constraint:
                    estimated_time = module.get("estimated_duration", 1800)
                    if estimated_time > time_constraint:
                        continue
                
                filtered_recommendations.append(rec)
            
            if filtered_recommendations:
                recommendations = filtered_recommendations
        
        # Get skill analysis for context
        skill_analysis = self.get_comprehensive_user_analysis(user_id)
        
        return {
            "recommendations": recommendations[:5],
            "context_applied": context is not None,
            "skill_gaps": skill_analysis["skills"]["areas_for_improvement"],
            "recommended_skills": skill_analysis["skills"]["recommended_next_skills"],
            "user_pace": skill_analysis["profile"]["learning_pace"],
            "adaptive_suggestions": self._generate_adaptive_suggestions(user_id, skill_analysis)
        }
    
    def _generate_adaptive_suggestions(self, user_id: str, analysis: Dict[str, Any]) -> List[str]:
        """Generate adaptive suggestions based on user analysis"""
        suggestions = []
        
        profile = analysis["profile"]
        skills = analysis["skills"]
        
        # Learning pace suggestions
        if profile["learning_pace"] == "slow":
            suggestions.append("Consider breaking down complex topics into smaller modules")
        elif profile["learning_pace"] == "fast":
            suggestions.append("Try more challenging modules to accelerate your learning")
        
        # Skill-based suggestions
        if skills["mastered"] < 25:
            suggestions.append("Focus on building foundational skills before advancing")
        elif skills["mastered"] > 75:
            suggestions.append("You're ready for advanced topics and real-world projects")
        
        # Completion rate suggestions
        if profile["completion_rate"] < 60:
            suggestions.append("Try easier modules to build confidence and momentum")
        elif profile["completion_rate"] > 90:
            suggestions.append("Challenge yourself with more complex learning goals")
        
        # Activity suggestions
        if profile["is_stale"]:
            suggestions.append("Welcome back! Start with a refresher module to get back on track")
        
        return suggestions[:3]  # Return top 3 suggestions
