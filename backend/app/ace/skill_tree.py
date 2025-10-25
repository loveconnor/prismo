"""
Skill Tree System

Manages user skill tracking, proficiency levels, and prerequisite dependencies.
Identifies skill gaps and provides learning path recommendations.
"""

import uuid
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass, field
from decimal import Decimal
from app.orm import orm


@dataclass
class SkillNode:
    """Individual skill in the skill tree"""
    skill_name: str
    proficiency_level: float = 0.0  # 0.0 to 100.0
    times_practiced: int = 0
    last_practiced: str = ""
    prerequisite_skills: List[str] = field(default_factory=list)
    dependent_skills: List[str] = field(default_factory=list)
    
    def get_skill_level(self) -> str:
        """Get skill level as string"""
        if self.proficiency_level < 25:
            return "novice"
        elif self.proficiency_level < 50:
            return "beginner"
        elif self.proficiency_level < 75:
            return "intermediate"
        else:
            return "advanced"


@dataclass
class SkillTree:
    """User's complete skill tree"""
    user_id: str
    skills: Dict[str, SkillNode] = field(default_factory=dict)
    updated_at: str = ""
    
    def add_skill(self, skill_name: str, prerequisite_skills: List[str] = None) -> SkillNode:
        """Add a new skill to the tree"""
        if skill_name not in self.skills:
            self.skills[skill_name] = SkillNode(
                skill_name=skill_name,
                prerequisite_skills=prerequisite_skills or []
            )
        return self.skills[skill_name]
    
    def update_skill_proficiency(self, skill_name: str, performance_score: float):
        """Update skill proficiency based on performance"""
        if skill_name in self.skills:
            skill = self.skills[skill_name]
            # Weighted average with recent performance having more weight
            weight = 0.3
            skill.proficiency_level = (skill.proficiency_level * (1 - weight)) + (performance_score * weight)
            skill.times_practiced += 1
            skill.last_practiced = datetime.utcnow().isoformat()
            self.updated_at = datetime.utcnow().isoformat()
    
    def get_skill_gaps(self, required_skills: List[str], threshold: float = 50.0) -> List[str]:
        """Identify skills that are below proficiency threshold"""
        gaps = []
        for skill in required_skills:
            if skill not in self.skills or self.skills[skill].proficiency_level < threshold:
                gaps.append(skill)
        return gaps
    
    def get_recommended_next_skills(self) -> List[str]:
        """Get skills that are ready to learn based on prerequisites"""
        ready_skills = []
        for skill_name, skill in self.skills.items():
            if skill.proficiency_level < 75:  # Not yet mastered
                prerequisites_met = all(
                    prereq in self.skills and self.skills[prereq].proficiency_level >= 50
                    for prereq in skill.prerequisite_skills
                )
                if prerequisites_met:
                    ready_skills.append(skill_name)
        return ready_skills


