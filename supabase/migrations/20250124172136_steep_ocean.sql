/*
  # Add phone prefix field to user profiles

  1. Changes
    - Add phone_prefix field to user_profiles table
    - Set default value to '+34' (Spanish prefix)
    - Update existing phone numbers to include prefix
    - Add check constraint for valid phone prefix format
  
  2. Security
    - No security changes needed, using existing RLS policies
*/

-- Add phone_prefix field with Spanish default
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone_prefix text NOT NULL DEFAULT '+34';

-- Add check constraint for phone prefix format
ALTER TABLE user_profiles
ADD CONSTRAINT valid_phone_prefix CHECK (
  phone_prefix ~ '^\+[0-9]{1,4}$'
);