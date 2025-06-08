/*
  # Add onboarding fields to profiles table
  
  1. Changes
    - Add onboarding_completed boolean column to profiles table
    - Add role and primary_intention columns to profiles table
    - These columns track user preferences and onboarding status
  
  2. Security
    - No changes to RLS policies
*/

-- Add onboarding fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS primary_intention TEXT;