import { useState, useEffect } from 'react';
import { User, CreditCard, Clock, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { EscrowTransaction, PaymentTransaction, Rating } from '../../types';
import './EnhancedProfilePage.css';

interface ProfilePageProps {
  onBack: () => void;
}

export const EnhancedProfilePage = ({ onBack }: ProfilePageProps) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'ratings'>('overview');
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    if (activeTab === 'transactions') {
      const [escrowData, paymentData] = await Promise.all([
        supabase
          .from('escrow_transactions')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!escrowData.error) setEscrowTransactions(escrowData.data || []);
      if (!paymentData.error) setPaymentTransactions(paymentData.data || []);
    } else if (activeTab === 'ratings') {
      const { data } = await supabase
        .from('ratings')
        .select('*, rater:rater_user_id(full_name)')
        .eq('rated_user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setRatings(data as any);
    }

    setLoading(false);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'active':
      case 'pending':
        return 'status-active';
      case 'disputed':
        return 'status-disputed';
      case 'refunded':
      case 'cancelled':
      case 'failed':
        return 'status-refunded';
      default:
        return '';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#fbbf24' : 'none'}
            stroke={star <= rating ? '#fbbf24' : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="enhanced-profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>My Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <h2>{profile?.full_name || 'User'}</h2>
            <p className="profile-role">{profile?.role === 'admin' ? 'Administrator' : 'Member'}</p>
            <div className="profile-rating">
              {renderStars(Math.round(profile?.average_rating || 0))}
              <span>
                {profile?.average_rating?.toFixed(1) || '0.0'} ({profile?.total_ratings || 0}{' '}
                ratings)
              </span>
            </div>
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Country</span>
                <span className="info-value">{profile?.country || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{profile?.phone_number || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <User size={18} />
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <CreditCard size={18} />
              Transactions
            </button>
            <button
              className={`tab ${activeTab === 'ratings' ? 'active' : ''}`}
              onClick={() => setActiveTab('ratings')}
            >
              <Star size={18} />
              Ratings
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <CreditCard />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">Total Transactions</div>
                      <div className="stat-value">{escrowTransactions.length}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Star />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">Average Rating</div>
                      <div className="stat-value">
                        {profile?.average_rating?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Clock />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">Member Since</div>
                      <div className="stat-value">
                        {new Date(profile?.created_at || '').toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="transactions-tab">
                <h3>Escrow Transactions</h3>
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : escrowTransactions.length === 0 ? (
                  <div className="empty-state">No escrow transactions yet</div>
                ) : (
                  <div className="transaction-list">
                    {escrowTransactions.map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div className="transaction-header">
                          <div className="transaction-type">
                            {tx.buyer_id === user?.id ? 'Purchase' : 'Sale'} -{' '}
                            {tx.reference_type}
                          </div>
                          <span className={`transaction-status ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="transaction-details">
                          <div className="transaction-amount">${tx.amount.toFixed(2)}</div>
                          <div className="transaction-date">{formatDate(tx.created_at)}</div>
                        </div>
                        {tx.dispute_reason && (
                          <div className="transaction-dispute">Dispute: {tx.dispute_reason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <h3 style={{ marginTop: '32px' }}>Payment Transactions</h3>
                {paymentTransactions.length === 0 ? (
                  <div className="empty-state">No payment transactions yet</div>
                ) : (
                  <div className="transaction-list">
                    {paymentTransactions.map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div className="transaction-header">
                          <div className="transaction-type">
                            {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} - {tx.method}
                          </div>
                          <span className={`transaction-status ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="transaction-details">
                          <div className="transaction-amount">${tx.amount.toFixed(2)}</div>
                          <div className="transaction-date">{formatDate(tx.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div className="ratings-tab">
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : ratings.length === 0 ? (
                  <div className="empty-state">No ratings yet</div>
                ) : (
                  <div className="ratings-list">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="rating-item">
                        <div className="rating-header">
                          {renderStars(rating.rating)}
                          <span className="rating-date">{formatDate(rating.created_at)}</span>
                        </div>
                        {rating.review_text && (
                          <p className="rating-review">{rating.review_text}</p>
                        )}
                        <div className="rating-author">
                          From: {(rating as any).rater?.full_name || 'Anonymous'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
