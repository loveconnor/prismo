# Auto-Generated Labs

This folder contains learning modules that have been automatically generated using AI (AWS Bedrock with Claude).

## How It Works

1. **User Creates Lab**: User fills out the "Generate Lab" modal with:
   - Subject (coding, math, writing)
   - Difficulty (beginner, practice, challenge)
   - Skills (e.g., loops, arrays, debugging)
   - Optional goal/focus area

2. **AI Generation**: Backend calls AWS Bedrock (Claude) to generate:
   - Custom learning content
   - Interactive widgets
   - Adaptive difficulty
   - Personalized to user's skill level

3. **Saved to Database & Filesystem**:
   - Module saved to DynamoDB for persistence
   - Also saved here for easy access and debugging
   - Includes metadata (generation timestamp, module ID)

## File Structure

Each file is named after the module with the format:
```
{topic-name}-{unique-id}.json
```

For example:
- `coding-loops-abc123.json`
- `javascript-arrays-def456.json`

## Module Format

Each JSON file contains:
```json
{
  "name": "module-name",
  "title": "Human-Readable Title",
  "description": "What the learner will achieve",
  "skills": ["skill1", "skill2", "skill3"],
  "widgets": [...],
  "completion_criteria": {...},
  "estimated_duration": 1800,
  "version": "1.0.0",
  "_metadata": {
    "generated_at": "2025-10-26T05:00:00Z",
    "module_id": "uuid",
    "saved_to_filesystem": true
  }
}
```

## Skills

Skills are explicitly set by the user and should include:
- User-added skills from the skills input
- Subject selected in the dropdown

For example, if user selects "coding" and adds "loops" and "functions":
- Skills array: `["coding", "loops", "functions"]`

## Usage

These modules can be:
- Loaded directly in the widget lab
- Referenced in development/testing
- Analyzed for quality improvement
- Used as templates for manual module creation

## Maintenance

- Old modules can be archived or deleted
- Consider implementing auto-cleanup after X days
- Review generated modules for quality
