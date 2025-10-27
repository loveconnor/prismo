# 🎯 QUICK START: Just Run This SQL!

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in / Create account
3. Click "New Project"
4. Fill in:
   - Name: `prismo` (or anything you like)
   - Database Password: (save this!)
   - Region: (choose closest to you)
5. Wait ~2 minutes for provisioning

## Step 2: Run the SQL

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `backend/supabase_schema.sql` in your editor
4. Copy ALL 867 lines
5. Paste into Supabase SQL Editor
6. Click **Run** (or press `Ctrl/Cmd + Enter`)

✅ Should see: "Success. No rows returned"

This creates:
- ✅ 35+ tables
- ✅ All indexes
- ✅ Row Level Security
- ✅ Auto-updating triggers
- ✅ Analytics views
- ✅ Initial data

## Step 3: Get Your Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. You'll see:
   - Project URL
   - anon/public key
   - service_role key

3. Copy these to `backend/.env`:

```bash
# Copy template first
cp backend/.env.template backend/.env

# Then edit backend/.env:
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Get AI API Key (Choose One)

### Option A: Gemini (Google) - FREE & Easy ⭐ Recommended

1. Go to https://ai.google.dev/
2. Click "Get API Key in Google AI Studio"
3. Click "Create API Key"
4. Copy key

Add to `backend/.env`:
```bash
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

### Option B: Claude (Anthropic) - More Powerful

1. Go to https://console.anthropic.com/
2. Sign up / Sign in
3. Go to API Keys
4. Create key
5. Copy key

Add to `backend/.env`:
```bash
DEFAULT_AI_PROVIDER=claude
ANTHROPIC_API_KEY=your_key_here
```

## Step 5: Install & Run

```bash
cd backend

# Install dependencies
pip install supabase requests
# OR
uv pip install supabase requests

# Test connection
python3 -c "from app.supabase_config import supabase_config; supabase_config.test_connection()"

# Run server
python3 main.py
```

## ✅ Done!

Server should start on http://localhost:5000

Test it:
```bash
# Check health
curl http://localhost:5000/health

# Check AI
curl http://localhost:5000/api/ai/health

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","username":"test"}'
```

---

## 🎯 The SQL You Need

**File: `backend/supabase_schema.sql`**

This ONE file creates your ENTIRE database:

```sql
-- 867 lines of SQL that creates:

✅ Core Tables:
   - users (with profile, preferences)
   - labs (learning labs with difficulty, tags)
   - widgets (interactive components)
   - collections (grouped content)
   - modules (structured learning)
   - attempts (progress tracking)
   - mastery (skill tracking)
   - feedback (user feedback)
   - module_sessions (session tracking)

✅ Analytics:
   - widget_selection
   - feedback_generated
   - learning_sessions
   - skill_progress

✅ Content Management:
   - skill_tags
   - difficulty_levels
   - learning_paths
   - educator_content

✅ Advanced Features:
   - lab_templates
   - widget_registry
   - lab_steps, hints
   - notifications, streaks, badges
   - coach_chat (AI conversations)
   - walkthrough_sessions
   - micro_assessments
   - sandbox_sessions
   - review_sessions
   - accessibility_settings
   - api_usage tracking
   - error_logs
   - system_config

✅ Security:
   - Row Level Security on ALL tables
   - User-specific access policies
   - Public content sharing
   - Automatic data isolation

✅ Performance:
   - Optimized indexes everywhere
   - Full-text search (pg_trgm)
   - JSONB for flexible data
   - Array types for tags

✅ Automation:
   - Auto-updating timestamps
   - UUID generation
   - Cascade deletes

✅ Built-in Analytics:
   - user_statistics view
   - popular_labs view

✅ Initial Data:
   - 5 difficulty levels
   - System configuration
   - AI provider settings
```

---

## 📋 Your Complete .env File

```bash
# Flask
SECRET_KEY=your-secret-key-change-this
PORT=5000
FLASK_ENV=development

# Supabase (Get from dashboard → Settings → API)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Provider (Choose one or both)
DEFAULT_AI_PROVIDER=gemini

# Gemini (Get from https://ai.google.dev/)
GEMINI_API_KEY=AIzaSy...

# OR Claude (Get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: OAuth
OAUTH_CALLBACK_URL=http://localhost:4200/auth/callback
GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 🔍 Verify Everything Works

### 1. Database Connection
```bash
python3 -c "
from app.supabase_config import supabase_config
print('✅ Database connected!' if supabase_config.test_connection() else '❌ Connection failed')
"
```

### 2. Check Tables
In Supabase Dashboard → Table Editor, you should see:
- users
- labs
- widgets
- collections
- modules
- attempts
- mastery
- feedback
- module_sessions
- ... and 25+ more!

### 3. Test API

```bash
# Health check
curl http://localhost:5000/health

# AI health
curl http://localhost:5000/api/ai/health

# Should return:
{
  "status": "healthy",
  "providers": {
    "gemini": {"available": true, "configured": true}
  }
}
```

### 4. Test Auth

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "username": "testuser"
  }'

# Should return:
{
  "success": true,
  "user_id": "uuid-here",
  "email": "test@example.com",
  "session": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here"
  }
}
```

### 5. Check User in Database

In Supabase Dashboard → Table Editor → users:
- You should see your test user!
- With email, username, profile, etc.

---

## 🎉 That's It!

You now have:
- ✅ Complete PostgreSQL database
- ✅ Supabase Auth system
- ✅ AI provider (Gemini or Claude)
- ✅ 35+ tables with full security
- ✅ Analytics and tracking
- ✅ All features ready to use

## 🚀 Next Steps

1. **Update Frontend**: Point to new API endpoints
2. **Test Features**: Try creating labs, widgets, etc.
3. **Customize**: Modify schema as needed
4. **Deploy**: Deploy to production when ready

## 📚 Full Documentation

- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Database Docs**: `SUPABASE_README.md`
- **Quick Summary**: `MIGRATION_SUMMARY.md`
- **SQL Schema**: `supabase_schema.sql`

## 💡 Pro Tips

1. **Free Tier Limits**:
   - Supabase: 500MB database, 2GB bandwidth/month
   - Gemini: 60 requests/minute free tier

2. **Security**:
   - Never commit `.env` to git
   - Keep service_role_key secret
   - RLS protects your data automatically

3. **Performance**:
   - All tables are indexed
   - Use the provided views for analytics
   - JSONB is fast for flexible data

4. **Monitoring**:
   - Check Supabase dashboard for metrics
   - Monitor `/health` endpoint
   - Set up alerts in Supabase

---

## ❓ Need Help?

1. Check logs: `python3 main.py` (watch for errors)
2. Test connection: Use the verification commands above
3. Review docs: `MIGRATION_GUIDE.md` has detailed troubleshooting
4. Supabase docs: https://supabase.com/docs

Happy coding! 🚀
