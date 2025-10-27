import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, DollarSign, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet, PaymentTransaction, WalletTransaction } from '../../types';
import './WalletManager.css';

export const WalletManager = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
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
    loadWalletData();
  }, [user]);

  const loadWalletData = async () => {
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

    const { data: txData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setTransactions(txData || []);

    const { data: paymentData } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPaymentTransactions(paymentData || []);

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
      loadWalletData();
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
      loadWalletData();
    } else {
      alert('Failed to submit withdrawal request');
    }
  };

  if (loading) {
    return <div className="wallet-loading">Loading wallet...</div>;
  }

  return (
    <div className="wallet-manager">
      <div className="wallet-header">
        <h1><WalletIcon size={32} /> My Wallet</h1>
      </div>

      <div className="wallet-balance-cards">
        <div className="balance-card available">
          <div className="balance-label">Available Balance</div>
          <div className="balance-amount">${wallet?.available_balance.toFixed(2) || '0.00'}</div>
        </div>
        <div className="balance-card pending">
          <div className="balance-label">Pending Balance</div>
          <div className="balance-amount">${wallet?.pending_balance.toFixed(2) || '0.00'}</div>
        </div>
        <div className="balance-card frozen">
          <div className="balance-label">Frozen Balance</div>
          <div className="balance-amount">${wallet?.freezed_balance.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="wallet-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`wallet-tab ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <DollarSign size={20} /> Overview
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`wallet-tab ${activeTab === 'deposit' ? 'active' : ''}`}
        >
          <ArrowDownCircle size={20} /> Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`wallet-tab ${activeTab === 'withdraw' ? 'active' : ''}`}
        >
          <ArrowUpCircle size={20} /> Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`wallet-tab ${activeTab === 'history' ? 'active' : ''}`}
        >
          <History size={20} /> History
        </button>
      </div>

      <div className="wallet-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Recent Payment Transactions</h2>
            <div className="payment-transactions-list">
              {paymentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="payment-transaction-item">
                  <div className="tx-info">
                    <div className="tx-type">{tx.type.toUpperCase()}</div>
                    <div className="tx-method">{tx.method}</div>
                    <div className="tx-amount">${tx.amount.toFixed(2)}</div>
                  </div>
                  <div className={`tx-status status-${tx.status}`}>
                    {tx.status}
                  </div>
                </div>
              ))}
              {paymentTransactions.length === 0 && (
                <p className="no-transactions">No payment transactions yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="deposit-section">
            <h2>Deposit Funds</h2>
            <form onSubmit={handleDeposit} className="deposit-form">
              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
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
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={depositPhone}
                    onChange={(e) => setDepositPhone(e.target.value)}
                    required
                    placeholder="+254712345678"
                  />
                </div>
              )}

              {depositMethod === 'binance' && (
                <div className="form-group">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    value={depositWalletAddress}
                    onChange={(e) => setDepositWalletAddress(e.target.value)}
                    required
                    placeholder="Your Binance wallet address"
                  />
                </div>
              )}

              {(depositMethod === 'paypal' || depositMethod === 'airtm') && (
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={depositEmail}
                    onChange={(e) => setDepositEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              )}

              <button type="submit" className="submit-btn">
                Submit Deposit Request
              </button>
            </form>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="withdraw-section">
            <h2>Withdraw Funds</h2>
            <form onSubmit={handleWithdraw} className="withdraw-form">
              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  max={wallet?.available_balance}
                  placeholder="Enter amount"
                />
                <small>Available: ${wallet?.available_balance.toFixed(2)}</small>
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
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    required
                    placeholder="+254712345678"
                  />
                </div>
              )}

              {withdrawMethod === 'binance' && (
                <div className="form-group">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    value={withdrawWalletAddress}
                    onChange={(e) => setWithdrawWalletAddress(e.target.value)}
                    required
                    placeholder="Your Binance wallet address"
                  />
                </div>
              )}

              {(withdrawMethod === 'paypal' || withdrawMethod === 'airtm') && (
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={withdrawEmail}
                    onChange={(e) => setWithdrawEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              )}

              <button type="submit" className="submit-btn">
                Submit Withdrawal Request
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <h2>Transaction History</h2>
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div className="tx-details">
                    <div className="tx-description">{tx.description}</div>
                    <div className="tx-date">{new Date(tx.created_at).toLocaleString()}</div>
                  </div>
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="no-transactions">No transactions yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
