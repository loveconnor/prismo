"""
ACE (Adaptive Content Engine) Package

This package provides the AI engine for creating personalized learning experiences.
It tracks learner profiles, builds skill trees, and generates appropriate content.
"""

from .engine import ACEEngine
from .learner_profile import LearnerProfile
from .skill_tree import SkillTree, SkillNode
from .module_generator import ModuleGenerator
from .module_selector import ModuleSelector

__all__ = [
    'ACEEngine',
    'LearnerProfile', 
    'SkillTree',
    'SkillNode',
    'ModuleGenerator',
    'ModuleSelector'
]
