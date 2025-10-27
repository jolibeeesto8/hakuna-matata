import { useState, useEffect } from 'react';
import { Users, Package, DollarSign, AlertTriangle, Shield, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentTransaction } from '../../types';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  status: string;
  country: string;
}

interface PendingAsset {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  license_type: string;
  status: string;
  seller_id: string;
}

interface DisputedTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  commission: number;
  dispute_reason: string | null;
  status: string;
}

export const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'assets' | 'disputes' | 'financials' | 'payments'>('members');
  const [members, setMembers] = useState<Profile[]>([]);
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [disputes, setDisputes] = useState<DisputedTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'members') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setMembers(data || []);
    } else if (activeTab === 'assets') {
      const { data } = await supabase
        .from('digital_assets')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      setPendingAssets(data || []);
    } else if (activeTab === 'disputes') {
      const { data } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('status', 'disputed')
        .order('created_at', { ascending: false });
      setDisputes(data || []);
    } else if (activeTab === 'payments') {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false});
      setPaymentTransactions(data || []);
    } else if (activeTab === 'financials') {
      const { data } = await supabase
        .from('escrow_transactions')
        .select('commission');

      const profit = data?.reduce((sum, t) => sum + parseFloat(t.commission.toString()), 0) || 0;
      setTotalProfit(profit);
    }
  };

  const handleApprovePayment = async (transaction: PaymentTransaction) => {
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .single();

    if (!walletData) {
      alert('Wallet not found');
      return;
    }

    if (transaction.type === 'deposit') {
      await supabase
        .from('wallets')
        .update({
          available_balance: walletData.available_balance + transaction.amount,
        })
        .eq('user_id', transaction.user_id);

      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletData.id,
          user_id: transaction.user_id,
          type: 'credit',
          amount: transaction.amount,
          balance_type: 'available',
          reference_type: 'deposit',
          reference_id: transaction.id,
          description: `Deposit via ${transaction.method}`,
        });
    } else if (transaction.type === 'withdraw') {
      if (walletData.available_balance < transaction.amount) {
        alert('Insufficient balance');
        return;
      }

      await supabase
        .from('wallets')
        .update({
          available_balance: walletData.available_balance - transaction.amount,
        })
        .eq('user_id', transaction.user_id);

      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletData.id,
          user_id: transaction.user_id,
          type: 'debit',
          amount: transaction.amount,
          balance_type: 'available',
          reference_type: 'withdraw',
          reference_id: transaction.id,
          description: `Withdrawal via ${transaction.method}`,
        });
    }

    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        admin_id: user?.id,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    await supabase
      .from('notifications')
      .insert({
        user_id: transaction.user_id,
        type: 'transaction',
        title: 'Payment Processed',
        message: `Your ${transaction.type} of $${transaction.amount} has been ${transaction.type === 'deposit' ? 'credited' : 'processed'}.`,
        reference_type: 'general',
      });

    alert('Payment approved!');
    loadData();
  };

  const handleRejectPayment = async (transaction: PaymentTransaction) => {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        admin_id: user?.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    await supabase
      .from('notifications')
      .insert({
        user_id: transaction.user_id,
        type: 'transaction',
        title: 'Payment Rejected',
        message: `Your ${transaction.type} request of $${transaction.amount} has been rejected.`,
        reference_type: 'general',
      });

    alert('Payment rejected');
    loadData();
  };

  const handleSuspendMember = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', userId);

    if (!error) {
      alert('Member suspended successfully');
      loadData();
    }
  };

  const handleReactivateMember = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId);

    if (!error) {
      alert('Member reactivated successfully');
      loadData();
    }
  };

  const handleApproveAsset = async (assetId: string) => {
    const { error } = await supabase
      .from('digital_assets')
      .update({ status: 'approved' })
      .eq('id', assetId);

    if (!error) {
      alert('Asset approved successfully');
      loadData();
    }
  };

  const handleRejectAsset = async (assetId: string) => {
    const { error } = await supabase
      .from('digital_assets')
      .update({ status: 'rejected' })
      .eq('id', assetId);

    if (!error) {
      alert('Asset rejected successfully');
      loadData();
    }
  };

  const handleResolveDispute = async (transactionId: string, refund: boolean) => {
    const { error } = await supabase
      .from('escrow_transactions')
      .update({
        status: refund ? 'refunded' : 'completed',
        admin_notes: refund ? 'Refunded by admin' : 'Resolved in favor of seller'
      })
      .eq('id', transactionId);

    if (!error) {
      alert(`Dispute resolved ${refund ? 'with refund' : 'in favor of seller'}`);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">HMOS Platform Management</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users size={20} />
            <span>Members</span>
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
              activeTab === 'assets'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package size={20} />
            <span>Pending Assets</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CreditCard size={20} />
            <span>Payments</span>
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
              activeTab === 'disputes'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle size={20} />
            <span>Disputes</span>
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
              activeTab === 'financials'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <DollarSign size={20} />
            <span>Financials</span>
          </button>
        </div>

        {activeTab === 'members' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Members</h2>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{member.full_name}</p>
                      <p className="text-sm text-gray-600">Role: {member.role}</p>
                      <p className="text-sm text-gray-600">Country: {member.country}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                      {member.role !== 'admin' && (
                        member.status === 'active' ? (
                          <button
                            onClick={() => handleSuspendMember(member.id)}
                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                          >
                            <Shield size={16} />
                            <span>Suspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateMember(member.id)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                          >
                            <Shield size={16} />
                            <span>Reactivate</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Assets for Review</h2>
            <div className="space-y-4">
              {pendingAssets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{asset.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{asset.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Category: </span>
                      <span className="font-medium">{asset.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Price: </span>
                      <span className="font-medium">${asset.price}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">License: </span>
                      <span className="font-medium">{asset.license_type}</span>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApproveAsset(asset.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectAsset(asset.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {pendingAssets.length === 0 && (
                <div className="text-center py-12 text-gray-500">No pending assets</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Payment Transactions</h2>
            <div className="space-y-4">
              {paymentTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {transaction.type.toUpperCase()} - ${transaction.amount}
                      </h3>
                      <p className="text-sm text-gray-600">Method: {transaction.method}</p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {transaction.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    {transaction.phone_number && (
                      <div>
                        <span className="text-gray-600">Phone: </span>
                        <span className="font-medium">{transaction.phone_number}</span>
                      </div>
                    )}
                    {transaction.wallet_address && (
                      <div>
                        <span className="text-gray-600">Wallet: </span>
                        <span className="font-medium">{transaction.wallet_address}</span>
                      </div>
                    )}
                    {transaction.email && (
                      <div>
                        <span className="text-gray-600">Email: </span>
                        <span className="font-medium">{transaction.email}</span>
                      </div>
                    )}
                    {transaction.notes && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Notes: </span>
                        <span className="font-medium">{transaction.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprovePayment(transaction)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectPayment(transaction)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {paymentTransactions.length === 0 && (
                <div className="text-center py-12 text-gray-500">No pending payments</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Disputed Transactions</h2>
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <p className="font-bold text-gray-900">Transaction ID: {dispute.id}</p>
                    <p className="text-sm text-gray-600">Amount: ${dispute.amount}</p>
                    <p className="text-sm text-gray-600">Commission: ${dispute.commission}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Reason: {dispute.dispute_reason || 'No reason provided'}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleResolveDispute(dispute.id, true)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Refund Buyer
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute.id, false)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Approve Seller
                    </button>
                  </div>
                </div>
              ))}
              {disputes.length === 0 && (
                <div className="text-center py-12 text-gray-500">No disputes</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Overview</h2>
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Total Platform Profit (10% Commission)</p>
                <p className="text-5xl font-bold text-green-600">${totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
