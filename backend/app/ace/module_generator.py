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
from app.orm import orm
from app.claude_routes import get_claude_response
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
        
        print(f"✓ ModuleGenerator initialized with Claude via Bedrock")
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

        # Generate unique module name
        module_name = f"{topic.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}"

        # Prepare context for AI generation
        generation_context = self._prepare_generation_context(
            user_id, topic, target_skills, difficulty, profile, skill_tree
        )
        
        # Use AWS Bedrock to generate the module
        module = await self._generate_module_with_bedrock(
            module_name, topic, target_skills, difficulty, estimated_time, generation_context
        )
        
        return module
    
    def _prepare_generation_context(self, user_id: str, topic: str, target_skills: List[str], 
                                  difficulty: str, profile: LearnerProfile, skill_tree) -> str:
        """Prepare context information for the AI to generate appropriate modules"""
        
        # Get relevant widgets for the target skills
        relevant_widget_names = [w['name'] for w in self.widget_registry if any(skill in w.get('skills', []) for skill in target_skills)]
        
        context = f"""USER: pace={profile.learning_pace}, fail_rate={profile.failure_rate:.1f}, completion={profile.calculate_completion_rate():.0f}%
TOPIC: {topic} | SKILLS: {', '.join(target_skills)} | DIFFICULTY: {difficulty}
RECOMMENDED_WIDGETS: {', '.join(relevant_widget_names[:10])}
SKILL_STATUS: mastered={', '.join(skill_tree.get_mastered_skills()[:3])}, next={', '.join(skill_tree.get_recommended_next_skills()[:2])}"""
        return context
    
    def _get_widget_schema_reference(self) -> str:
        """Create a compact reference of all available widgets with their schemas"""
        widget_summary = []
        for widget in self.widget_registry:
            widget_summary.append({
                "name": widget.get("name"),
                "title": widget.get("title"),
                "skills": widget.get("skills", []),
                "category": widget.get("category"),
                "props_hint": self._get_props_example(widget.get("name"))
            })
        return json.dumps(widget_summary, indent=2)
    
    def _get_props_example(self, widget_name: str) -> str:
        """Return a brief hint about expected props for each widget type"""
        props_examples = {
            "step-prompt": "title, prompt, estimatedTime",
            "confidence-meter": "minLabel, maxLabel, question",
            "feedback-box": "type, title, message, explanation, nextSteps (MUST BE ARRAY)",
            "multiple-choice": "title, question, options, correctAnswer",
            "code-editor": "title, language, starterCode, testCases",
            "short-answer": "title, question, expectedAnswer",
            "hint-panel": "hints (array with tier, text)",
            "fill-in-blanks": "title, sentence, blanks",
            "matching-pairs": "title, pairs",
            "numeric-input": "title, question, correctAnswer, tolerance",
        }
        return props_examples.get(widget_name, "title, content")
    
    def _get_compact_registry(self) -> str:
        """Return a compact, formatted version of the registry for AI consumption"""
        # For critical widgets (step-prompt, confidence-meter, feedback-box), include full schema
        # For others, include abbreviated version
        critical_widgets = ["step-prompt", "confidence-meter", "feedback-box"]
        full_schemas = []
        abbreviated = []
        
        for widget in self.widget_registry:
            # Convert 'name' to 'id' for metadata
            widget_copy = widget.copy()
            if "name" in widget_copy:
                widget_copy["id"] = widget_copy.pop("name")
            
            if widget.get("name") in critical_widgets or widget.get("id") in critical_widgets:
                full_schemas.append(widget_copy)
            else:
                # Keep essential fields only - MUST include description
                abbreviated.append({
                    "id": widget.get("name"),
                    "title": widget.get("title"),
                    "description": widget.get("description"),  # CRITICAL: Must include description
                    "skills": widget.get("skills", []),
                    "category": widget.get("category"),
                    "difficulty": widget.get("difficulty"),
                    "estimated_time": widget.get("estimated_time"),
                    "input_type": widget.get("input_type"),
                    "output_type": widget.get("output_type"),
                    "dependencies": widget.get("dependencies", []),
                    "adaptive_hooks": widget.get("adaptive_hooks", {}),
                    "version": widget.get("version", "1.0.0")
                })
        
        return f"""CRITICAL WIDGETS (use exact schemas, copy metadata exactly):
{json.dumps(full_schemas, indent=2)}

OTHER AVAILABLE WIDGETS (copy structure, adapt props):
{json.dumps(abbreviated, indent=2)}"""
    
    def _fix_json_string(self, text: str) -> str:
        """Attempt to fix common JSON formatting issues by escaping unescaped newlines in string values"""
        import re
        
        # This function fixes strings that contain literal newlines instead of \n
        # Strategy: Find string values (content between quotes) and escape special chars
        
        result = []
        in_string = False
        escape_next = False
        i = 0
        
        while i < len(text):
            char = text[i]
            
            # Handle escape sequences
            if escape_next:
                result.append(char)
                escape_next = False
                i += 1
                continue
            
            # Check for backslash (escape character)
            if char == '\\':
                result.append(char)
                escape_next = True
                i += 1
                continue
            
            # Toggle string mode when we hit a quote
            if char == '"':
                result.append(char)
                in_string = not in_string
                i += 1
                continue
            
            # If we're inside a string, escape special characters
            if in_string:
                if char == '\n':
                    result.append('\\n')
                elif char == '\r':
                    result.append('\\r')
                elif char == '\t':
                    result.append('\\t')
                else:
                    result.append(char)
            else:
                # Outside strings, keep everything as-is
                result.append(char)
            
            i += 1
        
        return ''.join(result)
    
    async def _generate_module_with_bedrock(self, module_name: str, topic: str, target_skills: List[str],
                                            difficulty: str, estimated_time: int, context: str) -> Dict[str, Any]:
        """Use AWS Bedrock API to generate a module with strict JSON output"""
        
        # Widget difficulty mapping - reduced to fit in token limit
        widget_counts = {"beginner": 2, "intermediate": 3, "advanced": 5}
        num_learning_widgets = widget_counts.get(difficulty, 2)
        
        # Create the streamlined prompt
        prompt = f"""Generate a learning module for "{topic}" as valid JSON only (no markdown, no explanations).

CRITICAL JSON RULES:
1. All strings MUST be on ONE line - replace actual newlines with \\n
2. Escape quotes inside strings: use \\" not "
3. For code in "starterCode" field: replace newlines with \\n, NOT actual line breaks
4. Keep "prompt" and "starterCode" content CONCISE (under 500 chars each)
5. Example: "starterCode": "line1\\nline2\\nline3" NOT "starterCode": "line1
   line2"

=== OUTPUT FORMAT ===
{{
  "name": "{module_name}",
  "title": "<engaging_title>",
  "description": "<learning_objective>",
  "skills": {json.dumps(target_skills)},
  "widgets": [<see WIDGET STRUCTURE below>],
  "completion_criteria": {{
    "required_widgets": ["<learning-widget-names-only>"],
    "min_completion_percentage": 80,
    "max_attempts": 3,
    "time_limit": {estimated_time}
  }},
  "estimated_duration": {estimated_time},
  "version": "1.0.0"
}}

=== MANDATORY RULES ===
1. WIDGET PATTERN (STRICT - NO EXCEPTIONS):
   Pos 1-3: step-prompt → feedback-box → confidence-meter (intro)
   Pos 4-6: [learning-widget] → feedback-box → confidence-meter
   Pos 7-9: [learning-widget] → feedback-box → confidence-meter
   Continue for {num_learning_widgets} learning widgets total

2. WIDGET STRUCTURE:
   {{
     "id": "<widget-type>",  // CRITICAL: Must match metadata.id (e.g., "step-prompt")
     "metadata": {{
       "id": "<widget-type>",  // MUST BE SAME as root "id" (e.g., "step-prompt")
       "title": "<Widget Title>",  // REQUIRED
       "description": "<What this widget does>",  // REQUIRED - DO NOT OMIT
       "skills": ["skill1", "skill2"],  // REQUIRED
       "difficulty": 2,  // REQUIRED
       "estimated_time": 30,  // REQUIRED
       "input_type": "text",  // REQUIRED
       "output_type": "scaffold",  // REQUIRED
       "dependencies": [],  // REQUIRED
       "adaptive_hooks": {{}},  // REQUIRED
       "version": "1.0.0",  // REQUIRED
       "category": "core"  // REQUIRED
     }},
     "props": {{<custom_content_per_props_hint>}},
     "position": <number>,  // SEE RULE 3 BELOW
     "dependencies_met": true
   }}
   
   CRITICAL: Root "id" MUST equal metadata "id"
   Example: Both should be "step-prompt" or "confidence-meter", NOT unique names like "intro-step-prompt-001"
   
   REQUIRED METADATA FIELDS (12 total):
   id, title, description, skills, difficulty, estimated_time,
   input_type, output_type, dependencies, adaptive_hooks, version, category

3. POSITION FIELD RULES (CRITICAL):
   ✓ INCLUDE "position" for ACTIVE LEARNING widgets that require user work:
     - step-prompt (instructional content)
     - code-editor (coding exercises)
     - multiple-choice (questions)
     - short-answer (text responses)
     - fill-in-blanks (completion tasks)
     - matching-pairs (matching exercises)
     - numeric-input (math problems)
     - text-editor (writing tasks)
     
   ✗ EXCLUDE "position" (DO NOT ADD) for PASSIVE/SUPPORT widgets:
     - feedback-box (provides feedback, no user action)
     - confidence-meter (optional self-assessment)
     - hint-panel (optional help, no required action)

    THE POSITION NUMBER ONLY INCREMENTS FOR ACTIVE LEARNING WIDGETS. So feedback and confidence-meter widgets do NOT increment the position value
   Example CORRECT structure:
   {{
     "id": "step-prompt",
     "metadata": {{...}},
     "props": {{...}},
     "position": 1,  // ✓ Has position - active learning
     "dependencies_met": true
   }}
   
   {{
     "id": "feedback-box",
     "metadata": {{...}},
     "props": {{...}},
     "dependencies_met": true  // ✗ NO position field - passive widget
   }}


4. metadata.id values: step-prompt | feedback-box | confidence-meter | multiple-choice | code-editor | short-answer | etc.

=== CRITICAL: FEEDBACK-BOX PROPS EXAMPLE ===
CORRECT feedback-box props structure:
{{
  "type": "success",  // or "error", "warning", "info"
  "title": "Great Job!",
  "message": "You completed the task successfully.",
  "explanation": "This demonstrates your understanding of the concept.",
  "nextSteps": [
    "Try the next challenge",
    "Review the documentation",
    "Practice with variations"
  ]
}}

WRONG (DO NOT USE):
{{
  "nextSteps": "Try the next challenge"  // ❌ NEVER use string, MUST be array
}}

=== WIDGET QUICK REF ===
{self._get_widget_schema_reference()}

=== WIDGET REGISTRY ===
{self._get_compact_registry()}

=== CONTEXT ===
{context}

Return JSON only."""
        
        # System prompt for Claude
        system_prompt = """You are an expert educational content architect. Output ONLY valid JSON.
CRITICAL: ALL string values must be on a SINGLE line. Replace newlines with \\n escape sequences.
For multi-line code in "starterCode" or "prompt" fields: Use \\n NOT actual line breaks.
Example: "starterCode": "import React\\n\\nfunction App() {\\n  return <div>Hello</div>\\n}"

CRITICAL POSITION FIELD RULE:
- CHOOSE widgets based on the learning objective, if they want multiple choice, use a multiple-choice widget.
- ONLY add "position" field to widgets requiring active learning/user work
- INCLUDE position: step-prompt, code-editor, multiple-choice, short-answer, fill-in-blanks, matching-pairs, numeric-input, text-editor
- EXCLUDE position: feedback-box, confidence-meter, hint-panel
- WHEN GIVING CODE PROBELMS: Do not give the solution in the starterCode
- Example: feedback-box and confidence-meter should NOT have "position" field

CRITICAL FEEDBACK-BOX RULE:
- nextSteps MUST ALWAYS be an ARRAY of strings: ["step1", "step2", "step3"]
- NEVER use a string for nextSteps: "step1" ❌
- Even for single step, use array: ["step1"] ✓

After every learning widget, insert confidence-meter then feedback-box widgets. Match widget metadata exactly to registry schemas."""
        
        try:
            print(f"📡 Calling Claude via Bedrock")
            print(f"   Topic: {topic}")
            print(f"   Target Skills: {', '.join(target_skills)}")
            
            # Wait for rate limiter before making request
            await self.rate_limiter.acquire()
            
            # Make the API call using claude_routes function
            loop = asyncio.get_event_loop()
            generated_text = await loop.run_in_executor(
                None,
                lambda: get_claude_response(prompt, system_prompt, max_tokens=200000)
            )
            
            if generated_text:
                print(f"✓ Claude returned response ({len(generated_text)} chars)")
                
                # Clean up the response (remove markdown if present)
                generated_text = generated_text.strip()
                if generated_text.startswith('```json'):
                    generated_text = generated_text[7:]
                if generated_text.startswith('```'):
                    generated_text = generated_text[3:]
                if generated_text.endswith('```'):
                    generated_text = generated_text[:-3]
                generated_text = generated_text.strip()
                
                # Try to parse the JSON
                try:
                    module = json.loads(generated_text)
                except json.JSONDecodeError as e:
                    print(f"⚠️  JSON parse error: {e}")
                    print(f"   Attempting to fix common JSON issues...")
                    
                    # Save the raw response for debugging first
                    debug_file = f"/tmp/module_generation_error_{int(time.time())}.txt"
                    with open(debug_file, 'w') as f:
                        f.write(generated_text)
                    print(f"   Raw response saved to: {debug_file}")
                    
                    # Try to fix the JSON by escaping unescaped content
                    try:
                        fixed_text = self._fix_json_string(generated_text)
                        module = json.loads(fixed_text)
                        print(f"✓ Successfully fixed and parsed JSON!")
                    except Exception as fix_error:
                        print(f"   Failed to fix JSON: {fix_error}")
                        # Re-raise original error
                        raise
                
                print(f"✓ Successfully parsed module: {module.get('name', 'unknown')}")
                print(f"✓ Module has {len(module.get('widgets', []))} widgets")
                
                # Validate the generated module
                self._validate_generated_module(module)
                return module
            else:
                raise Exception("No response from Claude")
                        
        except json.JSONDecodeError as e:
            print(f"✗ Failed to parse JSON from Bedrock response: {e}")
            print(f"   Response text: {generated_text[:500]}...")
            return self._create_fallback_module(module_name, topic, target_skills, estimated_time)
        except Exception as e:
            print(f"✗ Error generating module with Bedrock: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to a basic module structure if API fails
            return self._create_fallback_module(module_name, topic, target_skills, estimated_time)
    
    def _validate_generated_module(self, module: Dict[str, Any]) -> None:
        """Validate that the generated module follows the required format"""
        required_fields = ["name", "title", "description", "skills", "widgets", "completion_criteria", "estimated_duration", "version"]
        
        for field in required_fields:
            if field not in module:
                raise ValueError(f"Generated module missing required field: {field}")
        
        # Validate widgets
        if not isinstance(module["widgets"], list) or len(module["widgets"]) == 0:
            raise ValueError("Module must have at least one widget")
        
        for i, widget in enumerate(module["widgets"]):
            # CRITICAL: Frontend expects "id" at root level, NOT "name"
            # Convert "name" to "id" if AI generated "name"
            if "name" in widget and "id" not in widget:
                widget["id"] = widget.pop("name")
                print(f"⚠️  Widget {i}: converted 'name' to 'id': {widget['id']}")
            elif "id" not in widget:
                # Generate an id if missing
                widget_type = widget.get("metadata", {}).get("id", "unknown")
                widget["id"] = widget_type  # Use widget type, not unique name
                print(f"⚠️  Warning: Widget {i} missing 'id', auto-generated: {widget['id']}")
            
            # CRITICAL: Root "id" must match metadata "id"
            metadata_id = widget.get("metadata", {}).get("id")
            if metadata_id and widget.get("id") != metadata_id:
                print(f"⚠️  Widget {i}: root id '{widget['id']}' doesn't match metadata.id '{metadata_id}', fixing...")
                widget["id"] = metadata_id
            
            # CRITICAL: Remove position from passive/support widgets
            passive_widget_types = ['feedback-box', 'confidence-meter', 'hint-panel']
            widget_type = widget.get("id") or widget.get("metadata", {}).get("id")
            
            if widget_type in passive_widget_types:
                if "position" in widget:
                    print(f"⚠️  Widget {i} ({widget_type}): Removing 'position' field - passive widget doesn't need it")
                    del widget["position"]
            elif "position" not in widget:
                # Auto-assign position if missing for active learning widgets
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
    
    def _create_fallback_module(self, module_name: str, topic: str, target_skills: List[str], estimated_time: int) -> Dict[str, Any]:
        """Create a basic fallback module if API generation fails"""
        return {
            "name": module_name,
            "title": f"Introduction to {topic}",
            "description": f"Learn the fundamentals of {topic} through interactive exercises.",
            "skills": target_skills,
            "widgets": [
                {
                    "id": "step-prompt",  # Root id must match metadata.id
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
        """Save generated module to database and return module name"""
        print("Saving generated module to database...")
        module_data = {
            "id": str(uuid.uuid4()),  # Generate a unique ID for database
            "user_id": user_id,
            "name": module["name"],  # Use the module name from the generated content
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
        """Create a personalized module based on user's current state using Bedrock API"""
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
        
        # Generate the module using Bedrock API
        module = await self.generate_module(user_id, topic, target_skills, difficulty, estimated_time)
        
        # Save to database
        module_name = self.save_generated_module(module, user_id)
        module["saved_id"] = module_name
        
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
