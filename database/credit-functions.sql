-- SQL functions for credit management
-- Run this in your Supabase SQL Editor

-- Function to safely increment credits
CREATE OR REPLACE FUNCTION increment_credits(amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN amount;
END;
$$ LANGUAGE plpgsql;

-- Function to safely decrement credits (atomic)
CREATE OR REPLACE FUNCTION decrement_user_credits(user_id_param TEXT, amount INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
    current_credits INTEGER;
    new_credits INTEGER;
BEGIN
    -- Lock the row and get current credits
    SELECT credits INTO current_credits 
    FROM profiles 
    WHERE user_id = user_id_param 
    FOR UPDATE;
    
    -- Check if user exists
    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Check if sufficient credits
    IF current_credits < amount THEN
        RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', amount, current_credits;
    END IF;
    
    -- Deduct credits
    new_credits := current_credits - amount;
    
    UPDATE profiles 
    SET credits = new_credits,
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;