import { useState, useEffect } from 'react';
import {
  User, CreditCard, Clock, Star, ArrowLeft, Wallet as WalletIcon,
  DollarSign, ArrowUpCircle, ArrowDownCircle, History, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  EscrowTransaction, PaymentTransaction, Rating,
  Wallet, WalletTransaction
} from '../../types';
import './ProfileWithWallet.css';

interface ProfileWithWalletProps {
  onBack: () => void;
}

export const ProfileWithWallet = ({ onBack }: ProfileWithWalletProps) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'transactions' | 'ratings'>('overview');
  const [walletTab, setWalletTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'mpesa' | 'binance' | 'paypal' | 'airtm'>('mpesa');
  const [depositPhone, setDepositPhone] = useState('');
  const [depositWalletAddress, setDepositWalletAddress] = useState('');
  const [depositEmail, setDepositEmail] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'mpesa' | 'binance' | 'paypal' | 'airtm'>('mpesa');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawWalletAddress, setWithdrawWalletAddress] = useState('');
  const [withdrawEmail, setWithdrawEmail] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!walletData) {
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({ user_id: user.id })
        .select()
        .single();
      setWallet(newWallet);
    } else {
      setWallet(walletData);
    }

    if (activeTab === 'wallet') {
      const [txData, paymentData] = await Promise.all([
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (txData.data) setWalletTransactions(txData.data);
      if (paymentData.data) setPaymentTransactions(paymentData.data);
    }

    if (activeTab === 'transactions') {
      const { data: escrowData } = await supabase
        .from('escrow_transactions')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (escrowData) setEscrowTransactions(escrowData);
    }

    if (activeTab === 'ratings') {
      const { data } = await supabase
        .from('ratings')
        .select('*, rater:rater_user_id(full_name)')
        .eq('rated_user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setRatings(data as any);
    }

    setLoading(false);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet) return;

    const amount = parseFloat(depositAmount);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const paymentData: any = {
      user_id: user.id,
      type: 'deposit',
      method: depositMethod,
      amount,
      status: 'pending',
    };

    if (depositMethod === 'mpesa') {
      paymentData.phone_number = depositPhone;
    } else if (depositMethod === 'binance') {
      paymentData.wallet_address = depositWalletAddress;
    } else if (depositMethod === 'paypal' || depositMethod === 'airtm') {
      paymentData.email = depositEmail;
    }

    const { error } = await supabase
      .from('payment_transactions')
      .insert(paymentData);

    if (!error) {
      alert('Deposit request submitted! Waiting for admin approval.');
      setDepositAmount('');
      setDepositPhone('');
      setDepositWalletAddress('');
      setDepositEmail('');
      loadData();
    } else {
      alert('Failed to submit deposit request');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > wallet.available_balance) {
      alert('Insufficient balance');
      return;
    }

    const paymentData: any = {
      user_id: user.id,
      type: 'withdraw',
      method: withdrawMethod,
      amount,
      status: 'pending',
    };

    if (withdrawMethod === 'mpesa') {
      paymentData.phone_number = withdrawPhone;
    } else if (withdrawMethod === 'binance') {
      paymentData.wallet_address = withdrawWalletAddress;
    } else if (withdrawMethod === 'paypal' || withdrawMethod === 'airtm') {
      paymentData.email = withdrawEmail;
    }

    const { error } = await supabase
      .from('payment_transactions')
      .insert(paymentData);

    if (!error) {
      alert('Withdrawal request submitted! Waiting for admin approval.');
      setWithdrawAmount('');
      setWithdrawPhone('');
      setWithdrawWalletAddress('');
      setWithdrawEmail('');
      loadData();
    } else {
      alert('Failed to submit withdrawal request');
    }
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

  const renderOverview = () => (
    <div className="profile-overview">
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <User size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Full Name</p>
            <p className="stat-value">{profile?.full_name || 'Not set'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Star size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Average Rating</p>
            <p className="stat-value">
              {profile?.average_rating?.toFixed(1) || '0.0'} / 5.0
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Available Balance</p>
            <p className="stat-value">${wallet?.available_balance?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Member Since</p>
            <p className="stat-value">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="profile-details">
        <h3>Profile Information</h3>
        <div className="detail-row">
          <span className="detail-label">Email:</span>
          <span className="detail-value">{profile?.email}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{profile?.phone_number || 'Not provided'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Country:</span>
          <span className="detail-value">{profile?.country || 'Not provided'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total Ratings:</span>
          <span className="detail-value">{profile?.total_ratings || 0}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className={`status-badge ${profile?.status}`}>{profile?.status}</span>
        </div>
      </div>
    </div>
  );

  const renderWalletOverview = () => (
    <div className="wallet-overview">
      <div className="balance-cards">
        <div className="balance-card primary">
          <div className="balance-header">
            <WalletIcon size={24} />
            <span>Available Balance</span>
          </div>
          <div className="balance-amount">
            ${wallet?.available_balance?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="balance-card">
          <div className="balance-header">
            <Clock size={20} />
            <span>Pending</span>
          </div>
          <div className="balance-amount-small">
            ${wallet?.pending_balance?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="balance-card">
          <div className="balance-header">
            <TrendingUp size={20} />
            <span>Frozen</span>
          </div>
          <div className="balance-amount-small">
            ${wallet?.freezed_balance?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      <div className="wallet-actions">
        <button
          className="wallet-action-btn deposit"
          onClick={() => setWalletTab('deposit')}
        >
          <ArrowDownCircle size={20} />
          Deposit Funds
        </button>
        <button
          className="wallet-action-btn withdraw"
          onClick={() => setWalletTab('withdraw')}
        >
          <ArrowUpCircle size={20} />
          Withdraw Funds
        </button>
        <button
          className="wallet-action-btn history"
          onClick={() => setWalletTab('history')}
        >
          <History size={20} />
          View History
        </button>
      </div>
    </div>
  );

  const renderDepositForm = () => (
    <form onSubmit={handleDeposit} className="payment-form">
      <h3>Deposit Funds</h3>

      <div className="form-group">
        <label>Amount (USD)</label>
        <input
          type="number"
          step="0.01"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />
      </div>

      <div className="form-group">
        <label>Payment Method</label>
        <select
          value={depositMethod}
          onChange={(e) => setDepositMethod(e.target.value as any)}
        >
          <option value="mpesa">M-Pesa</option>
          <option value="binance">Binance</option>
          <option value="paypal">PayPal</option>
          <option value="airtm">AirTM</option>
        </select>
      </div>

      {depositMethod === 'mpesa' && (
        <div className="form-group">
          <label>M-Pesa Phone Number</label>
          <input
            type="tel"
            value={depositPhone}
            onChange={(e) => setDepositPhone(e.target.value)}
            placeholder="+254XXXXXXXXX"
            required
          />
        </div>
      )}

      {depositMethod === 'binance' && (
        <div className="form-group">
          <label>Binance Wallet Address</label>
          <input
            type="text"
            value={depositWalletAddress}
            onChange={(e) => setDepositWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
            required
          />
        </div>
      )}

      {(depositMethod === 'paypal' || depositMethod === 'airtm') && (
        <div className="form-group">
          <label>{depositMethod === 'paypal' ? 'PayPal' : 'AirTM'} Email</label>
          <input
            type="email"
            value={depositEmail}
            onChange={(e) => setDepositEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
        </div>
      )}

      <button type="submit" className="submit-btn">
        Submit Deposit Request
      </button>
      <button
        type="button"
        className="cancel-btn"
        onClick={() => setWalletTab('overview')}
      >
        Cancel
      </button>
    </form>
  );

  const renderWithdrawForm = () => (
    <form onSubmit={handleWithdraw} className="payment-form">
      <h3>Withdraw Funds</h3>

      <div className="form-group">
        <label>Amount (USD)</label>
        <input
          type="number"
          step="0.01"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Enter amount"
          max={wallet?.available_balance || 0}
          required
        />
        <small>Available: ${wallet?.available_balance?.toFixed(2) || '0.00'}</small>
      </div>

      <div className="form-group">
        <label>Payment Method</label>
        <select
          value={withdrawMethod}
          onChange={(e) => setWithdrawMethod(e.target.value as any)}
        >
          <option value="mpesa">M-Pesa</option>
          <option value="binance">Binance</option>
          <option value="paypal">PayPal</option>
          <option value="airtm">AirTM</option>
        </select>
      </div>

      {withdrawMethod === 'mpesa' && (
        <div className="form-group">
          <label>M-Pesa Phone Number</label>
          <input
            type="tel"
            value={withdrawPhone}
            onChange={(e) => setWithdrawPhone(e.target.value)}
            placeholder="+254XXXXXXXXX"
            required
          />
        </div>
      )}

      {withdrawMethod === 'binance' && (
        <div className="form-group">
          <label>Binance Wallet Address</label>
          <input
            type="text"
            value={withdrawWalletAddress}
            onChange={(e) => setWithdrawWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
            required
          />
        </div>
      )}

      {(withdrawMethod === 'paypal' || withdrawMethod === 'airtm') && (
        <div className="form-group">
          <label>{withdrawMethod === 'paypal' ? 'PayPal' : 'AirTM'} Email</label>
          <input
            type="email"
            value={withdrawEmail}
            onChange={(e) => setWithdrawEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
        </div>
      )}

      <button type="submit" className="submit-btn">
        Submit Withdrawal Request
      </button>
      <button
        type="button"
        className="cancel-btn"
        onClick={() => setWalletTab('overview')}
      >
        Cancel
      </button>
    </form>
  );

  const renderWalletHistory = () => (
    <div className="transaction-history">
      <h3>Transaction History</h3>

      <div className="history-section">
        <h4>Wallet Transactions</h4>
        {walletTransactions.length === 0 ? (
          <p className="empty-state">No transactions yet</p>
        ) : (
          <div className="transactions-list">
            {walletTransactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-details">
                  <span className="transaction-description">{tx.description}</span>
                  <span className="transaction-date">{formatDate(tx.created_at)}</span>
                </div>
                <div className="transaction-amount">
                  <span className={tx.type === 'credit' ? 'amount-positive' : 'amount-negative'}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="history-section">
        <h4>Payment Requests</h4>
        {paymentTransactions.length === 0 ? (
          <p className="empty-state">No payment requests yet</p>
        ) : (
          <div className="transactions-list">
            {paymentTransactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-details">
                  <span className="transaction-description">
                    {tx.type.toUpperCase()} via {tx.method.toUpperCase()}
                  </span>
                  <span className="transaction-date">{formatDate(tx.created_at)}</span>
                </div>
                <div className="transaction-amount">
                  <span className={`status-badge ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                  <span>${tx.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWallet = () => {
    switch (walletTab) {
      case 'overview':
        return renderWalletOverview();
      case 'deposit':
        return renderDepositForm();
      case 'withdraw':
        return renderWithdrawForm();
      case 'history':
        return renderWalletHistory();
      default:
        return renderWalletOverview();
    }
  };

  const renderTransactions = () => (
    <div className="transactions-section">
      <h3>Escrow Transactions</h3>
      {loading ? (
        <p>Loading...</p>
      ) : escrowTransactions.length === 0 ? (
        <p className="empty-state">No escrow transactions yet</p>
      ) : (
        <div className="transactions-grid">
          {escrowTransactions.map((tx) => (
            <div key={tx.id} className="transaction-card">
              <div className="transaction-header">
                <span className="transaction-type">{tx.reference_type}</span>
                <span className={`status-badge ${getStatusColor(tx.status)}`}>
                  {tx.status}
                </span>
              </div>
              <div className="transaction-body">
                <p><strong>Amount:</strong> ${tx.amount.toFixed(2)}</p>
                <p><strong>Commission:</strong> ${tx.commission.toFixed(2)}</p>
                <p><strong>Created:</strong> {formatDate(tx.created_at)}</p>
                {tx.work_submitted && (
                  <p><strong>Work Submitted:</strong> Yes</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRatings = () => (
    <div className="ratings-section">
      <h3>My Ratings</h3>
      {loading ? (
        <p>Loading...</p>
      ) : ratings.length === 0 ? (
        <p className="empty-state">No ratings yet</p>
      ) : (
        <div className="ratings-list">
          {ratings.map((rating: any) => (
            <div key={rating.id} className="rating-card">
              <div className="rating-header">
                {renderStars(rating.rating)}
                <span className="rating-date">{formatDate(rating.created_at)}</span>
              </div>
              <p className="rating-text">{rating.review_text}</p>
              <p className="rating-from">
                From: {rating.rater?.full_name || 'Anonymous'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="profile-with-wallet-container">
      <div className="profile-header">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={20} />
          Back
        </button>
        <h2>My Profile</h2>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={18} />
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('wallet');
            setWalletTab('overview');
          }}
        >
          <WalletIcon size={18} />
          Wallet
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'wallet' && renderWallet()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'ratings' && renderRatings()}
      </div>
    </div>
  );
};
