import { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { EscrowTransaction, Profile } from '../../types';
import './ClientEscrowPage.css';

interface EscrowWithDetails extends EscrowTransaction {
  buyer?: Profile;
  seller?: Profile;
}

export const ClientEscrowPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EscrowWithDetails[]>([]);
  const [selectedTx, setSelectedTx] = useState<EscrowWithDetails | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    const { data: txData } = await supabase
      .from('escrow_transactions')
      .select('*')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (txData) {
      const txWithDetails = await Promise.all(
        txData.map(async (tx) => {
          const { data: buyer } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', tx.buyer_id)
            .single();

          let seller = null;
          if (tx.seller_id) {
            const { data: sellerData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', tx.seller_id)
              .single();
            seller = sellerData;
          }

          return { ...tx, buyer, seller };
        })
      );
      setTransactions(txWithDetails);
    }

    setLoading(false);
  };

  const handleFileDispute = async () => {
    if (!selectedTx || !disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    const userRole = selectedTx.buyer_id === user?.id ? 'buyer' : 'seller';

    const { error } = await supabase
      .from('escrow_transactions')
      .update({
        status: 'disputed',
        dispute_reason: disputeReason,
        dispute_filed_by: userRole,
        disputed_at: new Date().toISOString(),
      })
      .eq('id', selectedTx.id);

    if (!error) {
      const otherPartyId = userRole === 'buyer' ? selectedTx.seller_id : selectedTx.buyer_id;

      await supabase
        .from('notifications')
        .insert({
          user_id: otherPartyId,
          type: 'dispute',
          title: 'Dispute Filed',
          message: `A dispute has been filed on transaction #${selectedTx.id.slice(0, 8)}`,
          reference_type: 'transaction',
          reference_id: selectedTx.id,
        });

      alert('Dispute filed successfully. An admin will review it soon.');
      setShowDisputeForm(false);
      setDisputeReason('');
      setSelectedTx(null);
      loadTransactions();
    } else {
      alert('Failed to file dispute');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'disputed':
        return 'status-disputed';
      case 'refunded':
        return 'status-refunded';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="escrow-loading">Loading transactions...</div>;
  }

  return (
    <div className="client-escrow-page">
      <div className="escrow-header">
        <h1><Shield size={32} /> My Escrow Transactions</h1>
        <p>All payments are held securely until work is completed</p>
      </div>

      <div className="transactions-grid">
        {transactions.map((tx) => {
          const isBuyer = tx.buyer_id === user?.id;
          const otherParty = isBuyer ? tx.seller : tx.buyer;

          return (
            <div key={tx.id} className="escrow-card">
              <div className="escrow-card-header">
                <div className="tx-id">Transaction #{tx.id.slice(0, 8)}</div>
                <span className={`tx-status ${getStatusColor(tx.status)}`}>
                  {tx.status}
                </span>
              </div>

              <div className="escrow-details">
                <div className="detail-row">
                  <span className="label">Role:</span>
                  <span className="value">{isBuyer ? 'Buyer' : 'Seller'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">{isBuyer ? 'Seller:' : 'Buyer:'}</span>
                  <span className="value">{otherParty?.full_name || 'Not assigned yet'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value amount">${tx.amount.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Commission:</span>
                  <span className="value">${tx.commission.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{tx.reference_type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Created:</span>
                  <span className="value">{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
                {tx.work_submitted && (
                  <div className="detail-row">
                    <span className="label">Work Status:</span>
                    <span className="value">
                      <CheckCircle size={16} className="inline" /> Submitted
                    </span>
                  </div>
                )}
                {tx.revision_count > 0 && (
                  <div className="detail-row">
                    <span className="label">Revisions:</span>
                    <span className="value">{tx.revision_count}</span>
                  </div>
                )}
              </div>

              {tx.status === 'disputed' && (
                <div className="dispute-info">
                  <AlertCircle size={20} />
                  <div>
                    <div className="dispute-title">Dispute Filed</div>
                    <div className="dispute-reason">{tx.dispute_reason}</div>
                    {tx.admin_notes && (
                      <div className="admin-notes">
                        <strong>Admin Notes:</strong> {tx.admin_notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tx.status === 'active' && tx.work_submitted && (
                <button
                  onClick={() => {
                    setSelectedTx(tx);
                    setShowDisputeForm(true);
                  }}
                  className="dispute-btn"
                >
                  <AlertCircle size={18} /> File Dispute
                </button>
              )}
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="no-transactions">
            <Shield size={64} />
            <p>No escrow transactions yet</p>
          </div>
        )}
      </div>

      {showDisputeForm && selectedTx && (
        <div className="modal-overlay" onClick={() => setShowDisputeForm(false)}>
          <div className="dispute-modal" onClick={(e) => e.stopPropagation()}>
            <h2>File Dispute</h2>
            <p>Transaction #{selectedTx.id.slice(0, 8)}</p>

            <div className="form-group">
              <label>Reason for Dispute</label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={6}
                placeholder="Please explain the issue in detail..."
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleFileDispute} className="submit-btn">
                Submit Dispute
              </button>
              <button
                onClick={() => {
                  setShowDisputeForm(false);
                  setDisputeReason('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