class SkillTreeManager:
    """Manages skill trees in the database"""
    
    def get_or_create_skill_tree(self, user_id: str) -> SkillTree:
        """Get existing skill tree or create new one"""
        # Try to get existing skill tree
        result = orm.skill_progress.scan(
            filter_expression="user_id = :user_id",
            expression_values={":user_id": user_id}
        )
        
        if result.items:
            skill_tree_data = result.items[0].to_dict()
            skill_tree = SkillTree(user_id=user_id, updated_at=skill_tree_data.get('updated_at', ''))
            
            # Reconstruct skills from stored data
            for skill_name, skill_data in skill_tree_data.get('skills', {}).items():
                skill_tree.skills[skill_name] = SkillNode(**skill_data)
            
            return skill_tree
        
        # Create new skill tree with fundamental skills
        skill_tree = SkillTree(
            user_id=user_id,
            updated_at=datetime.utcnow().isoformat()
        )
        
        # Add fundamental skills
        self._initialize_skill_tree(skill_tree)
        self.save_skill_tree(skill_tree)
        
        return skill_tree
    
    def _initialize_skill_tree(self, skill_tree: SkillTree):
        """Initialize skill tree with fundamental programming and math skills"""
        # Programming fundamentals
        skill_tree.add_skill("basic-syntax")
        skill_tree.add_skill("variables", ["basic-syntax"])
        skill_tree.add_skill("functions", ["variables"])
        skill_tree.add_skill("conditionals", ["variables"])
        skill_tree.add_skill("loops", ["conditionals"])
        skill_tree.add_skill("arrays", ["variables"])
        skill_tree.add_skill("objects", ["arrays"])
        skill_tree.add_skill("debugging", ["functions"])
        skill_tree.add_skill("problem-solving", ["functions", "conditionals"])
        
        # JavaScript specific
        skill_tree.add_skill("javascript", ["basic-syntax"])
        skill_tree.add_skill("dom-manipulation", ["javascript", "functions"])
        skill_tree.add_skill("event-handling", ["dom-manipulation"])
        skill_tree.add_skill("async-programming", ["functions"])
        
        # Python specific
        skill_tree.add_skill("python", ["basic-syntax"])
        skill_tree.add_skill("list-comprehensions", ["python", "loops"])
        skill_tree.add_skill("file-handling", ["python"])
        
        # Mathematical skills
        skill_tree.add_skill("arithmetic")
        skill_tree.add_skill("algebra", ["arithmetic"])
        skill_tree.add_skill("geometry", ["arithmetic"])
        skill_tree.add_skill("calculus", ["algebra"])
        skill_tree.add_skill("statistics", ["arithmetic"])
        skill_tree.add_skill("symbolic-reasoning", ["algebra"])
        
        # General learning skills
        skill_tree.add_skill("reading-comprehension")
        skill_tree.add_skill("critical-thinking", ["reading-comprehension"])
        skill_tree.add_skill("pattern-recognition", ["critical-thinking"])
        skill_tree.add_skill("metacognition", ["critical-thinking"])
        skill_tree.add_skill("self-assessment", ["metacognition"])
    
    def update_skill_tree_from_module(self, user_id: str, module_skills: List[str], 
                                    performance_score: float) -> SkillTree:
        """Update skill tree based on module completion"""
        skill_tree = self.get_or_create_skill_tree(user_id)
        
        for skill in module_skills:
            # Add skill if it doesn't exist
            if skill not in skill_tree.skills:
                skill_tree.add_skill(skill)
            
            # Update proficiency based on performance
            skill_tree.update_skill_proficiency(skill, performance_score)
        
        self.save_skill_tree(skill_tree)
        return skill_tree
    
    def save_skill_tree(self, skill_tree: SkillTree):
        """Save skill tree to database"""
        # Convert SkillNode objects to dictionaries
        skills_data = {}
        for skill_name, skill_node in skill_tree.skills.items():
            skills_data[skill_name] = {
                "skill_name": skill_node.skill_name,
                "proficiency_level": skill_node.proficiency_level,
                "times_practiced": skill_node.times_practiced,
                "last_practiced": skill_node.last_practiced,
                "prerequisite_skills": skill_node.prerequisite_skills,
                "dependent_skills": skill_node.dependent_skills
            }
        
        skill_tree_data = {
            "id": str(uuid.uuid4()),
            "user_id": skill_tree.user_id,
            "skills": skills_data,
            "updated_at": skill_tree.updated_at
        }
        
        # Update or create
        existing = orm.skill_progress.scan(
            filter_expression="user_id = :user_id",
            expression_values={":user_id": skill_tree.user_id}
        )
        
        if existing.items:
            orm.skill_progress.update(existing.items[0].to_dict()['id'], skill_tree_data)
        else:
            orm.skill_progress.create(skill_tree_data)
    
    def analyze_skill_gaps(self, user_id: str, required_skills: List[str]) -> Dict[str, Any]:
        """Analyze skill gaps for a user given required skills"""
        from .learner_profile import LearnerProfileManager
        
        skill_tree = self.get_or_create_skill_tree(user_id)
        profile_manager = LearnerProfileManager()
        profile = profile_manager.get_or_create_profile(user_id)
        
        # Get current skill gaps
        skill_gaps = skill_tree.get_skill_gaps(required_skills)
        
        # Get recommended skills to work on
        recommended_skills = skill_tree.get_recommended_next_skills()
        
        # Calculate overall skill level
        total_skills = len(skill_tree.skills)
        mastered_skills = sum(1 for skill in skill_tree.skills.values() 
                            if skill.proficiency_level >= 75)
        skill_level_percentage = (mastered_skills / total_skills * 100) if total_skills > 0 else 0
        
        return {
            "skill_gaps": skill_gaps,
            "recommended_skills": recommended_skills,
            "overall_skill_level": skill_level_percentage,
            "learning_pace": profile.learning_pace,
            "completion_rate": profile.calculate_completion_rate(),
            "areas_for_improvement": [
                skill.skill_name for skill in skill_tree.skills.values()
                if skill.proficiency_level < 50 and skill.times_practiced > 2
            ]
        }
    
    def get_skill_progression_path(self, user_id: str, target_skill: str) -> List[str]:
        """Get the learning path to achieve a target skill"""
        skill_tree = self.get_or_create_skill_tree(user_id)
        
        if target_skill not in skill_tree.skills:
            return []
        
        path = []
        visited = set()
        
        def find_prerequisites(skill_name: str):
            if skill_name in visited:
                return
            
            visited.add(skill_name)
            skill = skill_tree.skills.get(skill_name)
            
            if skill:
                # Add prerequisites first
                for prereq in skill.prerequisite_skills:
                    if prereq in skill_tree.skills and skill_tree.skills[prereq].proficiency_level < 75:
                        find_prerequisites(prereq)
                
                # Add current skill if not mastered
                if skill.proficiency_level < 75 and skill_name not in path:
                    path.append(skill_name)
        
        find_prerequisites(target_skill)
        return path
    
    def topological_sort_skills(self, skills: set, skill_tree: SkillTree) -> List[str]:
        """Sort skills based on prerequisite dependencies"""
        # Simple topological sort
        result = []
        visited = set()
        temp_visited = set()
        
        def visit(skill):
            if skill in temp_visited:
                return  # Cycle detected, skip
            if skill in visited:
                return
            
            temp_visited.add(skill)
            
            # Visit prerequisites first
            if skill in skill_tree.skills:
                for prereq in skill_tree.skills[skill].prerequisite_skills:
                    if prereq in skills:
                        visit(prereq)
            
            temp_visited.remove(skill)
            visited.add(skill)
            result.append(skill)
        
        for skill in skills:
            if skill not in visited:
                visit(skill)
        
        return result
