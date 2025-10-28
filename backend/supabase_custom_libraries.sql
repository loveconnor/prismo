-- Custom Libraries Table for Supabase
-- Run this in your Supabase SQL Editor

-- Create custom_libraries table
CREATE TABLE IF NOT EXISTS custom_libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('java', 'python', 'javascript', 'cpp')),
    file_size BIGINT NOT NULL,
    file_data TEXT NOT NULL, -- Base64 encoded file content
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_libraries_user_id ON custom_libraries(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_libraries_language ON custom_libraries(language);
CREATE INDEX IF NOT EXISTS idx_custom_libraries_enabled ON custom_libraries(enabled);

-- Enable Row Level Security
ALTER TABLE custom_libraries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own libraries
CREATE POLICY "Users can view their own libraries"
    ON custom_libraries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own libraries
CREATE POLICY "Users can upload their own libraries"
    ON custom_libraries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own libraries
CREATE POLICY "Users can update their own libraries"
    ON custom_libraries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own libraries
CREATE POLICY "Users can delete their own libraries"
    ON custom_libraries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_custom_libraries_updated_at
    BEFORE UPDATE ON custom_libraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (if needed)
GRANT ALL ON custom_libraries TO authenticated;
GRANT ALL ON custom_libraries TO service_role;

COMMENT ON TABLE custom_libraries IS 'Stores custom library files (JAR, Python packages, etc.) for code execution';
COMMENT ON COLUMN custom_libraries.file_data IS 'Binary content of the library file';
COMMENT ON COLUMN custom_libraries.stored_filename IS 'UUID-based filename for storage';
COMMENT ON COLUMN custom_libraries.filename IS 'Original filename as uploaded by user';
