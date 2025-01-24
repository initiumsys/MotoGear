-- Add payment mode to user profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS payment_mode text CHECK (payment_mode IN ('prepaid', 'postpaid')) DEFAULT 'prepaid';

COMMENT ON COLUMN user_profiles.payment_mode IS 'Payment mode: prepaid (default) or postpaid';