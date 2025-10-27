/*
  # Add Work Revisions and Enhanced Bid Management

  ## Overview
  This migration adds support for work revisions, image uploads in work submissions,
  and better tracking of bid proposals and seller ratings.

  ## Changes

  ### 1. Job Bids Enhancements
  - Add delivery_time field for seller's estimated delivery
  - Add seller_comment field for detailed proposal
  
  ### 2. Work Revisions Table (New)
  - Track revision requests and resubmissions
  - Support text and image submissions
  - Link to jobs and escrow transactions
  
  ### 3. Escrow Enhancements
  - Add revision_count to track number of revisions
  - Add buyer_feedback for revision requests
  - Add images support in work submissions

  ## Security
  - All tables have RLS enabled
  - Proper participant access controls
*/

-- Add fields to job_bids
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_bids' AND column_name = 'delivery_time'
  ) THEN
    ALTER TABLE job_bids ADD COLUMN delivery_time integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_bids' AND column_name = 'seller_comment'
  ) THEN
    ALTER TABLE job_bids ADD COLUMN seller_comment text;
  END IF;
END $$;

-- Add fields to escrow_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'escrow_transactions' AND column_name = 'revision_count'
  ) THEN
    ALTER TABLE escrow_transactions ADD COLUMN revision_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'escrow_transactions' AND column_name = 'buyer_feedback'
  ) THEN
    ALTER TABLE escrow_transactions ADD COLUMN buyer_feedback text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'escrow_transactions' AND column_name = 'work_images'
  ) THEN
    ALTER TABLE escrow_transactions ADD COLUMN work_images text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'escrow_transactions' AND column_name = 'work_text'
  ) THEN
    ALTER TABLE escrow_transactions ADD COLUMN work_text text;
  END IF;
END $$;

-- Add fields to job_postings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_postings' AND column_name = 'work_images'
  ) THEN
    ALTER TABLE job_postings ADD COLUMN work_images text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_postings' AND column_name = 'work_text'
  ) THEN
    ALTER TABLE job_postings ADD COLUMN work_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_postings' AND column_name = 'revision_requested'
  ) THEN
    ALTER TABLE job_postings ADD COLUMN revision_requested boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_postings' AND column_name = 'buyer_feedback'
  ) THEN
    ALTER TABLE job_postings ADD COLUMN buyer_feedback text;
  END IF;
END $$;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_revisions_job_id ON work_revisions(job_id);
CREATE INDEX IF NOT EXISTS idx_work_revisions_escrow_id ON work_revisions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_work_revisions_seller_id ON work_revisions(seller_id);
CREATE INDEX IF NOT EXISTS idx_work_revisions_buyer_id ON work_revisions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_job_bids_status ON job_bids(status);
