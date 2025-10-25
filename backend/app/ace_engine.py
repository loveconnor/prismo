"""
ACE Engine - Adaptive Content Engine for Prismo

This module provides the AI engine for creating personalized learning experiences.
It tracks learner profiles, builds skill trees, and generates appropriate content.

This is the main entry point that imports from the modularized ACE package.
"""

# Import the main engine and components from the modular structure
from .ace import (
    ACEEngine,
    LearnerProfile,
    SkillTree,
    SkillNode,
    ModuleGenerator,
    ModuleSelector
)

# Create convenience instance for backward compatibility
ace_engine = ACEEngine()

# Export main classes and instance for easy importing
__all__ = [
    'ACEEngine',
    'LearnerProfile', 
    'SkillTree',
    'SkillNode',
    'ModuleGenerator',
    'ModuleSelector',
    'ace_engine'
]