"""
Module Selection Engine

AI-driven module recommendations based on learner profile and skill tree analysis.
Provides intelligent matching and learning path generation.
"""

from typing import Dict, List, Optional, Any
from app.orm_supabase import orm
from .learner_profile import LearnerProfile, LearnerProfileManager
from .skill_tree import SkillTree, SkillTreeManager


class ModuleSelector:
    """Handles module recommendation and selection logic"""
    
    def __init__(self):
        self.profile_manager = LearnerProfileManager()
        self.skill_manager = SkillTreeManager()
    
    def recommend_modules(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Recommend modules based on learner profile and skill tree"""
        profile = self.profile_manager.get_or_create_profile(user_id)
        skill_tree = self.skill_manager.get_or_create_skill_tree(user_id)
        
        # Get all available modules
        modules_result = orm.modules.scan()
        available_modules = [module.to_dict() for module in modules_result.items]
        
        # Score each module based on user's current state
        scored_modules = []
        for module in available_modules:
            score = self._calculate_module_score(module, profile, skill_tree)
            if score > 0:  # Only include suitable modules
                scored_modules.append({
                    "module": module,
                    "score": score,
                    "reasoning": self._get_recommendation_reasoning(module, profile, skill_tree)
                })
        
        # Sort by score and return top recommendations
        scored_modules.sort(key=lambda x: x["score"], reverse=True)
        return scored_modules[:limit]
    
    def _calculate_module_score(self, module: Dict[str, Any], profile: LearnerProfile, 
                               skill_tree: SkillTree) -> float:
        """Calculate recommendation score for a module"""
        score = 0.0
        
        module_skills = module.get("skills", [])
        if not module_skills:
            return 0.0
        
        # Check prerequisite skills
        prerequisite_score = 0.0
        for skill in module_skills:
            if skill in skill_tree.skills:
                skill_level = skill_tree.skills[skill].proficiency_level
                # Bonus for skills at intermediate level (ready to advance)
                if 25 <= skill_level <= 75:
                    prerequisite_score += 1.0
                # Penalty for skills too advanced or too basic
                elif skill_level > 90:
                    prerequisite_score -= 0.5
                elif skill_level < 10:
                    prerequisite_score -= 0.3
            else:
                # New skill - good for exploration
                prerequisite_score += 0.5
        
        score += prerequisite_score / len(module_skills)
        
        # Factor in difficulty matching
        module_difficulty = self._estimate_module_difficulty(module)
        preferred_difficulty = self._map_difficulty_to_number(profile.preferred_difficulty)
        
        difficulty_diff = abs(module_difficulty - preferred_difficulty)
        if difficulty_diff <= 1:
            score += 1.0
        else:
            score -= difficulty_diff * 0.3
        
        # Factor in learning pace
        estimated_time = module.get("estimated_duration", 600)  # 10 minutes default

        if profile.learning_pace == "fast" and estimated_time < 300:
            score += 0.5
        elif profile.learning_pace == "slow" and estimated_time > 1200:
            score += 0.5
        elif profile.learning_pace == "normal" and 600 <= estimated_time <= 1200:
            score += 0.5
        
        # Boost for skill gaps
        skill_gaps = skill_tree.get_skill_gaps(module_skills)
        if skill_gaps:
            score += len(skill_gaps) * 0.3
        
        # Boost for recommended next skills
        recommended_skills = skill_tree.get_recommended_next_skills()
        matching_recommended = set(module_skills) & set(recommended_skills)
        if matching_recommended:
            score += len(matching_recommended) * 0.5
        
        return max(0.0, score)
    
    def _estimate_module_difficulty(self, module: Dict[str, Any]) -> int:
        """Estimate module difficulty on a scale of 1-5"""
        # Check if difficulty is explicitly set
        if "difficulty" in module:
            return self._map_difficulty_to_number(module["difficulty"])
        
        # Estimate based on widget complexity and skills
        widget_count = len(module.get("widgets", []))
        skill_count = len(module.get("skills", []))
        estimated_time = module.get("estimated_duration", 1800)
        
        difficulty_score = 0
        
        # More widgets and skills = higher difficulty
        if widget_count > 5:
            difficulty_score += 1
        if skill_count > 3:
            difficulty_score += 1
        
        # Longer time = higher difficulty
        if estimated_time > 3600:  # 1 hour
            difficulty_score += 2
        elif estimated_time > 1800:  # 30 minutes
            difficulty_score += 1
        
        # Check for advanced widgets
        advanced_widgets = ["code-editor", "equation-input", "complex-visualization"]
        for widget in module.get("widgets", []):
            if widget.get("id") in advanced_widgets:
                difficulty_score += 1
        
        return min(5, max(1, difficulty_score + 1))
    
    def _map_difficulty_to_number(self, difficulty: str) -> int:
        """Map difficulty string to number"""
        mapping = {
            "beginner": 1,
            "easy": 2,
            "intermediate": 3,
            "advanced": 4,
            "expert": 5
        }
        return mapping.get(difficulty.lower(), 2)
    
    def _get_recommendation_reasoning(self, module: Dict[str, Any], profile: LearnerProfile, 
                                   skill_tree: SkillTree) -> str:
        """Generate human-readable reasoning for recommendation"""
        reasons = []
        
        module_skills = module.get("skills", [])
        skill_gaps = skill_tree.get_skill_gaps(module_skills)
        
        if skill_gaps:
            reasons.append(f"Helps develop skills you need: {', '.join(skill_gaps[:3])}")
        
        recommended_skills = skill_tree.get_recommended_next_skills()
        matching_recommended = set(module_skills) & set(recommended_skills)
        if matching_recommended:
            reasons.append(f"Builds on your current progress in: {', '.join(list(matching_recommended)[:2])}")
        
        if profile.learning_pace == "fast":
            reasons.append("Matches your fast learning pace")
        elif profile.learning_pace == "slow":
            reasons.append("Designed for steady, thorough learning")
        
        difficulty = self._estimate_module_difficulty(module)
        if difficulty <= 2:
            reasons.append("Good for building confidence")
        elif difficulty >= 4:
            reasons.append("Provides a good challenge")
        
        if not reasons:
            reasons.append("Continues your learning journey")
        
        return ". ".join(reasons)
    
    def select_next_module(self, user_id: str, learning_goal: str = None) -> Optional[Dict[str, Any]]:
        """Select the single best next module for a user"""
        recommendations = self.recommend_modules(user_id, limit=10)
        
        if not recommendations:
            return None
        
        # If learning goal is specified, filter recommendations
        if learning_goal:
            filtered = [
                rec for rec in recommendations 
                if learning_goal.lower() in " ".join(rec["module"].get("skills", [])).lower()
                or learning_goal.lower() in rec["module"].get("title", "").lower()
                or learning_goal.lower() in rec["module"].get("description", "").lower()
            ]
            if filtered:
                recommendations = filtered
        
        # Return the top recommendation
        return recommendations[0] if recommendations else None
    
    def get_learning_path(self, user_id: str, target_skills: List[str], 
                         max_modules: int = 10) -> List[Dict[str, Any]]:
        """Generate a learning path to achieve target skills"""
        skill_tree = self.skill_manager.get_or_create_skill_tree(user_id)
        
        # Get all required skills including prerequisites
        all_required_skills = set()
        for target_skill in target_skills:
            path = self.skill_manager.get_skill_progression_path(user_id, target_skill)
            all_required_skills.update(path)
        
        # Find modules that teach these skills
        modules_result = orm.modules.scan()
        available_modules = [module.to_dict() for module in modules_result.items]
        
        # Build learning path
        learning_path = []
        covered_skills = set()
        
        # Sort skills by dependency order
        ordered_skills = self.skill_manager.topological_sort_skills(all_required_skills, skill_tree)
        
        for skill in ordered_skills:
            if skill in covered_skills:
                continue
            
            # Find best module for this skill
            best_module = None
            best_score = -1
            
            for module in available_modules:
                module_skills = set(module.get("skills", []))
                if skill in module_skills:
                    # Score based on how many uncovered skills this module teaches
                    uncovered_skills = module_skills - covered_skills
                    score = len(uncovered_skills)
                    
                    if score > best_score:
                        best_score = score
                        best_module = module
            
            if best_module:
                learning_path.append({
                    "module": best_module,
                    "target_skills": list(set(best_module.get("skills", [])) & all_required_skills),
                    "position": len(learning_path) + 1
                })
                covered_skills.update(best_module.get("skills", []))
                
                if len(learning_path) >= max_modules:
                    break
        
        return learning_path
