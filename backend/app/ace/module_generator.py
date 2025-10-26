"""
Module Generation Engine

Creates custom modules using AI-powered generation through AWS Bedrock.
Generates adaptive content based on user profile, skill requirements, and available widgets.
"""

import uuid
import json
import os
import asyncio
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests
from app.orm import orm
from .learner_profile import LearnerProfile, LearnerProfileManager
from .skill_tree import SkillTreeManager


class RateLimiter:
    """Simple rate limiter to avoid hitting API limits"""
    
    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.min_interval = 60.0 / requests_per_minute
        self.last_request_time = 0
    
    async def acquire(self):
        """Wait if necessary to respect rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_interval:
            wait_time = self.min_interval - time_since_last
            print(f"⏱️  Rate limiter: waiting {wait_time:.1f}s before next request")
            await asyncio.sleep(wait_time)
        
        self.last_request_time = time.time()


class ModuleGenerator:
    """Generates custom learning modules using AWS Bedrock Agent"""
    
    def __init__(self):
        self.profile_manager = LearnerProfileManager()
        self.skill_manager = SkillTreeManager()
        self.widget_registry = self._load_widget_registry()
        
        # Rate limiter to avoid hitting API limits (10 requests per minute by default)
        self.rate_limiter = RateLimiter(requests_per_minute=10)
        
        # AWS Bedrock API configuration
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.bedrock_api_token = os.getenv("BEDROCK_API_TOKEN")
        
        if not self.bedrock_api_token:
            print("⚠️  Warning: BEDROCK_API_TOKEN not found in environment variables")
        else:
            print(f"✓ Bedrock API token loaded")
        
        # Bedrock API endpoint for Claude 3.5 Sonnet
        self.bedrock_url = f"https://bedrock-runtime.{self.aws_region}.amazonaws.com/model/us.anthropic.claude-3-5-sonnet-20241022-v2:0/invoke"
        
        print(f"✓ ModuleGenerator initialized with Bedrock API")
        print(f"✓ Region: {self.aws_region}")
        print(f"✓ Widget registry loaded: {len(self.widget_registry)} widgets")
        print(f"✓ Rate limiter: 10 requests per minute")
    
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
        """Generate a new module using AWS Bedrock in the exact required JSON format"""
        profile = self.profile_manager.get_or_create_profile(user_id)
        skill_tree = self.skill_manager.get_or_create_skill_tree(user_id)
        
        # Generate unique module ID
        module_id = f"{topic.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}"
        
        # Prepare context for AI generation
        generation_context = self._prepare_generation_context(
            user_id, topic, target_skills, difficulty, profile, skill_tree
        )
        
        # Use AWS Bedrock to generate the module
        module = await self._generate_module_with_bedrock(
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
    
    async def _generate_module_with_bedrock(self, module_id: str, topic: str, target_skills: List[str],
                                            difficulty: str, estimated_time: int, context: str) -> Dict[str, Any]:
        """Use AWS Bedrock API to generate a module with strict JSON output"""
        
        # Create the prompt with explicit JSON structure
        prompt = f"""Create a complete learning module JSON for the topic "{topic}" targeting these skills: {', '.join(target_skills)}.

REQUIRED MODULE STRUCTURE (return ONLY valid JSON, no markdown):
{{
  "id": "{module_id}",
  "title": "Clear, engaging title for {topic}",
  "description": "Brief summary of what the learner will accomplish",
  "skills": {json.dumps(target_skills)},
  "widgets": [
    {{
      "id": "unique-widget-id",
      "metadata": {{
        "id": "widget-type-name",
        "title": "Widget Display Title",
        "description": "What this widget does",
        "skills": ["relevant", "skills"],
        "difficulty": 2,
        "estimated_time": 60,
        "input_type": "text",
        "output_type": "scaffold",
        "dependencies": [],
        "adaptive_hooks": {{
          "difficulty_adjustment": true,
          "hint_progression": false
        }},
        "version": "1.0.0",
        "category": "core"
      }},
      "props": {{
        "title": "Specific title for this instance",
        "prompt": "Instructions or content",
        "estimatedTime": 30
      }},
      "position": 1,
      "dependencies_met": true
    }}
  ],
  "completion_criteria": {{
    "required_widgets": ["list", "of", "widget", "ids"],
    "min_completion_percentage": 80,
    "max_attempts": 3,
    "time_limit": {estimated_time}
  }},
  "estimated_duration": {estimated_time},
  "version": "1.0.0"
}}

WIDGET GENERATION RULES:
1. ALWAYS start with a "step-prompt" widget (position 1) to introduce the module
2. Each widget MUST have both "metadata" (defines the widget type) and "props" (specific instance data)
3. For difficulty "{difficulty}", include:
   - beginner: 3-4 widgets (step-prompt + 2-3 learning widgets)
   - intermediate: 5-6 widgets (step-prompt + 4-5 learning widgets)  
   - advanced: 6-8 widgets (step-prompt + 5-7 learning widgets)
4. Use varied widget types: step-prompt, code-editor, multiple-choice, interactive-demo, practice-exercise
5. Each widget should build on previous ones (progressive learning)
6. Match widgets to target skills from the registry below

Context about the learner:
{context}

