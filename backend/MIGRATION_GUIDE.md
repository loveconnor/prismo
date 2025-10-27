# Prismo Migration Guide: AWS to Supabase + Gemini API

## Overview

This guide documents the complete migration from AWS services (DynamoDB, Cognito, Bedrock) to Supabase (PostgreSQL + Auth) with added support for Gemini API as an alternative to Claude.

## Major Changes

### 1. Database Migration: DynamoDB → Supabase PostgreSQL

**What Changed:**
- Replaced AWS DynamoDB with Supabase PostgreSQL
- All tables now use relational database schema with proper foreign keys
- Added Row Level Security (RLS) policies for data protection
- Implemented proper indexes for query optimization

**Files Modified:**
- Created: `backend/supabase_schema.sql` - Complete database schema
- Created: `backend/app/supabase_config.py` - Supabase client configuration
- Created: `backend/app/orm_supabase.py` - New ORM for PostgreSQL
- Modified: `backend/app/models.py` - Now uses new ORM (backward compatible)

**Migration Steps:**

1. **Set up Supabase Project:**
   ```bash
   # Go to https://supabase.com and create a new project
   # Get your project URL and keys from Settings > API
   ```

2. **Run the SQL Schema:**
   ```bash
   # In Supabase Dashboard, go to SQL Editor
   # Copy and paste the entire content of backend/supabase_schema.sql
   # Execute the SQL
   ```

3. **Update Environment Variables:**
   ```bash
   # Copy template
   cp backend/.env.template backend/.env
   
   # Edit .env and add:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 2. Authentication Migration: AWS Cognito → Supabase Auth

**What Changed:**
- Replaced AWS Cognito with Supabase Auth
- Users now authenticated via Supabase Auth with email/password
- Session management handled by Supabase JWT tokens
- Row Level Security automatically enforces user data access

**Files Modified:**
- Created: `backend/app/auth_service_supabase.py` - New auth service
- Modified: `backend/app/auth_routes.py` - Uses new auth service

**Key API Changes:**

**Old (Cognito):**
```python
from app.auth_service import CognitoAuthService
auth_service = CognitoAuthService()
```

**New (Supabase):**
```python
from app.auth_service_supabase import SupabaseAuthService
auth_service = SupabaseAuthService()
```

**Registration Response Format:**
```python
# Old
{
    "success": True,
    "user_sub": "cognito-user-id",
    "confirmation_required": True
}

# New
{
    "success": True,
    "user_id": "supabase-user-id",
    "confirmation_required": True,
    "session": {
        "access_token": "jwt-token",
        "refresh_token": "refresh-token"
    }
}
```

### 3. AI Provider: Added Gemini API Support

**What Changed:**
- New unified AI routes that support both Claude and Gemini
- Configurable default AI provider
- All AI features work with either provider

**Files Created:**
- `backend/app/ai_routes.py` - New unified AI routes

**Configuration:**
```bash
# In .env file:
DEFAULT_AI_PROVIDER=gemini  # or "claude"
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-claude-api-key
```

**API Changes:**

**Old endpoint:**
```
POST /api/claude/chat
```

**New endpoint (works with both providers):**
```
POST /api/ai/chat
Body: {
    "message": "Hello",
    "provider": "gemini"  # or "claude" (optional, uses default if not specified)
}
```

**All AI Endpoints:**
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/review-code` - Code review
- `POST /api/ai/grade-code` - Grade code
- `POST /api/ai/execute-code` - Execute code
- `GET /api/ai/health` - Check AI service status

### 4. ORM Changes

**What Changed:**
- Switched from DynamoDB-specific ORM to PostgreSQL ORM
- Query syntax updated to use PostgreSQL features
- Better support for joins and complex queries

**Old ORM Usage (DynamoDB):**
```python
from app.orm import orm

# Scan with filter expression
result = orm.users.scan(
    filter_expression='email = :email',
    expression_values={':email': 'user@example.com'}
)
```

**New ORM Usage (Supabase/PostgreSQL):**
```python
from app.orm_supabase import orm

# Query with filters
result = orm.users.query(
    filters={'email': 'user@example.com'}
)

# Or use get_by_key for single record
user = orm.users.get_by_key({'email': 'user@example.com'})
```

