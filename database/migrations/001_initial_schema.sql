-- LayerText Initial Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create credits table for user credit balance tracking
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- Clerk User ID
    credits INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table for tracking Stripe payment transactions
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk User ID
    stripe_payment_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents, must be positive
    credits_granted INTEGER NOT NULL CHECK (credits_granted >= 0), -- Credits granted, cannot be negative
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'refunded')), -- Valid status values
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    credit_grant_id TEXT NOT NULL UNIQUE -- Idempotency field
);

-- Create uploads table for tracking image uploads and FAL processing
CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk User ID
    image_url TEXT NOT NULL CHECK (image_url != ''), -- Image URL cannot be empty
    fal_output_url TEXT, -- Foreground-only image from FAL API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
    credit_used BOOLEAN NOT NULL DEFAULT false
);

-- Create exports table for tracking final exported images with text overlays
CREATE TABLE IF NOT EXISTS public.exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk User ID
    export_url TEXT NOT NULL CHECK (export_url != ''), -- Export URL cannot be empty
    text_content TEXT NOT NULL CHECK (text_content != ''), -- Text content cannot be empty
    font_size INTEGER NOT NULL CHECK (font_size > 0 AND font_size <= 200), -- Reasonable font size limits
    font_color TEXT NOT NULL CHECK (font_color ~ '^#[0-9A-Fa-f]{6}$'), -- Must be valid hex color code
    shadow TEXT, -- Shadow style information (JSON or serialized string)
    position_x REAL NOT NULL CHECK (position_x >= 0.0 AND position_x <= 1.0), -- Must be valid percentage
    position_y REAL NOT NULL CHECK (position_y >= 0.0 AND position_y <= 1.0), -- Must be valid percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON public.payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_credit_grant_id ON public.payments(credit_grant_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON public.exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON public.exports(created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for credits table
CREATE POLICY "Users can view their own credits" ON public.credits
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own credits" ON public.credits
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "System can insert credits" ON public.credits
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for payments table
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "System can insert payments" ON public.payments
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for uploads table
CREATE POLICY "Users can view their own uploads" ON public.uploads
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own uploads" ON public.uploads
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own uploads" ON public.uploads
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Create RLS policies for exports table
CREATE POLICY "Users can view their own exports" ON public.exports
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own exports" ON public.exports
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on credits table
CREATE TRIGGER update_credits_updated_at 
    BEFORE UPDATE ON public.credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize user credits
CREATE OR REPLACE FUNCTION initialize_user_credits(clerk_user_id TEXT)
RETURNS UUID AS $$
DECLARE
    credit_record_id UUID;
BEGIN
    INSERT INTO public.credits (user_id, credits)
    VALUES (clerk_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO credit_record_id;
    
    -- If no record was inserted (conflict), get the existing record
    IF credit_record_id IS NULL THEN
        SELECT id INTO credit_record_id 
        FROM public.credits 
        WHERE user_id = clerk_user_id;
    END IF;
    
    RETURN credit_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely deduct credits (atomic operation)
CREATE OR REPLACE FUNCTION deduct_user_credits(clerk_user_id TEXT, amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
    success BOOLEAN := false;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO current_credits
    FROM public.credits
    WHERE user_id = clerk_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF current_credits >= amount THEN
        UPDATE public.credits
        SET credits = credits - amount
        WHERE user_id = clerk_user_id;
        success := true;
    END IF;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add credits (for payments)
CREATE OR REPLACE FUNCTION add_user_credits(clerk_user_id TEXT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.credits (user_id, credits)
    VALUES (clerk_user_id, amount)
    ON CONFLICT (user_id) 
    DO UPDATE SET credits = credits + amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;