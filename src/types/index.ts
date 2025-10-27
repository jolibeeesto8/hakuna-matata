export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  country: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  average_rating: number;
  total_ratings: number;
  email_verified: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  freezed_balance: number;
  currency: string;
  updated_at: string;
}

export interface DigitalAsset {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: 'source_code' | 'dataset' | 'b2b_specialty';
  price: number;
  license_type: string;
  file_url: string | null;
  status: 'pending_review' | 'approved' | 'rejected';
  posted_by_admin: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  product_name: string;
  subject: string;
  country: string;
  price: number;
  image_url_1: string;
  image_url_2: string;
  type: 'physical' | 'digital';
  status: 'active' | 'sold' | 'inactive';
  created_at: string;
}

export interface JobPosting {
  id: string;
  buyer_id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  max_bids: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  accepted_seller_id: string | null;
  escrow_transaction_id: string | null;
  work_submission_url: string | null;
  work_submitted_at: string | null;
  work_approved: boolean;
  created_at: string;
}

export interface JobBid {
  id: string;
  job_id: string;
  seller_id: string;
  bid_amount: number;
  proposal: string;
  delivery_time: number | null;
  seller_comment: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string | null;
  reference_type: 'product' | 'asset' | 'job';
  reference_id: string;
  amount: number;
  commission: number;
  status: 'active' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
  work_submitted: boolean;
  work_submission_url: string | null;
  work_text: string | null;
  work_images: string[] | null;
  work_submitted_at: string | null;
  revision_count: number;
  buyer_feedback: string | null;
  dispute_reason: string | null;
  dispute_filed_by: 'buyer' | 'seller' | null;
  admin_notes: string | null;
  resolution_notes: string | null;
  created_at: string;
  completed_at: string | null;
  disputed_at: string | null;
  resolved_at: string | null;
}

export interface WorkRevision {
  id: string;
  job_id: string;
  escrow_id: string | null;
  seller_id: string;
  buyer_id: string;
  revision_number: number;
  work_text: string | null;
  work_images: string[] | null;
  work_url: string | null;
  buyer_feedback: string | null;
  status: 'pending' | 'revision_requested' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'transaction' | 'message' | 'system' | 'rating' | 'dispute';
  title: string;
  message: string;
  read: boolean;
  reference_type: 'job' | 'transaction' | 'chat' | 'rating' | 'general' | null;
  reference_id: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  transaction_id: string | null;
  buyer_id: string;
  seller_id: string;
  admin_id: string | null;
  status: 'active' | 'closed';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  read_by_buyer: boolean;
  read_by_seller: boolean;
  read_by_admin: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  transaction_id: string;
  rated_user_id: string;
  rater_user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw';
  method: 'mpesa' | 'binance' | 'paypal' | 'airtm';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_ref: string | null;
  phone_number: string | null;
  wallet_address: string | null;
  email: string | null;
  notes: string | null;
  admin_id: string | null;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'freeze' | 'unfreeze' | 'pending_to_available';
  amount: number;
  balance_type: 'available' | 'pending' | 'freezed';
  reference_type: 'deposit' | 'withdraw' | 'job_post' | 'job_award' | 'job_completion' | 'purchase' | 'sale' | 'refund' | 'commission' | null;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CommunityLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  lesson_number: number;
  title: string;
  content: string;
  video_url: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  course_id: string;
  exam_number: number;
  title: string;
  passing_score: number;
  created_at: string;
}
