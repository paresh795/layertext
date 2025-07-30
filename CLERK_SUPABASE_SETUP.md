# 🔧 Clerk-Supabase JWT Setup Guide

## Critical Setup Required

The upload system needs Clerk to generate Supabase-compatible JWT tokens. Follow these steps:

## Step 1: Create Supabase JWT Template in Clerk

1. **Go to Clerk Dashboard** → Your App → **JWT Templates**
2. **Click "New Template"**
3. **Select "Supabase" from the list**
4. **Template Name**: `supabase`
5. **Claims**:
   ```json
   {
     "aud": "authenticated",
     "exp": "{{exp}}",
     "iat": "{{iat}}",
     "iss": "{{iss}}",
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address.email_address}}",
     "phone": "{{user.primary_phone_number.phone_number}}",
     "app_metadata": {
       "provider": "clerk",
       "providers": ["clerk"]
     },
     "user_metadata": {
       "email": "{{user.primary_email_address.email_address}}",
       "email_verified": "{{user.primary_email_address.verification.status == 'verified'}}",
       "phone_verified": "{{user.primary_phone_number.verification.status == 'verified'}}",
       "sub": "{{user.id}}"
     },
     "role": "authenticated"
   }
   ```
6. **Save the template**

## Step 2: Update RLS Policies (Simplified)

Run this in your Supabase SQL Editor:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;

-- Create new simplified policies
CREATE POLICY "Authenticated users can upload to own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access to images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');
```

## Step 3: Test Authentication

After setup, test at `/test-upload` - you should see:
- No "row-level security policy" errors
- Files uploading successfully
- Proper user_id in database records

## Troubleshooting

If you still get RLS errors:
1. Check JWT template is named exactly `supabase`
2. Verify the `sub` claim uses `{{user.id}}`
3. Ensure bucket is named `images`
4. Check RLS policies target `authenticated` role