### 5. Environment Variables

**Removed (AWS):**
```bash
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID
COGNITO_CLIENT_SECRET
DYNAMODB_TABLE_PREFIX
```

**Added (Supabase):**
```bash
SUPABASE_URL
SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**Added (AI):**
```bash
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY
ANTHROPIC_API_KEY
```

### 6. Dependencies

**Removed:**
```
boto3>=1.40.59
```

**Added:**
```
supabase>=2.0.0
```

**Install new dependencies:**
```bash
cd backend
pip install supabase requests
```

Or with uv:
```bash
cd backend
uv pip install supabase requests
```

## Database Schema

The new PostgreSQL schema includes:

### Core Tables:
- `users` - User profiles (extends Supabase auth.users)
- `labs` - Learning labs
- `widgets` - Interactive widgets
- `collections` - User collections
- `modules` - Learning modules
- `attempts` - Lab attempts
- `mastery` - Skill mastery tracking
- `feedback` - User feedback
- `module_sessions` - Module session tracking

### Analytics Tables:
- `widget_selection`
- `feedback_generated`
- `learning_sessions`
- `skill_progress`

### Advanced Features:
- `lab_templates`
- `widget_registry`
- `lab_steps`
- `hints`
- `notifications`
- `streaks`
- `badges`
- `coach_chat`
- And many more...

### Features:
- **Foreign Keys**: Proper relational integrity
- **Indexes**: Optimized query performance
- **RLS Policies**: Row-level security
- **Triggers**: Auto-update timestamps
- **Views**: Pre-computed statistics

## Migration Checklist

- [ ] Create Supabase project
- [ ] Run `supabase_schema.sql` in Supabase SQL Editor
- [ ] Copy `.env.template` to `.env`
- [ ] Add Supabase credentials to `.env`
- [ ] Add AI API keys to `.env` (at least one: GEMINI_API_KEY or ANTHROPIC_API_KEY)
- [ ] Install new dependencies: `pip install supabase requests`
- [ ] Update import statements in route files
- [ ] Test authentication flow
- [ ] Test database operations
- [ ] Test AI features
- [ ] Migrate existing data (if any)

## Testing the Migration

### 1. Test Database Connection:
```bash
cd backend
python3 -c "from app.supabase_config import supabase_config; supabase_config.test_connection()"
```

### 2. Test AI Providers:
```bash
curl -X GET http://localhost:5000/api/ai/health
```

### 3. Test Authentication:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 4. Start the Server:
```bash
cd backend
python3 main.py
```

## Backward Compatibility

The following files maintain backward compatibility:
- `backend/app/models.py` - Still provides the same API, now using new ORM under the hood

## Breaking Changes

### API Changes:
1. Authentication responses include Supabase session tokens instead of Cognito tokens
2. User IDs are now UUIDs instead of Cognito user IDs
3. AI endpoints moved from `/api/claude/*` to `/api/ai/*`

### Database Changes:
1. All tables now use UUID primary keys
2. Timestamps use ISO 8601 format with timezone
3. JSONB fields replace DynamoDB's native maps
4. Arrays use PostgreSQL native array type

## Rollback Plan

If you need to rollback:

1. Restore old environment variables (AWS credentials)
2. Restore `backend/app/__init__.py` to use `claude_bp` instead of `ai_bp`
3. Update route files to import from `app.aws_config` instead of `app.supabase_config`
4. Reinstall boto3: `pip install boto3`

## Support

For issues or questions about the migration:
1. Check the SQL schema comments in `supabase_schema.sql`
2. Review the new ORM documentation in `backend/app/orm_supabase.py`
3. Test endpoints using the `/health` endpoint
4. Review Supabase documentation: https://supabase.com/docs

## Next Steps

After migration:
1. Update frontend to use new API response formats
2. Implement data migration scripts if moving from existing AWS deployment
3. Set up Supabase backups and monitoring
4. Configure Supabase Auth email templates
5. Test Row Level Security policies thoroughly
6. Set up Supabase Edge Functions for advanced features (optional)
