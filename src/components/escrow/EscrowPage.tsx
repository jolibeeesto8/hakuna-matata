import { useState, useEffect } from 'react';
import {
  ArrowLeft, MessageSquare, Upload, CheckCircle, XCircle,
  AlertTriangle, Send, File, Image as ImageIcon, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './EscrowPage.css';

interface EscrowPageProps {
  escrowId: string;
  onBack: () => void;
}

interface EscrowDetails {
  id: string;
  buyer_id: string;
  seller_id: string;
  reference_type: string;
  reference_id: string;
  amount: number;
  commission: number;
  status: string;
  work_submitted: boolean;
  work_text?: string;
  work_images?: string[];
  work_submission_url?: string;
  revision_count: number;
  buyer_feedback?: string;
  dispute_reason?: string;
  chat_enabled: boolean;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  attachment_url?: string;
  created_at: string;
  sender_name?: string;
}

export const EscrowPage = ({ escrowId, onBack }: EscrowPageProps) => {
  const { user, profile } = useAuth();
  const [escrow, setEscrow] = useState<EscrowDetails | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [workText, setWorkText] = useState('');
  const [workImages, setWorkImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [disputeReason, setDisputeReason] = useState('');
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const isUserType = user?.id === escrow?.buyer_id ? 'buyer' : 'seller';

  useEffect(() => {
    loadEscrowData();
    setupRealtimeSubscription();
  }, [escrowId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`escrow-${escrowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadEscrowData = async () => {
    setLoading(true);

    const { data: escrowData } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (escrowData) {
      setEscrow(escrowData);

      const { data: convData } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('transaction_id', escrowId)
        .maybeSingle();

      if (!convData && escrowData.chat_enabled) {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({
            transaction_id: escrowId,
            buyer_id: escrowData.buyer_id,
            seller_id: escrowData.seller_id,
          })
          .select()
          .single();
        setConversation(newConv);
      } else {
        setConversation(convData);
      }

      if (convData) {
        loadMessages(convData.id);
      }
    }

    setLoading(false);
  };

  const loadMessages = async (conversationId?: string) => {
    const convId = conversationId || conversation?.id;
    if (!convId) return;

    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*, sender:sender_id(full_name)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (messagesData) {
      setMessages(
        messagesData.map((msg: any) => ({
          ...msg,
          sender_name: msg.sender?.full_name || 'Unknown',
        }))
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      sender_id: user!.id,
      message: newMessage,
    });

    if (!error) {
      setNewMessage('');
      loadMessages();
    }
  };

  const handleSubmitWork = async () => {
    if (!escrow || isUserType !== 'seller') return;

    if (!workText.trim() && workImages.length === 0) {
      alert('Please provide work submission (text or images)');
      return;
    }

    const { error } = await supabase
      .from('escrow_transactions')
      .update({
        work_submitted: true,
        work_text: workText,
        work_images: workImages,
        work_submitted_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (!error) {
      await supabase.from('work_revisions').insert({
        job_id: escrow.reference_id,
        escrow_id: escrow.id,
        seller_id: escrow.seller_id,
        buyer_id: escrow.buyer_id,
        revision_number: (escrow.revision_count || 0) + 1,
        work_text: workText,
        work_images: workImages,
        status: 'pending',
      });

      await supabase.from('notifications').insert({
        user_id: escrow.buyer_id,
        type: 'transaction',
        title: 'Work Submitted',
        message: 'The seller has submitted work for your review',
        reference_type: 'transaction',
        reference_id: escrowId,
      });

      alert('Work submitted successfully!');
      loadEscrowData();
    } else {
      alert('Failed to submit work');
    }
  };

  const handleApproveWork = async () => {
    if (!escrow || isUserType !== 'buyer') return;

    const totalAmount = escrow.amount - escrow.commission;

    const { data: sellerWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', escrow.seller_id)
      .single();

    if (sellerWallet) {
      await supabase
        .from('wallets')
        .update({
          available_balance: sellerWallet.available_balance + totalAmount,
        })
        .eq('id', sellerWallet.id);

      await supabase.from('wallet_transactions').insert({
        wallet_id: sellerWallet.id,
        user_id: escrow.seller_id,
        type: 'credit',
        amount: totalAmount,
        balance_type: 'available',
        reference_type: 'job_completion',
        reference_id: escrow.reference_id,
        description: `Payment received for completed work - $${totalAmount.toFixed(2)}`,
      });
    }

    await supabase
      .from('escrow_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (escrow.reference_type === 'job') {
      await supabase
        .from('job_postings')
        .update({
          status: 'completed',
          work_approved: true,
        })
        .eq('id', escrow.reference_id);
    }

    await supabase.from('notifications').insert({
      user_id: escrow.seller_id,
      type: 'transaction',
      title: 'Work Approved',
      message: `Your work has been approved! $${totalAmount.toFixed(2)} has been released to your wallet.`,
      reference_type: 'transaction',
      reference_id: escrowId,
    });

    alert('Work approved and payment released!');
    loadEscrowData();
  };

  const handleRequestRevision = async () => {
    if (!escrow || isUserType !== 'buyer' || !revisionFeedback.trim()) return;

    await supabase
      .from('escrow_transactions')
      .update({
        revision_count: (escrow.revision_count || 0) + 1,
        buyer_feedback: revisionFeedback,
        work_submitted: false,
      })
      .eq('id', escrowId);

    await supabase.from('notifications').insert({
      user_id: escrow.seller_id,
      type: 'transaction',
      title: 'Revision Requested',
      message: 'The buyer has requested revisions to your work',
      reference_type: 'transaction',
      reference_id: escrowId,
    });

    alert('Revision request sent!');
    setRevisionFeedback('');
    loadEscrowData();
  };

  const handleFileDispute = async () => {
    if (!escrow || !disputeReason.trim()) return;

    await supabase
      .from('escrow_transactions')
      .update({
        status: 'disputed',
        dispute_reason: disputeReason,
        dispute_filed_by: isUserType,
        disputed_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    await supabase.from('dispute_resolutions').insert({
      escrow_transaction_id: escrowId,
      filed_by_user_id: user!.id,
      dispute_reason: disputeReason,
      status: 'open',
    });

    alert('Dispute filed! An admin will review your case.');
    setShowDisputeForm(false);
    loadEscrowData();
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setWorkImages([...workImages, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setWorkImages(workImages.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="loading-state">Loading escrow details...</div>;
  }

  if (!escrow) {
    return <div className="error-state">Escrow transaction not found</div>;
  }

  return (
    <div className="escrow-page-container">
      <div className="escrow-header">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={20} />
          Back
        </button>
        <h2>Escrow Transaction</h2>
        <span className={`status-badge ${escrow.status}`}>{escrow.status}</span>
      </div>

      <div className="escrow-content">
        <div className="escrow-info-section">
          <div className="info-card">
            <h3>Transaction Details</h3>
            <div className="info-row">
              <span>Amount:</span>
              <strong>${escrow.amount.toFixed(2)}</strong>
            </div>
            <div className="info-row">
              <span>Commission:</span>
              <strong>${escrow.commission.toFixed(2)}</strong>
            </div>
            <div className="info-row">
              <span>Seller Receives:</span>
              <strong>${(escrow.amount - escrow.commission).toFixed(2)}</strong>
            </div>
            <div className="info-row">
              <span>Revision Count:</span>
              <strong>{escrow.revision_count || 0}</strong>
            </div>
            <div className="info-row">
              <span>Work Submitted:</span>
              <strong>{escrow.work_submitted ? 'Yes' : 'No'}</strong>
            </div>
          </div>

          {escrow.work_submitted && (
            <div className="work-submission-card">
              <h3>Submitted Work</h3>
              {escrow.work_text && (
                <div className="work-text">
                  <h4>Written Work:</h4>
                  <p>{escrow.work_text}</p>
                </div>
              )}
              {escrow.work_images && escrow.work_images.length > 0 && (
                <div className="work-images">
                  <h4>Images:</h4>
                  <div className="image-grid">
                    {escrow.work_images.map((url, index) => (
                      <img key={index} src={url} alt={`Work ${index + 1}`} />
                    ))}
                  </div>
                </div>
              )}

              {isUserType === 'buyer' && escrow.status === 'active' && (
                <div className="buyer-actions">
                  <button onClick={handleApproveWork} className="approve-btn">
                    <CheckCircle size={18} />
                    Approve & Release Payment
                  </button>
                  <div className="revision-section">
                    <textarea
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                      placeholder="Provide feedback for revision..."
                      rows={3}
                    />
                    <button onClick={handleRequestRevision} className="revision-btn">
                      <XCircle size={18} />
                      Request Revision
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!escrow.work_submitted && isUserType === 'seller' && escrow.status === 'active' && (
            <div className="work-submission-form">
              <h3>Submit Your Work</h3>

              {escrow.buyer_feedback && (
                <div className="buyer-feedback-alert">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Buyer Feedback:</strong>
                    <p>{escrow.buyer_feedback}</p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Written Work:</label>
                <textarea
                  value={workText}
                  onChange={(e) => setWorkText(e.target.value)}
                  placeholder="Enter your work description or text content..."
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label>Image URLs:</label>
                <div className="image-input-group">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL..."
                  />
                  <button type="button" onClick={addImageUrl} className="add-image-btn">
                    <ImageIcon size={18} />
                    Add
                  </button>
                </div>
                {workImages.length > 0 && (
                  <div className="image-preview-list">
                    {workImages.map((url, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={url} alt={`Preview ${index + 1}`} />
                        <button onClick={() => removeImage(index)} className="remove-image-btn">
                          <XCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleSubmitWork} className="submit-work-btn">
                <Upload size={18} />
                Submit Work
              </button>
            </div>
          )}

          {escrow.status === 'active' && (
            <div className="dispute-section">
              {!showDisputeForm ? (
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className="dispute-btn"
                >
                  <AlertTriangle size={18} />
                  File a Dispute
                </button>
              ) : (
                <div className="dispute-form">
                  <h4>File Dispute</h4>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                  />
                  <div className="dispute-actions">
                    <button onClick={handleFileDispute} className="submit-dispute-btn">
                      Submit Dispute
                    </button>
                    <button
                      onClick={() => setShowDisputeForm(false)}
                      className="cancel-dispute-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {escrow.chat_enabled && conversation && (
          <div className="chat-section">
            <h3>
              <MessageSquare size={20} />
              Chat
            </h3>
            <div className="messages-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === user?.id ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-header">
                    <span className="sender-name">{msg.sender_name}</span>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" disabled={!newMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
