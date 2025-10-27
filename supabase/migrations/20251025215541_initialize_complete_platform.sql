/*
  # Complete Platform Initialization with Advanced Features

  ## Overview
  Complete marketplace platform with bidding system, wallet management, escrow, and community features.

  ## Tables Created
  1. profiles - User profiles with roles and ratings
  2. wallets - User wallet system with multiple balance types
  3. wallet_transactions - Complete audit trail of wallet activities
  4. digital_assets - Digital products marketplace
  5. products - Physical/digital products
  6. job_postings - Freelance job marketplace with bid limits
  7. job_bids - Bids on jobs with work submission
  8. escrow_transactions - Escrow with dispute and work submission
  9. notifications - Real-time notifications
  10. chat_conversations - Multi-party chat
  11. chat_messages - Chat messages
  12. ratings - Rating system
  13. payment_transactions - Deposits/withdrawals with admin approval
  14. community_posts - Community forum posts
  15. community_comments - Forum comments
  16. community_likes - Post likes
  17. courses, lessons, exams - Educational content

  ## Security
  - All tables have RLS enabled
  - Comprehensive policies for data access
  - Admin-only operations where needed
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
DROP POLICY IF EXISTS "Anyone can read profiles for public info" ON profiles;

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

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'freeze', 'unfreeze', 'pending_to_available')),
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  balance_type text NOT NULL CHECK (balance_type IN ('available', 'pending', 'freezed')),
  reference_type text CHECK (reference_type IN ('deposit', 'withdraw', 'job_post', 'job_award', 'job_completion', 'purchase', 'sale', 'refund', 'commission')),
  reference_id uuid,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create wallet transactions"
  ON wallet_transactions FOR INSERT
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

-- Create escrow_transactions table (needed before job_postings)
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id),
  reference_type text NOT NULL CHECK (reference_type IN ('product', 'asset', 'job')),
  reference_id uuid NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  commission decimal(10,2) NOT NULL CHECK (commission >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'refunded', 'cancelled')),
  work_submitted boolean DEFAULT false,
  work_submission_url text,
  work_submitted_at timestamptz,
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

-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  budget decimal(10,2) NOT NULL CHECK (budget >= 0),
  category text NOT NULL,
  max_bids integer DEFAULT 10,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  accepted_seller_id uuid REFERENCES profiles(id),
  escrow_transaction_id uuid REFERENCES escrow_transactions(id),
  work_submission_url text,
  work_submitted_at timestamptz,
  work_approved boolean DEFAULT false,
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
  USING (buyer_id = auth.uid() OR accepted_seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR accepted_seller_id = auth.uid());

-- Create job_bids table
CREATE TABLE IF NOT EXISTS job_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_postings(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bid_amount decimal(10,2) NOT NULL CHECK (bid_amount >= 0),
  proposal text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, seller_id)
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
  admin_id uuid REFERENCES profiles(id),
  admin_notes text,
  processed_at timestamptz,
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

-- Create community tables
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create community posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own community posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own community posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community comments"
  ON community_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create community comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own community comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community likes"
  ON community_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create community likes"
  ON community_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own community likes"
  ON community_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

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

-- Create all indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_type, reference_id);
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
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON community_likes(user_id);

-- Functions and triggers
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

DROP TRIGGER IF EXISTS trigger_update_user_rating ON ratings;
CREATE TRIGGER trigger_update_user_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

CREATE OR REPLACE FUNCTION update_community_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'community_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE community_posts 
      SET comments_count = comments_count + 1 
      WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE community_posts 
      SET comments_count = GREATEST(0, comments_count - 1) 
      WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE community_posts 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE community_posts 
      SET likes_count = GREATEST(0, likes_count - 1) 
      WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_comments_count ON community_comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_community_post_stats();

DROP TRIGGER IF EXISTS trigger_update_likes_count ON community_likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_community_post_stats();
