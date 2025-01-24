/*
  # Update company_name field in user_profiles

  1. Changes
    - Add comment to company_name field to clarify format
    - Add constraint to ensure proper format
  
  2. Security
    - No security changes needed
*/

-- Add comment to company_name field
COMMENT ON COLUMN user_profiles.company_name IS 'Format: "Nombre de la Empresa / Nombre"';

-- Add check constraint to ensure proper format
ALTER TABLE user_profiles
ADD CONSTRAINT company_name_format CHECK (
  company_name IS NULL OR 
  company_name ~ '^.+\s*/\s*.+$'
);