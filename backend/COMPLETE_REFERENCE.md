# 📋 Complete Migration Reference

## 🎯 What You Have

I've migrated your entire Prismo backend from AWS to Supabase with Gemini AI support. Here's everything that was created:

---

## 📦 New Files Created

### 1. Database & Configuration
| File | Lines | Description |
|------|-------|-------------|
| `supabase_schema.sql` | 832 | Complete PostgreSQL schema - **THIS IS WHAT YOU NEED TO RUN** |
| `app/supabase_config.py` | 86 | Supabase client configuration |
| `app/orm_supabase.py` | 643 | PostgreSQL ORM (replaces DynamoDB ORM) |
| `app/auth_service_supabase.py` | 297 | Supabase Auth (replaces Cognito) |

### 2. AI Support
| File | Lines | Description |
|------|-------|-------------|
| `app/ai_routes.py` | 774 | Unified AI routes (Claude + Gemini) |

### 3. Documentation
| File | Purpose |
|------|---------|
| `QUICK_START.md` | 5-minute setup guide |
| `MIGRATION_SUMMARY.md` | Complete feature overview |
| `MIGRATION_GUIDE.md` | Detailed migration instructions |
| `SUPABASE_README.md` | Database schema documentation |
| `.env.template` | Environment variable template |

### 4. Updated Files
| File | Changes |
|------|---------|
| `config.py` | Supabase config, AI provider settings |
| `pyproject.toml` | Replaced boto3 with supabase |
| `app/__init__.py` | Registered ai_bp instead of claude_bp |
| `app/models.py` | Now uses orm_supabase |

---

## 🗄️ The SQL Schema (832 Lines)

**File: `backend/supabase_schema.sql`**

### Core Tables (11)
```sql
1. users              - User profiles (email, username, profile, preferences)
2. labs               - Learning labs (name, type, content, difficulty, tags)
3. widgets            - Interactive widgets (type, config, version)
4. collections        - Content collections (items, tags)
5. modules            - Learning modules (content, type, tags)
6. attempts           - Lab attempts (status, progress, score, feedback)
7. mastery            - Skill mastery (skill_tag, level, progress)
8. feedback           - User feedback (rating, time_spent, attempts)
9. module_sessions    - Session tracking (progress, time_spent, interactions)
```

### Analytics Tables (4)
```sql
10. widget_selection  - Widget selection tracking
11. feedback_generated - AI feedback tracking
12. learning_sessions  - Learning session analytics
13. skill_progress     - Skill development tracking
```

### Content Management (4)
```sql
14. skill_tags        - Skill taxonomy
15. difficulty_levels - Difficulty definitions (1-5)
16. learning_paths    - Curated learning paths
17. educator_content  - Educator materials
```

### Advanced Features (20)
```sql
18. lab_templates      - Reusable lab templates
19. widget_registry    - Widget type registry
20. lab_steps          - Step-by-step instructions
21. hints              - Progressive hint system
22. user_preferences   - Extended preferences
23. notifications      - User notifications
24. streaks            - Learning streak tracking
25. badges             - Achievement badges
26. version_history    - Content versioning
27. coach_chat         - AI coach conversations
28. walkthrough_sessions - Guided walkthroughs
29. micro_assessments  - Quick skill checks
30. sandbox_sessions   - Code sandbox tracking
31. review_sessions    - Review session tracking
32. accessibility_settings - Accessibility options
33. api_usage          - API usage tracking
34. error_logs         - Error logging
35. system_config      - System configuration
```

### Built-In Features
```sql
✅ Row Level Security (RLS) on all tables
✅ Automatic timestamp updates (triggers)
✅ UUID primary keys (uuid_generate_v4())
✅ Foreign key constraints with CASCADE
✅ Optimized indexes (btree, gin, trgm)
✅ JSONB for flexible data
✅ Array types for tags
✅ Views: user_statistics, popular_labs
✅ Initial data: difficulty levels, system config
```

---

## 🔐 Row Level Security Examples

### Users Table
```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);
```

### Labs Table
```sql
-- Users can view their own labs
CREATE POLICY "Users can view their own labs" ON labs
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
    );

-- Anyone can view public labs
CREATE POLICY "Users can view public labs" ON labs
    FOR SELECT USING (is_public = true);

-- Users can create labs
CREATE POLICY "Users can create labs" ON labs
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
    );
```

**What This Means:**
- ✅ Database automatically filters data by user
- ✅ No need to add WHERE user_id = X in queries
- ✅ Impossible for users to access others' data
- ✅ Public content is safely shared

---

## 🤖 AI Provider Configuration

### Option 1: Gemini (Google) - FREE ⭐

**Get API Key:**
1. Visit https://ai.google.dev/
2. Click "Get API Key in Google AI Studio"
3. Create API key
4. Copy key

**Configure:**
```bash
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
```

**Features:**
- ✅ Free tier: 60 requests/minute
- ✅ Fast responses
- ✅ Model: gemini-1.5-flash
- ✅ Good for code review, chat, grading

### Option 2: Claude (Anthropic)

**Get API Key:**
1. Visit https://console.anthropic.com/
2. Sign up / Login
3. Create API key
4. Copy key

