/*
  # Add email field to user profile

  1. Changes
    - Add email field to user_profiles table
    - Add trigger to automatically populate email from auth.users
  
  2. Security
    - No security changes needed, using existing RLS policies
*/

-- Add email field to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email text;

-- Update trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles with email
UPDATE user_profiles
SET email = users.email
FROM auth.users
WHERE user_profiles.id = users.id
AND user_profiles.email IS NULL;