-- =====================================================
-- Prismo Backend - Complete Supabase Schema
-- PostgreSQL Database Schema for Supabase
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- Core Tables
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    profile JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Labs table
CREATE TABLE IF NOT EXISTS labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lab_type TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    estimated_time INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Widgets table
CREATE TABLE IF NOT EXISTS widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    widget_type TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    module_type TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'started',
    progress DECIMAL(5,2) DEFAULT 0.0 CHECK (progress >= 0 AND progress <= 100),
    score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
    feedback JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mastery table
CREATE TABLE IF NOT EXISTS mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_tag TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'beginner',
    progress DECIMAL(5,2) DEFAULT 0.0 CHECK (progress >= 0 AND progress <= 100),
    last_practiced TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_tag)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
    feedback_text TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    time_spent INTEGER DEFAULT 0,
    attempts_taken INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Module Sessions table
CREATE TABLE IF NOT EXISTS module_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'started',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0,
    progress DECIMAL(5,4) DEFAULT 0.0 CHECK (progress >= 0 AND progress <= 1.0),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 1,
    interactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Analytics Tables
-- =====================================================

-- Widget Selection Analytics
CREATE TABLE IF NOT EXISTS widget_selection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Feedback Generated Analytics
CREATE TABLE IF NOT EXISTS feedback_generated (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
    feedback_type TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Learning Sessions
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    activities JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Skill Progress
CREATE TABLE IF NOT EXISTS skill_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_tag TEXT NOT NULL,
    progress_snapshot JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Content Tables
-- =====================================================

-- Skill Tags
CREATE TABLE IF NOT EXISTS skill_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name TEXT UNIQUE NOT NULL,
    category TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Difficulty Levels
CREATE TABLE IF NOT EXISTS difficulty_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_name TEXT UNIQUE NOT NULL,
    level_value INTEGER UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Paths
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    path_data JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Educator Content
CREATE TABLE IF NOT EXISTS educator_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    educator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Advanced Feature Tables
-- =====================================================

-- Lab Templates
CREATE TABLE IF NOT EXISTS lab_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    template_data JSONB DEFAULT '{}'::jsonb,
    is_system BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Widget Registry
CREATE TABLE IF NOT EXISTS widget_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_name TEXT UNIQUE NOT NULL,
    widget_type TEXT NOT NULL,
    schema JSONB DEFAULT '{}'::jsonb,
    version TEXT DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lab Steps
CREATE TABLE IF NOT EXISTS lab_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    instruction TEXT,
    expected_output TEXT,
    hints JSONB DEFAULT '[]'::jsonb,
    widgets JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lab_id, step_number)
);

-- Hints
CREATE TABLE IF NOT EXISTS hints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID,
    content_type TEXT NOT NULL,
    hint_level INTEGER DEFAULT 1,
    hint_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences (extended)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT true,
    accessibility_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Streaks
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Version History
CREATE TABLE IF NOT EXISTS version_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    content_snapshot JSONB DEFAULT '{}'::jsonb,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach Chat
CREATE TABLE IF NOT EXISTS coach_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    message_role TEXT NOT NULL,
    message_content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Walkthrough Sessions
CREATE TABLE IF NOT EXISTS walkthrough_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress JSONB DEFAULT '{}'::jsonb
);

-- Micro Assessments
CREATE TABLE IF NOT EXISTS micro_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_tag TEXT NOT NULL,
    assessment_data JSONB DEFAULT '{}'::jsonb,
    score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sandbox Sessions
CREATE TABLE IF NOT EXISTS sandbox_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    code TEXT,
    output TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Review Sessions
CREATE TABLE IF NOT EXISTS review_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    review_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accessibility Settings
CREATE TABLE IF NOT EXISTS accessibility_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    font_size INTEGER DEFAULT 16,
    high_contrast BOOLEAN DEFAULT false,
    screen_reader BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Usage
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Error Logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL,
    error_message TEXT,
    stack_trace TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Config
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Indexes
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Labs indexes
CREATE INDEX IF NOT EXISTS idx_labs_user_id ON labs(user_id);
CREATE INDEX IF NOT EXISTS idx_labs_is_public ON labs(is_public);
CREATE INDEX IF NOT EXISTS idx_labs_lab_type ON labs(lab_type);
CREATE INDEX IF NOT EXISTS idx_labs_tags ON labs USING GIN(tags);

-- Widgets indexes
CREATE INDEX IF NOT EXISTS idx_widgets_user_id ON widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_is_public ON widgets(is_public);
CREATE INDEX IF NOT EXISTS idx_widgets_widget_type ON widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_widgets_tags ON widgets USING GIN(tags);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public);

-- Modules indexes
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_is_public ON modules(is_public);
CREATE INDEX IF NOT EXISTS idx_modules_module_type ON modules(module_type);

-- Attempts indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_lab_id ON attempts(lab_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status);

-- Mastery indexes
CREATE INDEX IF NOT EXISTS idx_mastery_user_id ON mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_skill_tag ON mastery(skill_tag);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_widget_id ON feedback(widget_id);

