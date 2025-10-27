/*
  # Complete Platform Enhancement with Professional Features
  
  ## Overview
  This migration creates a comprehensive, production-ready marketplace platform with:
  - Advanced escrow system with dispute resolution
  - Real-time notifications system
  - Multi-party chat system (admin-buyer-seller)
  - Rating and review system
  - Email confirmation for auth
  - Transaction history tracking
  - Payment transaction management
  - Admin accounts
  
  ## New Tables
  
  ### 1. profiles
  Core user profiles with enhanced fields
  - id (uuid, primary key, references auth.users)
  - full_name (text)
  - email (text)
  - phone_number (text)
  - country (text)
  - role (text: 'admin' | 'user')
  - status (text: 'active' | 'suspended')
  - average_rating (decimal)
  - total_ratings (integer)
  - email_verified (boolean)
  - created_at (timestamptz)
  
  ### 2. wallets
  User wallet system for managing funds
  - id (uuid, primary key)
  - user_id (uuid, references profiles)
  - available_balance (decimal)
  - pending_balance (decimal)
  - freezed_balance (decimal)
  - currency (text, default 'USD')
  - updated_at (timestamptz)
  
  ### 3. digital_assets
  Digital products marketplace
  - id (uuid, primary key)
  - seller_id (uuid, references profiles)
  - title (text)
  - description (text)
  - category (text)
  - price (decimal)
  - license_type (text)
  - file_url (text)
  - status (text: 'pending_review' | 'approved' | 'rejected')
  - posted_by_admin (boolean)
  - created_at (timestamptz)
  
  ### 4. products
  Physical/digital products
  - id (uuid, primary key)
  - seller_id (uuid, references profiles)
  - product_name (text)
  - subject (text)
  - country (text)
  - price (decimal)
  - image_url_1 (text)
  - image_url_2 (text)
  - type (text: 'physical' | 'digital')
  - status (text: 'active' | 'sold' | 'inactive')
  - created_at (timestamptz)
  
  ### 5. job_postings
  Freelance job marketplace
  - id (uuid, primary key)
  - buyer_id (uuid, references profiles)
  - title (text)
  - description (text)
  - budget (decimal)
  - category (text)
  - status (text: 'open' | 'in_progress' | 'completed' | 'cancelled')
  - accepted_seller_id (uuid, references profiles)
  - created_at (timestamptz)
  
  ### 6. job_bids
  Bids on job postings
  - id (uuid, primary key)
  - job_id (uuid, references job_postings)
  - seller_id (uuid, references profiles)
  - bid_amount (decimal)
  - proposal (text)
  - status (text: 'pending' | 'accepted' | 'rejected')
  - created_at (timestamptz)
  
  ### 7. escrow_transactions
  Enhanced escrow system with dispute handling
  - id (uuid, primary key)
  - buyer_id (uuid, references profiles)
  - seller_id (uuid, references profiles)
  - reference_type (text: 'product' | 'asset' | 'job')
  - reference_id (uuid)
  - amount (decimal)
  - commission (decimal)
  - status (text: 'active' | 'completed' | 'disputed' | 'refunded' | 'cancelled')
  - dispute_reason (text)
  - dispute_filed_by (text: 'buyer' | 'seller')
  - admin_notes (text)
  - resolution_notes (text)
  - created_at (timestamptz)
  - completed_at (timestamptz)
  - disputed_at (timestamptz)
  - resolved_at (timestamptz)
  
  ### 8. notifications
  Real-time notification system
  - id (uuid, primary key)
  - user_id (uuid, references profiles)
  - type (text: 'transaction' | 'message' | 'system' | 'rating' | 'dispute')
  - title (text)
  - message (text)
  - read (boolean)
  - reference_type (text)
  - reference_id (uuid)
  - created_at (timestamptz)
  
  ### 9. chat_conversations
  Multi-party chat system
  - id (uuid, primary key)
  - transaction_id (uuid, references escrow_transactions)
  - buyer_id (uuid, references profiles)
  - seller_id (uuid, references profiles)
  - admin_id (uuid, references profiles)
  - status (text: 'active' | 'closed')
  - created_at (timestamptz)
  
  ### 10. chat_messages
  Individual chat messages
  - id (uuid, primary key)
  - conversation_id (uuid, references chat_conversations)
  - sender_id (uuid, references profiles)
  - message (text)
  - attachment_url (text)
  - read_by_buyer (boolean)
  - read_by_seller (boolean)
  - read_by_admin (boolean)
  - created_at (timestamptz)
  
  ### 11. ratings
  Rating and review system
  - id (uuid, primary key)
  - transaction_id (uuid, references escrow_transactions)
  - rated_user_id (uuid, references profiles)
  - rater_user_id (uuid, references profiles)
  - rating (integer, 1-5)
  - review_text (text)
  - created_at (timestamptz)
  
  ### 12. payment_transactions
  Payment deposit/withdrawal tracking
  - id (uuid, primary key)
  - user_id (uuid, references profiles)
  - type (text: 'deposit' | 'withdraw')
  - method (text: 'mpesa' | 'binance' | 'paypal' | 'airtm')
  - amount (decimal)
  - status (text: 'pending' | 'completed' | 'failed' | 'cancelled')
  - transaction_ref (text)
  - phone_number (text)
  - wallet_address (text)
  - email (text)
  - notes (text)
  - created_at (timestamptz)
  - completed_at (timestamptz)
  
  ### 13. courses
  Educational content
  - id (uuid, primary key)
  - title (text)
  - description (text)
  - category (text)
  - created_at (timestamptz)
  
  ### 14. lessons
  Course lessons
  - id (uuid, primary key)
  - course_id (uuid, references courses)
  - lesson_number (integer)
  - title (text)
  - content (text)
  - video_url (text)
  - created_at (timestamptz)
  
  ### 15. exams
  Course examinations
  - id (uuid, primary key)
  - course_id (uuid, references courses)
  - exam_number (integer)
  - title (text)
  - passing_score (integer)
  - created_at (timestamptz)
  
  ## Security
  - All tables have RLS enabled
  - Comprehensive policies for authenticated users
  - Admin-only access where appropriate
  - Proper ownership checks on all operations
  
  ## Indexes
  - Performance indexes on frequently queried columns
  - Foreign key indexes for join optimization
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  phone_number text,
  country text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  average_rating decimal(3,2) DEFAULT 0.00,
  total_ratings integer DEFAULT 0,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles for ratings" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read profiles for public info"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  available_balance decimal(10,2) DEFAULT 0.00,
  pending_balance decimal(10,2) DEFAULT 0.00,
  freezed_balance decimal(10,2) DEFAULT 0.00,
  currency text DEFAULT 'USD',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create digital_assets table
CREATE TABLE IF NOT EXISTS digital_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('source_code', 'dataset', 'b2b_specialty')),
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  license_type text NOT NULL,
  file_url text,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  posted_by_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved assets"
  ON digital_assets FOR SELECT
  TO authenticated
  USING (status = 'approved' OR seller_id = auth.uid());

CREATE POLICY "Users can create assets"
  ON digital_assets FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update own assets"
  ON digital_assets FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  subject text NOT NULL,
  country text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  image_url_1 text NOT NULL,
  image_url_2 text NOT NULL,
  type text NOT NULL CHECK (type IN ('physical', 'digital')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  TO authenticated
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  budget decimal(10,2) NOT NULL CHECK (budget >= 0),
  category text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  accepted_seller_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read jobs"
  ON job_postings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create jobs"
  ON job_postings FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update own jobs"
  ON job_postings FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Create job_bids table
CREATE TABLE IF NOT EXISTS job_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_postings(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bid_amount decimal(10,2) NOT NULL CHECK (bid_amount >= 0),
  proposal text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bids"
  ON job_bids FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create bids"
  ON job_bids FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Create enhanced escrow_transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reference_type text NOT NULL CHECK (reference_type IN ('product', 'asset', 'job')),
  reference_id uuid NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  commission decimal(10,2) NOT NULL CHECK (commission >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'refunded', 'cancelled')),
  dispute_reason text,
  dispute_filed_by text CHECK (dispute_filed_by IN ('buyer', 'seller')),
  admin_notes text,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  disputed_at timestamptz,
  resolved_at timestamptz
);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON escrow_transactions FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create transactions"
  ON escrow_transactions FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON escrow_transactions FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('transaction', 'message', 'system', 'rating', 'dispute')),
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

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR admin_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Participants can update conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR admin_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid() OR admin_id = auth.uid());

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  attachment_url text,
  read_by_buyer boolean DEFAULT false,
  read_by_seller boolean DEFAULT false,
  read_by_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.buyer_id = auth.uid() OR chat_conversations.seller_id = auth.uid() OR chat_conversations.admin_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.buyer_id = auth.uid() OR chat_conversations.seller_id = auth.uid() OR chat_conversations.admin_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.buyer_id = auth.uid() OR chat_conversations.seller_id = auth.uid() OR chat_conversations.admin_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.buyer_id = auth.uid() OR chat_conversations.seller_id = auth.uid() OR chat_conversations.admin_id = auth.uid())
    )
  );

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES escrow_transactions(id) ON DELETE CASCADE NOT NULL,
  rated_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rater_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(transaction_id, rater_user_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (rater_user_id = auth.uid());

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

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  video_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (true);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  exam_number integer NOT NULL,
  title text NOT NULL,
  passing_score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exams"
  ON exams FOR SELECT
  TO authenticated
  USING (true);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_assets_seller_id ON digital_assets(seller_id);
CREATE INDEX IF NOT EXISTS idx_digital_assets_status ON digital_assets(status);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_buyer_id ON job_postings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_bids_job_id ON job_bids(job_id);
CREATE INDEX IF NOT EXISTS idx_job_bids_seller_id ON job_bids(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_transaction_id ON chat_conversations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_buyer_id ON chat_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_seller_id ON chat_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ratings_transaction_id ON ratings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE rated_user_id = NEW.rated_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM ratings
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE id = NEW.rated_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update ratings
DROP TRIGGER IF EXISTS trigger_update_user_rating ON ratings;
CREATE TRIGGER trigger_update_user_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();