Generate ONLY the complete module JSON (no markdown, no explanation, just pure JSON)."""
        
        # Retry configuration for rate limiting
        max_retries = 3
        base_delay = 2  # seconds
        
        try:
            print(f"📡 Calling AWS Bedrock API (Claude 3.5 Sonnet)")
            print(f"   Topic: {topic}")
            print(f"   Target Skills: {', '.join(target_skills)}")
            
            # Wait for rate limiter before making request
            await self.rate_limiter.acquire()
            
            # Prepare the request body for Claude Sonnet 3.5
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "system": "You are an expert educational content creator. Generate ONLY valid JSON. Do not include markdown code blocks, explanations, or any text outside the JSON structure. Always create modules with MULTIPLE widgets (minimum 3-5, never just one). Each module should be a complete learning experience with introduction, learning content, practice, and assessment widgets.",
                "messages": [{"role": "user", "content": prompt}],
            }
            
            # Headers with the Bearer token
            headers = {
                "Authorization": f"Bearer {self.bedrock_api_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            
            # Retry loop for handling rate limits
            for attempt in range(max_retries):
                # Make the API call asynchronously
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: requests.post(self.bedrock_url, headers=headers, data=json.dumps(request_body), timeout=60)
                )
                
                # Check if the request was successful
                if response.status_code == 200:
                    response_body = response.json()
                    
                    # Extract and print the content
                    if "content" in response_body and len(response_body["content"]) > 0:
                        generated_text = response_body["content"][0]["text"]
                        
                        print(f"✓ Bedrock API returned response ({len(generated_text)} chars)")
                        
                        # Clean up the response (remove markdown if present)
                        generated_text = generated_text.strip()
                        if generated_text.startswith('```json'):
                            generated_text = generated_text[7:]
                        if generated_text.startswith('```'):
                            generated_text = generated_text[3:]
                        if generated_text.endswith('```'):
                            generated_text = generated_text[:-3]
                        generated_text = generated_text.strip()
                        
                        # Parse the JSON
                        module = json.loads(generated_text)
                        
                        print(f"✓ Successfully parsed module: {module.get('id', 'unknown')}")
                        print(f"✓ Module has {len(module.get('widgets', []))} widgets")
                        
                        # Validate the generated module
                        self._validate_generated_module(module)
                        return module
                    else:
                        raise Exception("No content found in Bedrock response")
                
                # Handle rate limiting (429 Too Many Requests)
                elif response.status_code == 429:
                    if attempt < max_retries - 1:
                        # Exponential backoff: 2s, 4s, 8s
                        delay = base_delay * (2 ** attempt)
                        print(f"⚠️  Rate limit hit (429). Retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise Exception(f"Rate limit exceeded after {max_retries} attempts. Please try again later.")
                
                # Handle other HTTP errors
                else:
                    # Check if we should retry on certain error codes
                    if response.status_code in [500, 502, 503, 504] and attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        print(f"⚠️  Server error ({response.status_code}). Retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise Exception(f"HTTP {response.status_code}: {response.text}")
                        
        except json.JSONDecodeError as e:
            print(f"✗ Failed to parse JSON from Bedrock response: {e}")
            print(f"   Response text: {generated_text[:500]}...")
            return self._create_fallback_module(module_id, topic, target_skills, estimated_time)
        except Exception as e:
            print(f"✗ Error generating module with Bedrock: {e}")
            import traceback
            traceback.print_exc()
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
        
        for i, widget in enumerate(module["widgets"]):
            # Check for required widget fields (be flexible about structure)
            if "id" not in widget:
                raise ValueError(f"Widget {i} missing required field: id")
            if "position" not in widget:
                # Auto-assign position if missing
                widget["position"] = i + 1
            if "dependencies_met" not in widget:
                # Default to True if missing
                widget["dependencies_met"] = True
            
            # If metadata is missing but we have type/props, that's okay
            # (Some AI models may generate simpler structures)
            if "metadata" not in widget and "type" not in widget:
                print(f"⚠️  Warning: Widget {i} missing both 'metadata' and 'type' fields")
            
            # Ensure props exists (even if empty)
            if "props" not in widget:
                widget["props"] = {}
    
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
        try:
            # Check if we're already in an event loop
            loop = asyncio.get_running_loop()
            # If we get here, we're in a loop - can't use asyncio.run()
            raise RuntimeError(
                "generate_module_sync() cannot be called from an async context. "
                "Use 'await generate_module()' instead."
            )
        except RuntimeError:
            # No running loop, we can use asyncio.run()
            return asyncio.run(self.generate_module(user_id, topic, target_skills, difficulty, estimated_time))
    
    def create_personalized_module_sync(self, user_id: str, learning_goal: str = None) -> Dict[str, Any]:
        """Synchronous wrapper for create_personalized_module"""
        try:
            # Check if we're already in an event loop
            loop = asyncio.get_running_loop()
            # If we get here, we're in a loop - can't use asyncio.run()
            raise RuntimeError(
                "create_personalized_module_sync() cannot be called from an async context. "
                "Use 'await create_personalized_module()' instead."
            )
        except RuntimeError:
            # No running loop, we can use asyncio.run()
            return asyncio.run(self.create_personalized_module(user_id, learning_goal))