**Configure:**
```bash
DEFAULT_AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

**Features:**
- ✅ More powerful reasoning
- ✅ Better code understanding
- ✅ Model: claude-3-haiku-20240307
- ✅ Pay-per-use pricing

### Use Both!
```bash
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-claude-key
```

Then specify per request:
```json
{
  "message": "Review my code",
  "provider": "claude"  // or "gemini"
}
```

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Supabase Project
```
1. Go to https://supabase.com
2. Create new project
3. Name: "prismo"
4. Choose region
5. Set password
```

### Step 2: Run SQL
```
1. Open SQL Editor in Supabase
2. Copy ALL of supabase_schema.sql
3. Paste and Run
4. Should see: "Success. No rows returned"
```

### Step 3: Get Credentials
```
Supabase Dashboard → Settings → API:
- Copy Project URL
- Copy anon/public key
- Copy service_role key
```

### Step 4: Configure Environment
```bash
cp backend/.env.template backend/.env

# Edit backend/.env:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
GEMINI_API_KEY=AIza...
```

### Step 5: Install & Run
```bash
cd backend
pip install supabase requests
python3 main.py
```

---

## 📡 New API Endpoints

### AI Routes (New!)
```
GET  /api/ai/health           # Check AI status
POST /api/ai/chat             # Chat with AI (Gemini or Claude)
POST /api/ai/review-code      # Get code review
POST /api/ai/grade-code       # Grade student code
POST /api/ai/execute-code     # Execute code safely
```

### Auth Routes (Updated)
```
POST /api/auth/register       # Register user (Supabase Auth)
POST /api/auth/login          # Login (returns JWT)
POST /api/auth/logout         # Logout
POST /api/auth/refresh        # Refresh session
POST /api/auth/verify         # Verify email with OTP
POST /api/auth/resend         # Resend verification
POST /api/auth/forgot-password # Password reset
```

---

## 🧪 Testing

### Test Database Connection
```bash
python3 -c "
from app.supabase_config import supabase_config
print('✅ Connected' if supabase_config.test_connection() else '❌ Failed')
"
```

### Test AI Provider
```bash
curl http://localhost:5000/api/ai/health

# Expected:
{
  "status": "healthy",
  "providers": {
    "gemini": {"available": true, "configured": true}
  }
}
```

### Register Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "username": "testuser"
  }'

# Expected:
{
  "success": true,
  "user_id": "uuid",
  "session": {"access_token": "...", "refresh_token": "..."}
}
```

### Test AI Chat
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello AI!",
    "provider": "gemini"
  }'

# Expected:
{
  "success": true,
  "response": "Hello! How can I help you?",
  "provider": "gemini"
}
```

---

## 📊 Environment Variables

### Required
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### AI Provider (at least one)
```bash
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional
```bash
SECRET_KEY=your-secret-key
PORT=5000
FLASK_ENV=development
OAUTH_CALLBACK_URL=http://localhost:4200/auth/callback
GOOGLE_CLIENT_ID=xxx
```

---

## 🔄 What Changed

### Removed ❌
- boto3 (AWS SDK)
- DynamoDB
- AWS Cognito
- AWS Bedrock
- app/aws_config.py
- app/orm.py (old DynamoDB ORM)
- app/auth_service.py (old Cognito)
- /api/claude/* endpoints

### Added ✅
- supabase-py
- PostgreSQL database
- Supabase Auth
- Gemini AI support
- Direct Claude API support
- app/supabase_config.py
- app/orm_supabase.py
- app/auth_service_supabase.py
- app/ai_routes.py
- /api/ai/* endpoints

---

## 📖 Documentation

1. **QUICK_START.md** - Get running in 5 minutes
2. **MIGRATION_SUMMARY.md** - Complete feature overview
3. **MIGRATION_GUIDE.md** - Detailed migration guide
4. **SUPABASE_README.md** - Database documentation
5. **This file** - Complete reference

---

## ✅ Final Checklist

Setup:
- [ ] Supabase project created
- [ ] SQL schema executed (supabase_schema.sql)
- [ ] .env file configured
- [ ] Dependencies installed (supabase, requests)
- [ ] AI API key added (Gemini or Claude)

Testing:
- [ ] Database connection works
- [ ] Server starts without errors
- [ ] /health endpoint responds
- [ ] /api/ai/health shows provider available
- [ ] Can register a user
- [ ] Can login
- [ ] Can chat with AI

---

## 🎉 Summary

You now have a complete, modern backend with:

✅ **Database**: PostgreSQL (832 lines of SQL)
   - 35+ tables with full relationships
   - Row Level Security on everything
   - Optimized indexes
   - Auto-updating timestamps

✅ **Authentication**: Supabase Auth
   - Email/password
   - JWT tokens
   - Email verification
   - Password reset

✅ **AI**: Gemini + Claude support
   - Chat
   - Code review
   - Code grading
   - Code execution

✅ **Security**: Built-in RLS
   - Users can only access their data
   - Public content safely shared
   - Database enforces security

✅ **Performance**: Fully indexed
   - Fast queries
   - JSONB for flexibility
   - Pre-computed views

**One SQL file runs everything. It's that simple.** 🚀

Questions? Check the documentation files above!
