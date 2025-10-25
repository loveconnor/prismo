"""
Module Generation Engine

Creates custom modules using AI-powered generation through the STEVE API.
Generates adaptive content based on user profile, skill requirements, and available widgets.
"""

import uuid
import json
import os
import aiohttp
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.orm import orm
from .learner_profile import LearnerProfile, LearnerProfileManager
from .skill_tree import SkillTreeManager


class ModuleGenerator:
    """Generates custom learning modules using STEVE API"""
    
    def __init__(self):
        self.profile_manager = LearnerProfileManager()
        self.skill_manager = SkillTreeManager()
        self.steve_api_url = os.getenv("STEVE_API_URL", "http://localhost:3000/generate-content")
        self.steve_api_key = os.getenv("STEVE_API_KEY")
        self.widget_registry = self._load_widget_registry()
        
        if not self.steve_api_key:
            raise ValueError("STEVE_API_KEY environment variable is required")
    
    def _load_widget_registry(self) -> List[Dict[str, Any]]:
        """Load widget registry from assets folder"""
        try:
            # Get the absolute path to the widgets registry
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
            registry_path = os.path.join(project_root, "src", "assets", "widgets", "registry.json")
            
            with open(registry_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load widget registry: {e}")
            return []
    
    
    async def generate_module(self, user_id: str, topic: str, target_skills: List[str], 
                       difficulty: str = "beginner", estimated_time: int = 1800) -> Dict[str, Any]:
        """Generate a new module using STEVE API in the exact required JSON format"""
        profile = self.profile_manager.get_or_create_profile(user_id)
        skill_tree = self.skill_manager.get_or_create_skill_tree(user_id)
        
        # Generate unique module ID
        module_id = f"{topic.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}"
        
        # Prepare context for AI generation
        generation_context = self._prepare_generation_context(
            user_id, topic, target_skills, difficulty, profile, skill_tree
        )
        
        # Use STEVE API to generate the module
        module = await self._generate_module_with_steve_api(
            module_id, topic, target_skills, difficulty, estimated_time, generation_context
        )
        
        return module
    
    def _prepare_generation_context(self, user_id: str, topic: str, target_skills: List[str], 
                                  difficulty: str, profile: LearnerProfile, skill_tree) -> str:
        """Prepare context information for the AI to generate appropriate modules"""
        
        # Get relevant widgets for the target skills
        relevant_widgets = [w for w in self.widget_registry if any(skill in w.get('skills', []) for skill in target_skills)]
        
        context = f"""
        USER PROFILE:
        - User ID: {user_id}
        - Learning Pace: {profile.learning_pace}
        - Failure Rate: {profile.failure_rate:.2f}
        - Average Completion Time: {profile.average_completion_time}s
        - Completion Rate: {profile.calculate_completion_rate():.1f}%
        
        TARGET LEARNING:
        - Topic: {topic}
        - Target Skills: {', '.join(target_skills)}
        - Difficulty Level: {difficulty}
        
        AVAILABLE WIDGETS:
        {json.dumps(relevant_widgets, indent=2)}
        
        WIDGET REGISTRY (All Available):
        {json.dumps(self.widget_registry[:10], indent=2)}  # First 10 widgets as examples
        
        SKILL TREE STATUS:
        - Current Skills: {', '.join(skill_tree.get_mastered_skills()[:5])}
        - Recommended Next Skills: {', '.join(skill_tree.get_recommended_next_skills()[:3])}
        """
        
        return context
    
    async def _generate_module_with_steve_api(self, module_id: str, topic: str, target_skills: List[str],
                                            difficulty: str, estimated_time: int, context: str) -> Dict[str, Any]:
        """Use STEVE API to generate a module following the exact format"""
        
        # Define the exact module schema that STEVE API should follow
        module_schema = {
            "type": "OBJECT",
            "properties": {
                "id": {"type": "STRING"},
                "title": {"type": "STRING"},
                "description": {"type": "STRING"},
                "skills": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "widgets": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "id": {"type": "STRING"},
                            "metadata": {
                                "type": "OBJECT",
                                "properties": {
                                    "id": {"type": "STRING"},
                                    "title": {"type": "STRING"},
                                    "description": {"type": "STRING"},
                                    "skills": {"type": "ARRAY", "items": {"type": "STRING"}},
                                    "difficulty": {"type": "NUMBER"},
                                    "estimated_time": {"type": "NUMBER"},
                                    "input_type": {"type": "STRING"},
                                    "output_type": {"type": "STRING"},
                                    "dependencies": {"type": "ARRAY", "items": {"type": "STRING"}},
                                    "adaptive_hooks": {"type": "OBJECT"},
                                    "version": {"type": "STRING"},
                                    "category": {"type": "STRING"}
                                },
                                "required": ["id", "title", "description", "skills", "difficulty", "estimated_time", "input_type", "output_type", "dependencies", "version", "category"]
                            },
                            "props": {"type": "OBJECT"},
                            "position": {"type": "NUMBER"},
                            "dependencies_met": {"type": "BOOLEAN"}
                        },
                        "required": ["id", "metadata", "props", "position", "dependencies_met"]
                    }
                },
                "completion_criteria": {
                    "type": "OBJECT",
                    "properties": {
                        "required_widgets": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "min_completion_percentage": {"type": "NUMBER"},
                        "max_attempts": {"type": "NUMBER"},
                        "time_limit": {"type": "NUMBER"}
                    },
                    "required": ["required_widgets", "min_completion_percentage", "max_attempts", "time_limit"]
                },
                "estimated_duration": {"type": "NUMBER"},
                "version": {"type": "STRING"}
            },
            "required": ["id", "title", "description", "skills", "widgets", "completion_criteria", "estimated_duration", "version"]
        }
        
        # Create the prompt for STEVE API
        prompt = f"""
        Create a learning module for the topic "{topic}" targeting these skills: {', '.join(target_skills)}.
        
        Requirements:
        1. Module ID should be: {module_id}
        2. Difficulty level: {difficulty}
        3. Estimated duration: {estimated_time} seconds
        4. Version: "1.0.0"
        
        Context about the learner and available resources:
        {context}
        
        CRITICAL INSTRUCTIONS:
        - Use ONLY widgets that exist in the provided widget registry
        - Each widget in the module must include complete metadata from the registry
        - Widget props should be customized for the specific topic and learning goals
        - Always include a "step-prompt" widget as the first widget (position 1)
        - Include appropriate widgets based on the target skills
        - Ensure completion_criteria includes logical required widgets
        - All widgets should have dependencies_met set to true for this basic module
        - Widget positions should be sequential starting from 1
        
        Generate a complete, valid learning module following the exact JSON structure.
        """
        
        system_instruction = """
        You are an expert educational content creator specializing in adaptive learning modules.
        Create engaging, pedagogically sound learning experiences that match the learner's profile.
        Always follow the exact JSON schema provided and use only the widgets available in the registry.
        Ensure the module is appropriately challenging for the specified difficulty level.
        """
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "prompt": prompt,
                    "systemInstruction": system_instruction,
                    "responseType": "json",
                    "responseSchema": module_schema,
                    "temperature": 0.7
                }
                
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": self.steve_api_key
                }
                
                async with session.post(self.steve_api_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        module = await response.json()
                        # Validate the generated module
                        self._validate_generated_module(module)
                        return module
                    else:
                        error_text = await response.text()
                        raise Exception(f"STEVE API error {response.status}: {error_text}")
                        
        except Exception as e:
            print(f"Error generating module with STEVE API: {e}")
            # Fallback to a basic module structure if API fails
            return self._create_fallback_module(module_id, topic, target_skills, estimated_time)
    
    def _validate_generated_module(self, module: Dict[str, Any]) -> None:
        """Validate that the generated module follows the required format"""
        required_fields = ["id", "title", "description", "skills", "widgets", "completion_criteria", "estimated_duration", "version"]
        
        for field in required_fields:
            if field not in module:
                raise ValueError(f"Generated module missing required field: {field}")
        
        # Validate widgets
        if not isinstance(module["widgets"], list) or len(module["widgets"]) == 0:
            raise ValueError("Module must have at least one widget")
        
        for widget in module["widgets"]:
            required_widget_fields = ["id", "metadata", "props", "position", "dependencies_met"]
            for field in required_widget_fields:
                if field not in widget:
                    raise ValueError(f"Widget missing required field: {field}")
    
    def _create_fallback_module(self, module_id: str, topic: str, target_skills: List[str], estimated_time: int) -> Dict[str, Any]:
        """Create a basic fallback module if API generation fails"""
        return {
            "id": module_id,
            "title": f"Introduction to {topic}",
            "description": f"Learn the fundamentals of {topic} through interactive exercises.",
            "skills": target_skills,
            "widgets": [
                {
                    "id": "step-prompt",
                    "metadata": {
                        "id": "step-prompt",
                        "title": "Step Prompt",
                        "description": "Displays task or question text with optional formatting",
                        "skills": ["comprehension", "reading"],
                        "difficulty": 2,
                        "estimated_time": 30,
                        "input_type": "text",
                        "output_type": "scaffold",
                        "dependencies": [],
                        "adaptive_hooks": {
                            "difficulty_adjustment": True,
                            "hint_progression": False
                        },
                        "version": "1.0.0",
                        "category": "core"
                    },
                    "props": {
                        "title": f"Welcome to {topic}!",
                        "prompt": f"In this module, you'll explore {topic}. Take your time and practice as much as you need.",
                        "estimatedTime": 30
                    },
                    "position": 1,
                    "dependencies_met": True
                }
            ],
            "completion_criteria": {
                "required_widgets": ["step-prompt"],
                "min_completion_percentage": 80,
                "max_attempts": 3,
                "time_limit": estimated_time
            },
            "estimated_duration": estimated_time,
            "version": "1.0.0"
        }
    
    
    def save_generated_module(self, module: Dict[str, Any], user_id: str) -> str:
        """Save generated module to database and return module ID"""
        module_data = {
            "id": module["id"],
            "user_id": user_id,
            "name": module["title"],
            "module_type": "generated",
            "content": module,
            "is_public": False,
            "tags": module["skills"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        saved_module = orm.modules.create(module_data)
        return saved_module.to_dict()["id"]
    
    async def create_personalized_module(self, user_id: str, learning_goal: str = None) -> Dict[str, Any]:
        """Create a personalized module based on user's current state using STEVE API"""
        profile = self.profile_manager.get_or_create_profile(user_id)
        skill_tree = self.skill_manager.get_or_create_skill_tree(user_id)
        
        # Determine what skills to focus on
        if learning_goal:
            target_skills = [learning_goal]
        else:
            # Get skills that need work
            target_skills = skill_tree.get_recommended_next_skills()[:3]
            if not target_skills:
                target_skills = ["problem-solving", "critical-thinking"]
        
        # Determine topic based on skills
        topic = self._generate_topic_from_skills(target_skills)
        
        # Determine difficulty based on profile
        if profile.failure_rate > 0.4:
            difficulty = "beginner"
        elif profile.calculate_completion_rate() > 80 and profile.learning_pace == "fast":
            difficulty = "intermediate"
        else:
            difficulty = "beginner"
        
        # Adjust estimated time based on learning pace
        if profile.learning_pace == "fast":
            estimated_time = int(profile.average_completion_time * 0.8) if profile.average_completion_time > 0 else 1200
        elif profile.learning_pace == "slow":
            estimated_time = int(profile.average_completion_time * 1.5) if profile.average_completion_time > 0 else 2400
        else:
            estimated_time = int(profile.average_completion_time) if profile.average_completion_time > 0 else 1800
        
        # Generate the module using STEVE API
        module = await self.generate_module(user_id, topic, target_skills, difficulty, estimated_time)
        
        # Save to database
        module_id = self.save_generated_module(module, user_id)
        module["saved_id"] = module_id
        
        return module
    
    def _generate_topic_from_skills(self, skills: List[str]) -> str:
        """Generate appropriate topic name from skills"""
        if "javascript" in skills:
            return "JavaScript Programming"
        elif "python" in skills:
            return "Python Programming"
        elif "functions" in skills:
            return "Function Mastery"
        elif "algebra" in skills:
            return "Algebraic Thinking"
        elif "problem-solving" in skills:
            return "Problem Solving Strategies"
        else:
            return "Learning Fundamentals"
    
    # Synchronous wrapper methods for backward compatibility
    def generate_module_sync(self, user_id: str, topic: str, target_skills: List[str], 
                            difficulty: str = "beginner", estimated_time: int = 1800) -> Dict[str, Any]:
        """Synchronous wrapper for generate_module"""
        return asyncio.run(self.generate_module(user_id, topic, target_skills, difficulty, estimated_time))
    
    def create_personalized_module_sync(self, user_id: str, learning_goal: str = None) -> Dict[str, Any]:
        """Synchronous wrapper for create_personalized_module"""
        return asyncio.run(self.create_personalized_module(user_id, learning_goal))
