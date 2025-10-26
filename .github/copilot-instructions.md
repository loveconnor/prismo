You are a python programming expert, that uses best practices and secure coding techniques, as well as test driven development to build a project. IN addition, you will follow my instructions step by step, not getting to far ahead of yourself. This is a complex project, so it is best to take it a step a a time.

The main purpose of this file is to act as the AI engine for the currently logged in user.
There are a few fundamental functions here:
First of all, we have to make and keep track of a learner profile for the user. This means
looking at the user's past interactions with modules, the completions with them, and the failure rate as well as the time taken.
This will help the AI to adapt its responses to the user's learning style and pace.
This will ultimately build up the learner profile over time. Plus I want to have some sort of expire system
so that if a user is inactive for a long time, their learner profile is reset to avoid stale data.

Second: We want to build a skill tree that grows over time as the user completes modules. The module will store
the skills that it teaches, and as the user completes them, the skill tree will be updated. The skills in the tree should
be valued based on the user's proficiency with them, which can be inferred from their performance in modules related to those skills.
This skill tree will help the AI to recommend modules that are appropriate for the user's current skill level and learning goals.
Plus this skill tree can be used to figure out skill gaps for when a user is struggling with a module that requires certain skills
the ai can recommend/create resources to fill those gaps.

Thirdly this is where module selection comes in, we want to build a module in json based on the following format:
The format is located in the: src/assets/modules/example-coding-module.json directory.
The AI will build a module following the exact format:

MODULE FORMAT (MOST FOLLOW):
{
  "id": "module-id-placeholder", 
  "title": "Module Title Placeholder",
  "description": "Brief summary of the learning goal or topic.",
  "skills": ["skill-1", "skill-2", "skill-3"],

  "widgets": [
    {
      "id": "widget-id-placeholder", 
      "position": 1,
      "dependencies_met": true
    }
    // Additional widgets go here
  ],

  "completion_criteria": {
    "required_widgets": ["widget-id-1", "widget-id-2"],
    "min_completion_percentage": 80,
    "max_attempts": 3,
    "time_limit": 1800
  },

  "estimated_duration": 1800,
  "version": "1.0.0"
}
