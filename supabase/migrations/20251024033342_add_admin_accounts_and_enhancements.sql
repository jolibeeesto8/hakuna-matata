/*
  # Add Admin Accounts and Platform Enhancements

  ## Overview
  This migration adds admin accounts, notifications system, phone numbers, 
  payment methods, and enhances the platform features.

  ## New Tables
  
  ### 1. notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text) - type of notification
  - `title` (text)
  - `message` (text)
  - `read` (boolean)
  - `reference_type` (text)
  - `reference_id` (uuid)
  - `created_at` (timestamptz)
  
  ### 2. payment_transactions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text) - 'deposit' or 'withdraw'
  - `method` (text) - 'mpesa', 'binance', 'paypal', 'airtm'
  - `amount` (decimal)
  - `status` (text) - 'pending', 'completed', 'failed'
  - `transaction_ref` (text)
  - `created_at` (timestamptz)
  
  ## Modifications
  - Add phone_number to profiles
  - Add average_rating to profiles
  - Add total_ratings to profiles
  - Update job_bids to include accepted_seller_id
  
  ## Security
  - Enable RLS on new tables
  - Create appropriate policies
*/

-- Add new columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN average_rating decimal(3,2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_ratings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_ratings integer DEFAULT 0;
  END IF;
END $$;

-- Add accepted_seller_id to job_postings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_postings' AND column_name = 'accepted_seller_id'
  ) THEN
    ALTER TABLE job_postings ADD COLUMN accepted_seller_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('bid_won', 'bid_lost', 'transaction', 'message', 'system', 'rating')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  reference_type text CHECK (reference_type IN ('job', 'transaction', 'chat', 'rating', 'general')),
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  method text NOT NULL CHECK (method IN ('mpesa', 'binance', 'paypal', 'airtm')),
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_ref text,
  phone_number text,
  wallet_address text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payment transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Insert admin accounts (will be handled via Supabase Auth API)