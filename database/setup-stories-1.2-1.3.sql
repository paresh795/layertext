-- Database setup for Stories 1.2 & 1.3
-- Run these commands in your Supabase SQL Editor

-- Create profiles table for credit management
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- Clerk user ID
    credits INTEGER DEFAULT 10 NOT NULL, -- Start with 10 free credits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exports table for PNG exports
CREATE TABLE IF NOT EXISTS exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL, -- Link to original upload
    export_url TEXT NOT NULL, -- URL to exported PNG in Supabase Storage
    text_content TEXT NOT NULL, -- The text that was overlaid
    font_size INTEGER NOT NULL, -- Font size in pixels
    font_color TEXT NOT NULL, -- Hex color code
    shadow TEXT, -- Shadow blur value (e.g., "6px")
    position_x FLOAT NOT NULL, -- Horizontal position as percentage (0-100)
    position_y FLOAT NOT NULL, -- Vertical position as percentage (0-100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Add RLS policies for exports table
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports" ON exports
FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own exports" ON exports
FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_upload_id ON exports(upload_id);

-- Function to initialize user profile with credits
CREATE OR REPLACE FUNCTION initialize_user_profile(clerk_user_id TEXT)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    INSERT INTO profiles (user_id, credits)
    VALUES (clerk_user_id, 10)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO profile_id;
    
    -- If no insert happened (user exists), get existing profile ID
    IF profile_id IS NULL THEN
        SELECT id INTO profile_id FROM profiles WHERE user_id = clerk_user_id;
    END IF;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;