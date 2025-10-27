# Prismo Supabase SQL Schema

## Overview

This SQL file contains the complete database schema for the Prismo learning platform using Supabase (PostgreSQL).

## Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization and fill in project details
4. Wait for project to be provisioned

### 2. Run the Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" or press `Ctrl/Cmd + Enter`

The schema will create:
- ✅ All tables with proper types and constraints
- ✅ Indexes for optimal query performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp update triggers
- ✅ Helper views for analytics
- ✅ Initial reference data

### 3. Get Your Credentials

After running the schema, get your credentials:

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

3. Add these to your `backend/.env` file:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Database Structure

### Core Tables (11 tables)

| Table | Description | Key Features |
|-------|-------------|--------------|
| `users` | User profiles | Extends Supabase auth.users, RLS enabled |
| `labs` | Learning labs | Public/private visibility, tags, difficulty |
| `widgets` | Interactive widgets | Configurable, versioned, public sharing |
| `collections` | User collections | Group labs and widgets |
| `modules` | Learning modules | Structured learning content |
| `attempts` | Lab attempts | Progress tracking, scores, feedback |
| `mastery` | Skill tracking | User skill levels and progress |
| `feedback` | User feedback | Widget feedback and ratings |
| `module_sessions` | Session tracking | Time spent, interactions, completion |

### Analytics Tables (4 tables)

Track user behavior and learning patterns:
- `widget_selection` - Which widgets users choose
- `feedback_generated` - AI-generated feedback tracking
- `learning_sessions` - Learning session analytics
- `skill_progress` - Skill development over time

### Content Tables (4 tables)

Reference data and educator content:
- `skill_tags` - Standardized skill taxonomy
- `difficulty_levels` - Difficulty level definitions
- `learning_paths` - Curated learning sequences
- `educator_content` - Educator-created materials

### Advanced Features (20+ tables)

Additional features for enhanced functionality:
- `lab_templates` - Reusable lab templates
- `widget_registry` - Widget type registry
- `lab_steps` - Step-by-step lab instructions
- `hints` - Progressive hint system
- `notifications` - User notifications
- `streaks` - Learning streak tracking
- `badges` - Achievement system
- `coach_chat` - AI coach conversations
- And more...

## Security Features

### Row Level Security (RLS)

All user-specific tables have RLS enabled with policies that:

1. **Users can only access their own data**
   ```sql
   auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
   ```

2. **Public content is accessible to all**
   ```sql
   is_public = true
   ```

3. **System/reference data is readable by all**
   ```sql
   -- Applies to skill_tags, difficulty_levels, etc.
   ```

### Example: Labs Table Policies

```sql
-- Users can view their own labs
CREATE POLICY "Users can view their own labs" ON labs
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Users can view public labs
CREATE POLICY "Users can view public labs" ON labs
    FOR SELECT USING (is_public = true);

-- Users can create labs
CREATE POLICY "Users can create labs" ON labs
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));
```

## Automatic Features

### Auto-updating Timestamps

All tables with `updated_at` columns have triggers that automatically update the timestamp:

```sql
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### UUID Generation

All tables use UUIDs for primary keys, automatically generated:

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

### JSONB for Flexible Data

Complex structured data uses JSONB for performance and flexibility:

```sql
profile JSONB DEFAULT '{}'::jsonb
content JSONB DEFAULT '{}'::jsonb
interactions JSONB DEFAULT '[]'::jsonb
```

## Indexes

Optimized indexes for common queries:

### User Data Access
```sql
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Content Queries
```sql
CREATE INDEX idx_labs_user_id ON labs(user_id);
CREATE INDEX idx_labs_is_public ON labs(is_public);
CREATE INDEX idx_labs_tags ON labs USING GIN(tags);
```

### Full-Text Search
```sql
CREATE INDEX idx_labs_name_trgm ON labs USING GIN(name gin_trgm_ops);
```

## Views

### user_statistics

Pre-computed user statistics:

```sql
SELECT * FROM user_statistics WHERE user_id = 'xxx';
```

Returns:
- Total labs created
- Total widgets created
- Total attempts
- Completed attempts
- Average score
- Current streak
- Longest streak

### popular_labs

Find trending labs:

```sql
SELECT * FROM popular_labs LIMIT 10;
```

Returns:
- Lab details
- Attempt count
- Average score
- Unique users

## Initial Data

The schema includes initial reference data:

### Difficulty Levels
- Beginner (1)
- Elementary (2)
- Intermediate (3)
- Advanced (4)
- Expert (5)

### System Config
- AI provider settings
- Max attempts per lab
- Session timeout

## Maintenance

### Viewing Table Structure

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- View table structure
\d+ table_name
```

### Checking Indexes

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### RLS Policy Status

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Common Queries

### Get User with Stats

```sql
SELECT u.*, us.*
FROM users u
LEFT JOIN user_statistics us ON u.id = us.user_id
WHERE u.email = 'user@example.com';
```

### Get User's Labs with Attempt Counts

```sql
SELECT l.*, COUNT(a.id) as attempt_count, AVG(a.score) as avg_score
FROM labs l
LEFT JOIN attempts a ON l.id = a.lab_id
WHERE l.user_id = 'xxx'
GROUP BY l.id
ORDER BY l.created_at DESC;
```

### Get Learning Path Progress

```sql
SELECT m.*, ms.progress, ms.status
FROM modules m
LEFT JOIN module_sessions ms ON m.id = ms.module_id AND ms.user_id = 'xxx'
WHERE m.is_public = true OR m.user_id = 'xxx'
ORDER BY m.created_at DESC;
```

## Backup and Recovery

### Export Schema

```bash
pg_dump -U postgres -d your_db -s > schema_backup.sql
```

### Export Data

```bash
pg_dump -U postgres -d your_db -a > data_backup.sql
```

### Restore

```bash
psql -U postgres -d your_db < backup.sql
```

## Troubleshooting

### RLS Blocking Queries?

Test with RLS disabled:

```sql
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
-- Run your query
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Performance Issues?

Check query execution plan:

```sql
EXPLAIN ANALYZE
SELECT * FROM labs WHERE user_id = 'xxx';
```

### Missing Indexes?

Find slow queries and add indexes:

```sql
-- Enable query logging in Supabase dashboard
-- Then check slow query log
```

## Migration from DynamoDB

If migrating from DynamoDB:

1. Export DynamoDB data to JSON
2. Transform data format (UUID keys, timestamp format)
3. Use COPY or INSERT statements to load data
4. Verify foreign key relationships
5. Test RLS policies with real users

## Next Steps

After setting up the schema:

1. ✅ Test connection: `supabase_config.test_connection()`
2. ✅ Create test user via Supabase Auth
3. ✅ Insert test data
4. ✅ Verify RLS policies work correctly
5. ✅ Set up backups
6. ✅ Configure monitoring

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Discord](https://discord.supabase.com/)
