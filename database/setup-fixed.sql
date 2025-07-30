-- Step 1: Create tables first
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    credits INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    upload_id UUID NULL,
    export_url TEXT NOT NULL,
    text_content TEXT NOT NULL,
    font_size INTEGER NOT NULL,
    font_color TEXT NOT NULL,
    shadow TEXT,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add foreign key constraint AFTER both tables exist
ALTER TABLE exports 
ADD CONSTRAINT fk_exports_upload_id 
FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE SET NULL;