-- Add upload_id column to exports table
-- Run this in your Supabase SQL Editor

-- Add the column (allowing NULL for existing records)
ALTER TABLE exports 
ADD COLUMN IF NOT EXISTS upload_id UUID NULL;

-- Add foreign key constraint to link exports to uploads
ALTER TABLE exports 
ADD CONSTRAINT fk_exports_upload_id 
FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_exports_upload_id ON exports(upload_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exports' 
AND column_name = 'upload_id';