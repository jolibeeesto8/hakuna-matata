/*
  # Advanced Features and Admin Controls

  ## Overview
  Adds advanced bidding, work submission, dispute resolution, and admin management features.

  ## Enhancements

  ### Profiles
  - suspended_until: Temporary suspension timestamp
  - suspension_reason: Reason for suspension
  - last_active: Track user activity

  ### Job Bids
  - delivery_time: Estimated delivery days
  - seller_comment: Detailed proposal text
  - seller_rating: Seller's rating at bid time

  ### Escrow Transactions  
  - chat_enabled: Enable/disable chat
  - work_text: Written work submissions
  - work_images: Image URLs array
  - revision_count: Number of revisions
  - buyer_feedback: Revision request notes
  - admin_assigned_id: Admin handling disputes

  ### Job Postings
  - work_text: Written work submissions
  - work_images: Image URLs array
  - revision_requested: Flag for revision requests
  - buyer_feedback: Revision notes

  ### Digital Assets
  - is_gmail_account: Flag for Gmail account products
  - gmail_details: JSON with account details

  ## New Tables

  ### gmail_accounts
  - Admin-managed Gmail accounts for sale
  - Direct purchases without escrow
  - Track sold accounts

  ### admin_actions
  - Audit log for all admin actions
  - Track bans, suspensions, dispute resolutions
  - Complete accountability

  ### dispute_resolutions
  - Detailed dispute tracking
  - Evidence and outcome management
  - Admin assignment and resolution

  ### work_revisions
  - Track all work submission revisions
  - Buyer feedback for each revision
  - Status tracking (pending, approved, rejected)

  ### purchases
  - Track all platform purchases
  - Support multiple purchase types
  - Link to escrow when needed

  ## Security
  - Admin-only policies for sensitive operations
  - RLS on all new tables
  - Audit trails maintained
*/

-- Extend profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- Extend job_bids table
ALTER TABLE job_bids ADD COLUMN IF NOT EXISTS delivery_time integer;
ALTER TABLE job_bids ADD COLUMN IF NOT EXISTS seller_comment text;
ALTER TABLE job_bids ADD COLUMN IF NOT EXISTS seller_rating decimal(3,2);

-- Extend escrow_transactions table
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS chat_enabled boolean DEFAULT true;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS work_text text;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS work_images text[];
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS revision_count integer DEFAULT 0;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS buyer_feedback text;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS admin_assigned_id uuid REFERENCES profiles(id);

-- Extend job_postings table
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS work_text text;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS work_images text[];
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS revision_requested boolean DEFAULT false;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS buyer_feedback text;

-- Extend digital_assets table
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS is_gmail_account boolean DEFAULT false;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS gmail_details jsonb;

-- Create gmail_accounts table
CREATE TABLE IF NOT EXISTS gmail_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  recovery_email text,
  phone_number text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_by_admin_id uuid REFERENCES profiles(id) NOT NULL,
  sold_to_user_id uuid REFERENCES profiles(id),
  sold_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gmail accounts"
  ON gmail_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read available gmail accounts"
  ON gmail_accounts FOR SELECT
  TO authenticated
  USING (status = 'available' OR sold_to_user_id = auth.uid());

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  action_type text NOT NULL CHECK (action_type IN (
    'user_ban', 'user_unban', 'user_suspend', 
    'dispute_resolved', 'transaction_modified', 
    'content_removed', 'refund_issued',
    'gmail_account_created', 'gmail_account_sold',
    'balance_adjusted', 'user_verified'
  )),
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_reference_type text CHECK (target_reference_type IN ('transaction', 'job', 'product', 'asset', 'gmail_account')),
  target_reference_id uuid,
  reason text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all admin actions"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create admin actions"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) AND admin_id = auth.uid()
  );

-- Create dispute_resolutions table
CREATE TABLE IF NOT EXISTS dispute_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid REFERENCES escrow_transactions(id) ON DELETE CASCADE NOT NULL,
  filed_by_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  assigned_admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  dispute_reason text NOT NULL,
  dispute_details text,
  evidence_urls text[],
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution_outcome text CHECK (resolution_outcome IN ('buyer_favor', 'seller_favor', 'partial_refund', 'no_action')),
  resolution_notes text,
  refund_amount decimal(10,2) CHECK (refund_amount >= 0),
  filed_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

ALTER TABLE dispute_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read own disputes"
  ON dispute_resolutions FOR SELECT
  TO authenticated
  USING (
    filed_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM escrow_transactions
      WHERE escrow_transactions.id = dispute_resolutions.escrow_transaction_id
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create disputes"
  ON dispute_resolutions FOR INSERT
  TO authenticated
  WITH CHECK (
    filed_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM escrow_transactions
      WHERE escrow_transactions.id = dispute_resolutions.escrow_transaction_id
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can update disputes"
  ON dispute_resolutions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create work_revisions table
CREATE TABLE IF NOT EXISTS work_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job_postings(id) ON DELETE CASCADE NOT NULL,
  escrow_id uuid REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  revision_number integer NOT NULL,
  work_text text,
  work_images text[],
  work_url text,
  buyer_feedback text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'revision_requested', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE work_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read revisions"
  ON work_revisions FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Sellers can create revisions"
  ON work_revisions FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Participants can update revisions"
  ON work_revisions FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() OR buyer_id = auth.uid())
  WITH CHECK (seller_id = auth.uid() OR buyer_id = auth.uid());

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  purchase_type text NOT NULL CHECK (purchase_type IN ('product', 'asset', 'gmail_account')),
  reference_id uuid NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  escrow_transaction_id uuid REFERENCES escrow_transactions(id),
  requires_escrow boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_status ON gmail_accounts(status);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_sold_to ON gmail_accounts(sold_to_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispute_resolutions_escrow_id ON dispute_resolutions(escrow_transaction_id);
CREATE INDEX IF NOT EXISTS idx_dispute_resolutions_status ON dispute_resolutions(status);
CREATE INDEX IF NOT EXISTS idx_dispute_resolutions_assigned_admin ON dispute_resolutions(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_work_revisions_job_id ON work_revisions(job_id);
CREATE INDEX IF NOT EXISTS idx_work_revisions_escrow_id ON work_revisions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_work_revisions_seller_id ON work_revisions(seller_id);
CREATE INDEX IF NOT EXISTS idx_work_revisions_buyer_id ON work_revisions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_job_bids_status ON job_bids(status);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_id ON purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_escrow_admin_assigned ON escrow_transactions(admin_assigned_id);

-- Admin policies for full control
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all escrow transactions"
  ON escrow_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any escrow transaction"
  ON escrow_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Helper function to check balance
CREATE OR REPLACE FUNCTION check_user_balance(
  p_user_id uuid,
  p_required_amount decimal
)
RETURNS boolean AS $$
DECLARE
  v_available_balance decimal;
BEGIN
  SELECT available_balance INTO v_available_balance
  FROM wallets
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_available_balance, 0) >= p_required_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record seller rating on bid
CREATE OR REPLACE FUNCTION set_bid_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  NEW.seller_rating := (
    SELECT average_rating
    FROM profiles
    WHERE id = NEW.seller_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_bid_seller_rating ON job_bids;
CREATE TRIGGER trigger_set_bid_seller_rating
  BEFORE INSERT ON job_bids
  FOR EACH ROW
  EXECUTE FUNCTION set_bid_seller_rating();