-- Module Sessions indexes
CREATE INDEX IF NOT EXISTS idx_module_sessions_user_id ON module_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_sessions_module_id ON module_sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_sessions_status ON module_sessions(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_widget_selection_user_id ON widget_selection(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_generated_user_id ON feedback_generated(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_user_id ON skill_progress(user_id);

-- Notifications index
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Coach chat index
CREATE INDEX IF NOT EXISTS idx_coach_chat_user_id ON coach_chat(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_chat_session_id ON coach_chat(session_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_labs_name_trgm ON labs USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_widgets_name_trgm ON widgets USING GIN(name gin_trgm_ops);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labs_updated_at BEFORE UPDATE ON labs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attempts_updated_at BEFORE UPDATE ON attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mastery_updated_at BEFORE UPDATE ON mastery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_sessions_updated_at BEFORE UPDATE ON module_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_educator_content_updated_at BEFORE UPDATE ON educator_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_templates_updated_at BEFORE UPDATE ON lab_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_settings_updated_at BEFORE UPDATE ON accessibility_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkthrough_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Labs policies
CREATE POLICY "Users can view their own labs" ON labs
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view public labs" ON labs
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create labs" ON labs
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own labs" ON labs
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own labs" ON labs
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Widgets policies
CREATE POLICY "Users can view their own widgets" ON widgets
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view public widgets" ON widgets
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create widgets" ON widgets
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own widgets" ON widgets
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own widgets" ON widgets
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Collections policies
CREATE POLICY "Users can view their own collections" ON collections
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view public collections" ON collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own collections" ON collections
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own collections" ON collections
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Modules policies
CREATE POLICY "Users can view their own modules" ON modules
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view public modules" ON modules
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create modules" ON modules
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own modules" ON modules
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own modules" ON modules
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Attempts policies
CREATE POLICY "Users can view their own attempts" ON attempts
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create attempts" ON attempts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own attempts" ON attempts
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Mastery policies
CREATE POLICY "Users can view their own mastery" ON mastery
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create mastery records" ON mastery
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own mastery" ON mastery
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Feedback policies
CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create feedback" ON feedback
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Module Sessions policies
CREATE POLICY "Users can view their own module sessions" ON module_sessions
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create module sessions" ON module_sessions
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own module sessions" ON module_sessions
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- User-specific data policies (similar pattern for other tables)
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view their own streaks" ON streaks
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view their own badges" ON badges
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own coach chat" ON coach_chat
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own analytics" ON widget_selection
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own feedback analytics" ON feedback_generated
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own learning sessions" ON learning_sessions
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view their own skill progress" ON skill_progress
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own walkthroughs" ON walkthrough_sessions
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own assessments" ON micro_assessments
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own sandbox sessions" ON sandbox_sessions
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own review sessions" ON review_sessions
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own accessibility settings" ON accessibility_settings
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Public read policies for reference tables
ALTER TABLE skill_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view skill tags" ON skill_tags FOR SELECT USING (true);

ALTER TABLE difficulty_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view difficulty levels" ON difficulty_levels FOR SELECT USING (true);

ALTER TABLE widget_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view widget registry" ON widget_registry FOR SELECT USING (true);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public learning paths" ON learning_paths
    FOR SELECT USING (is_public = true);

ALTER TABLE lab_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view system templates" ON lab_templates
    FOR SELECT USING (is_system = true);

-- =====================================================
-- Initial Data
-- =====================================================

-- Insert default difficulty levels
INSERT INTO difficulty_levels (level_name, level_value, description) VALUES
    ('Beginner', 1, 'Suitable for absolute beginners'),
    ('Elementary', 2, 'Basic understanding required'),
    ('Intermediate', 3, 'Moderate experience needed'),
    ('Advanced', 4, 'Strong understanding required'),
    ('Expert', 5, 'Expert-level knowledge required')
ON CONFLICT (level_name) DO NOTHING;

-- Insert default system config
INSERT INTO system_config (config_key, config_value, description) VALUES
    ('ai_provider', '{"default": "gemini", "options": ["claude", "gemini"]}', 'AI provider configuration'),
    ('max_attempts_per_lab', '{"value": 10}', 'Maximum attempts allowed per lab'),
    ('session_timeout', '{"value": 3600}', 'Session timeout in seconds')
ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- Views
-- =====================================================

-- View for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT l.id) as total_labs,
    COUNT(DISTINCT w.id) as total_widgets,
    COUNT(DISTINCT a.id) as total_attempts,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_attempts,
    AVG(CASE WHEN a.score IS NOT NULL THEN a.score END) as average_score,
    s.current_streak,
    s.longest_streak
FROM users u
LEFT JOIN labs l ON u.id = l.user_id
LEFT JOIN widgets w ON u.id = w.user_id
LEFT JOIN attempts a ON u.id = a.user_id
LEFT JOIN streaks s ON u.id = s.user_id
GROUP BY u.id, u.username, u.email, s.current_streak, s.longest_streak;

-- View for popular labs
CREATE OR REPLACE VIEW popular_labs AS
SELECT 
    l.id,
    l.name,
    l.lab_type,
    l.difficulty,
    l.is_public,
    COUNT(a.id) as attempt_count,
    AVG(a.score) as average_score,
    COUNT(DISTINCT a.user_id) as unique_users
FROM labs l
LEFT JOIN attempts a ON l.id = a.lab_id
WHERE l.is_public = true
GROUP BY l.id, l.name, l.lab_type, l.difficulty, l.is_public
ORDER BY attempt_count DESC;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE labs IS 'Learning labs created by users or system';
COMMENT ON TABLE widgets IS 'Interactive widgets for labs';
COMMENT ON TABLE collections IS 'User-created collections of labs and widgets';
COMMENT ON TABLE modules IS 'Learning modules';
COMMENT ON TABLE attempts IS 'User attempts at completing labs';
COMMENT ON TABLE mastery IS 'User skill mastery tracking';
COMMENT ON TABLE feedback IS 'User feedback on widgets';
COMMENT ON TABLE module_sessions IS 'Tracking of module completion sessions';
