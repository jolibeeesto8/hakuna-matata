import { useState, useEffect } from 'react';
import { ArrowLeftRight, Wallet, ShoppingCart, Store, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Wallet as WalletType } from '../../types';
import { BuyerDashboard } from './BuyerDashboard';
import { SellerDashboard } from './SellerDashboard';
import { ProfilePage } from '../profile/ProfilePage';
import './UserDashboard.css'; // Import the new CSS file

export const UserDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [mode, setMode] = useState<'buyer' | 'seller'>('buyer');
  const [showProfile, setShowProfile] = useState(false);
  const [wallet, setWallet] = useState<WalletType | null>(null);

  useEffect(() => {
    if (user) {
      loadWallet();
    }
  }, [user]);

  const loadWallet = async () => {
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    setWallet(data);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="user-dashboard-container">
      <header className="user-dashboard-header">
        <div className="header-content">
          <div className="brand">
            <h1>HMOS Dashboard</h1>
            <p>Welcome, {profile?.full_name}</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowProfile(true)}
              className="action-button"
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <div className="wallet-info">
              <div className="wallet-item">
                <div className="label">Available</div>
                <div className="value available">${wallet?.available_balance.toFixed(2) || '10.00'}</div>
              </div>
              <div className="wallet-item">
                <div className="label">Pending</div>
                <div className="value pending">${wallet?.pending_balance.toFixed(2) || '0.00'}</div>
              </div>
              <div className="wallet-item">
                <div className="label">Freezed</div>
                <div className="value freezed">${wallet?.freezed_balance.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="action-button"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mode-switch">
        <button
          onClick={() => setMode('buyer')}
          className={`mode-button ${mode === 'buyer' ? 'active' : ''}`}
        >
          <ShoppingCart size={18} />
          <span>Buyer Mode</span>
        </button>
        <ArrowLeftRight size={18} className="text-gray-400" />
        <button
          onClick={() => setMode('seller')}
          className={`mode-button ${mode === 'seller' ? 'active' : ''}`}
        >
          <Store size={18} />
          <span>Seller Mode</span>
        </button>
      </div>

      <main className="content">
        <div>{mode === 'buyer' ? <BuyerDashboard /> : <SellerDashboard />}</div>
      </main>
    </div>
  );
};