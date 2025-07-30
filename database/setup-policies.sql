-- Step 3: Add RLS policies (run AFTER tables are created)
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
    
    IF profile_id IS NULL THEN
        SELECT id INTO profile_id FROM profiles WHERE user_id = clerk_user_id;
    END IF;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;