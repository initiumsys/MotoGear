/*
  # Add billing address to user profiles

  1. Changes
    - Add billing_address column to user_profiles table as JSONB
    - Add validation check for required billing address fields
    - Add comment explaining the structure
*/

-- Add billing_address column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS billing_address jsonb;

-- Add check constraint to ensure required fields
ALTER TABLE user_profiles
ADD CONSTRAINT valid_billing_address CHECK (
  billing_address IS NULL OR (
    billing_address ? 'address_line1' AND
    billing_address ? 'city' AND
    billing_address ? 'state' AND
    billing_address ? 'postal_code' AND
    billing_address ? 'country'
  )
);

-- Add comment explaining the structure
COMMENT ON COLUMN user_profiles.billing_address IS 'Billing address structure: {
  address_line1: string (required),
  address_line2: string (optional),
  city: string (required),
  state: string (required),
  postal_code: string (required),
  country: string (required)
}';