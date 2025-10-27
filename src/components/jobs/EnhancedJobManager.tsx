import { useState, useEffect } from 'react';
import { Briefcase, Plus, Send, CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { JobPosting, JobBid, Wallet, Profile } from '../../types';
import './EnhancedJobManager.css';

interface JobWithBids extends JobPosting {
  bids?: JobBid[];
  bidCount?: number;
}

export const EnhancedJobManager = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [jobs, setJobs] = useState<JobWithBids[]>([]);
  const [myBids, setMyBids] = useState<JobBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [maxBids, setMaxBids] = useState('10');

  const [selectedJobForBid, setSelectedJobForBid] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');

  const [selectedJobForWork, setSelectedJobForWork] = useState<string | null>(null);
  const [workSubmissionUrl, setWorkSubmissionUrl] = useState('');

  useEffect(() => {
    loadData();
  }, [user, userRole]);

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

    if (userRole === 'buyer') {
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsData) {
        const jobsWithBids = await Promise.all(
          jobsData.map(async (job) => {
            const { data: bids } = await supabase
              .from('job_bids')
              .select('*')
              .eq('job_id', job.id)
              .order('created_at', { ascending: false });

            return {
              ...job,
              bids: bids || [],
              bidCount: bids?.length || 0,
            };
          })
        );
        setJobs(jobsWithBids);
      }
    } else {
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false});

      if (jobsData) {
        const jobsWithBidCounts = await Promise.all(
          jobsData.map(async (job) => {
            const { count } = await supabase
              .from('job_bids')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id);

            const { data: myBid } = await supabase
              .from('job_bids')
              .select('*')
              .eq('job_id', job.id)
              .eq('seller_id', user.id)
              .maybeSingle();

            return {
              ...job,
              bidCount: count || 0,
              myBid: myBid,
            };
          })
        );
        setJobs(jobsWithBidCounts as any);
      }

      const { data: bidsData } = await supabase
        .from('job_bids')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      setMyBids(bidsData || []);
    }

    setLoading(false);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();

    const budget = parseFloat(jobBudget);

    if (!wallet || wallet.available_balance < budget) {
      alert('Insufficient balance! Your wallet must have enough balance to post a job.');
      return;
    }

    const { data: escrowData, error: escrowError } = await supabase
      .from('escrow_transactions')
      .insert({
        buyer_id: user?.id,
        seller_id: null,
        reference_type: 'job',
        reference_id: 'pending',
        amount: budget,
        commission: budget * 0.10,
        status: 'active',
      })
      .select()
      .single();

    if (escrowError) {
      alert('Failed to create escrow transaction');
      return;
    }

    const { data: jobData, error: jobError } = await supabase
      .from('job_postings')
      .insert({
        buyer_id: user?.id,
        title: jobTitle,
        description: jobDescription,
        budget,
        category: jobCategory,
        max_bids: parseInt(maxBids),
        status: 'open',
        escrow_transaction_id: escrowData.id,
      })
      .select()
      .single();

    if (jobError) {
      await supabase
        .from('escrow_transactions')
        .delete()
        .eq('id', escrowData.id);
      alert('Failed to post job');
      return;
    }

    await supabase
      .from('escrow_transactions')
      .update({ reference_id: jobData.id })
      .eq('id', escrowData.id);

    const newAvailableBalance = wallet.available_balance - budget;
    const newFrozenBalance = wallet.freezed_balance + budget;

    await supabase
      .from('wallets')
      .update({
        available_balance: newAvailableBalance,
        freezed_balance: newFrozenBalance,
      })
      .eq('user_id', user?.id);

    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user?.id,
        type: 'debit',
        amount: budget,
        balance_type: 'available',
        reference_type: 'job_post',
        reference_id: jobData.id,
        description: `Job posted: ${jobTitle}`,
      });

    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user?.id,
        type: 'freeze',
        amount: budget,
        balance_type: 'freezed',
        reference_type: 'job_post',
        reference_id: jobData.id,
        description: `Funds frozen for job: ${jobTitle}`,
      });

    alert('Job posted successfully! Funds have been frozen in escrow.');
    setShowJobForm(false);
    setJobTitle('');
    setJobDescription('');
    setJobBudget('');
    setJobCategory('');
    setMaxBids('10');
    loadData();
  };

  const handlePlaceBid = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const { data: existingBid } = await supabase
      .from('job_bids')
      .select('*')
      .eq('job_id', jobId)
      .eq('seller_id', user?.id)
      .maybeSingle();

    if (existingBid) {
      alert('You have already placed a bid on this job!');
      return;
    }

    const { count } = await supabase
      .from('job_bids')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);

    if (count && count >= job.max_bids) {
      alert(`This job has reached the maximum number of bids (${job.max_bids})`);
      return;
    }

    const { error } = await supabase
      .from('job_bids')
      .insert({
        job_id: jobId,
        seller_id: user?.id,
        bid_amount: parseFloat(bidAmount),
        proposal: bidProposal,
        status: 'pending',
      });

    if (!error) {
      await supabase
        .from('notifications')
        .insert({
          user_id: job.buyer_id,
          type: 'system',
          title: 'New Bid Received',
          message: `You received a new bid on your job: ${job.title}`,
          reference_type: 'job',
          reference_id: jobId,
        });

      alert('Bid submitted successfully!');
      setSelectedJobForBid(null);
      setBidAmount('');
      setBidProposal('');
      loadData();
    } else {
      alert('Failed to submit bid');
    }
  };

  const handleAcceptBid = async (job: JobWithBids, bid: JobBid) => {
    const { error: jobError } = await supabase
      .from('job_postings')
      .update({
        status: 'in_progress',
        accepted_seller_id: bid.seller_id,
      })
      .eq('id', job.id);

    if (jobError) {
      alert('Failed to accept bid');
      return;
    }

    const { error: bidError } = await supabase
      .from('job_bids')
      .update({ status: 'accepted' })
      .eq('id', bid.id);

    await supabase
      .from('job_bids')
      .update({ status: 'rejected' })
      .eq('job_id', job.id)
      .neq('id', bid.id);

    if (job.escrow_transaction_id) {
      await supabase
        .from('escrow_transactions')
        .update({ seller_id: bid.seller_id })
        .eq('id', job.escrow_transaction_id);
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: bid.seller_id,
        type: 'system',
        title: 'Bid Accepted!',
        message: `Your bid on "${job.title}" has been accepted!`,
        reference_type: 'job',
        reference_id: job.id,
      });

    alert('Bid accepted! Job is now in progress.');
    loadData();
  };

  const handleSubmitWork = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.escrow_transaction_id) return;

    const { error: jobError } = await supabase
      .from('job_postings')
      .update({
        work_submission_url: workSubmissionUrl,
        work_submitted_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    const { error: escrowError } = await supabase
      .from('escrow_transactions')
      .update({
        work_submitted: true,
        work_submission_url: workSubmissionUrl,
        work_submitted_at: new Date().toISOString(),
      })
      .eq('id', job.escrow_transaction_id);

    if (!jobError && !escrowError) {
      await supabase
        .from('notifications')
        .insert({
          user_id: job.buyer_id,
          type: 'system',
          title: 'Work Submitted',
          message: `Work has been submitted for job: ${job.title}`,
          reference_type: 'job',
          reference_id: jobId,
        });

      alert('Work submitted successfully! Waiting for buyer approval.');
      setSelectedJobForWork(null);
      setWorkSubmissionUrl('');
      loadData();
    } else {
      alert('Failed to submit work');
    }
  };

  const handleApproveWork = async (job: JobWithBids) => {
    if (!job.escrow_transaction_id || !job.accepted_seller_id || !wallet) return;

    const { data: escrowData } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', job.escrow_transaction_id)
      .single();

    if (!escrowData) {
      alert('Escrow transaction not found');
      return;
    }

    const { data: sellerWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', job.accepted_seller_id)
      .single();

    if (!sellerWallet) {
      alert('Seller wallet not found');
      return;
    }

    const sellerAmount = escrowData.amount - escrowData.commission;

    await supabase
      .from('wallets')
      .update({
        freezed_balance: wallet.freezed_balance - escrowData.amount,
      })
      .eq('user_id', user?.id);

    await supabase
      .from('wallets')
      .update({
        available_balance: sellerWallet.available_balance + sellerAmount,
      })
      .eq('user_id', job.accepted_seller_id);

    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user?.id,
        type: 'unfreeze',
        amount: escrowData.amount,
        balance_type: 'freezed',
        reference_type: 'job_completion',
        reference_id: job.id,
        description: `Payment released for job: ${job.title}`,
      });

    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: sellerWallet.id,
        user_id: job.accepted_seller_id,
        type: 'credit',
        amount: sellerAmount,
        balance_type: 'available',
        reference_type: 'job_completion',
        reference_id: job.id,
        description: `Payment received for job: ${job.title}`,
      });

    await supabase
      .from('job_postings')
      .update({
        status: 'completed',
        work_approved: true,
      })
      .eq('id', job.id);

    await supabase
      .from('escrow_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.escrow_transaction_id);

    await supabase
      .from('notifications')
      .insert({
        user_id: job.accepted_seller_id,
        type: 'transaction',
        title: 'Payment Released!',
        message: `Payment of $${sellerAmount.toFixed(2)} has been released for job: ${job.title}`,
        reference_type: 'job',
        reference_id: job.id,
      });

    alert('Work approved! Payment has been released to the seller.');
    loadData();
  };

  if (loading) {
    return <div className="job-loading">Loading jobs...</div>;
  }

  return (
    <div className="enhanced-job-manager">
      <div className="job-header">
        <h1><Briefcase size={32} /> Job Marketplace</h1>
        <div className="role-toggle">
          <button
            onClick={() => setUserRole('buyer')}
            className={`role-btn ${userRole === 'buyer' ? 'active' : ''}`}
          >
            As Buyer
          </button>
          <button
            onClick={() => setUserRole('seller')}
            className={`role-btn ${userRole === 'seller' ? 'active' : ''}`}
          >
            As Seller
          </button>
        </div>
      </div>

      <div className="wallet-info">
        <div className="wallet-balance">
          Available Balance: <span>${wallet?.available_balance.toFixed(2) || '0.00'}</span>
        </div>
        <div className="wallet-balance">
          Frozen Balance: <span>${wallet?.freezed_balance.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {userRole === 'buyer' && (
        <div className="buyer-section">
          <div className="section-header">
            <h2>My Job Postings</h2>
            <button onClick={() => setShowJobForm(!showJobForm)} className="post-job-btn">
              <Plus size={20} /> Post New Job
            </button>
          </div>

          {showJobForm && (
            <form onSubmit={handlePostJob} className="job-form">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  placeholder="Enter job title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the job requirements"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Budget ($)</label>
                  <input
                    type="number"
                    value={jobBudget}
                    onChange={(e) => setJobBudget(e.target.value)}
                    required
                    min="1"
                    step="0.01"
                    placeholder="Enter budget"
                  />
                </div>
                <div className="form-group">
                  <label>Max Bids</label>
                  <input
                    type="number"
                    value={maxBids}
                    onChange={(e) => setMaxBids(e.target.value)}
                    required
                    min="1"
                    max="100"
                    placeholder="Maximum number of bids"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  required
                  placeholder="e.g., Web Development, Design, Writing"
                />
              </div>
              <button type="submit" className="submit-btn">
                Post Job (${jobBudget} will be frozen)
              </button>
            </form>
          )}

          <div className="jobs-list">
            {jobs.map((job) => (
              <div key={job.id} className="job-card buyer-view">
                <div className="job-info">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <div className="job-meta">
                    <span className="budget">Budget: ${job.budget}</span>
                    <span className="category">{job.category}</span>
                    <span className={`status status-${job.status}`}>{job.status}</span>
                    <span className="bid-count">
                      {job.bidCount}/{job.max_bids} Bids
                    </span>
                  </div>
                </div>

                {job.status === 'open' && job.bids && job.bids.length > 0 && (
                  <div className="bids-section">
                    <h4>Received Bids:</h4>
                    {job.bids.map((bid) => (
                      <div key={bid.id} className="bid-item">
                        <div className="bid-details">
                          <p className="bid-amount">${bid.bid_amount}</p>
                          <p className="bid-proposal">{bid.proposal}</p>
                        </div>
                        {bid.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptBid(job, bid)}
                            className="accept-btn"
                          >
                            <CheckCircle size={18} /> Accept
                          </button>
                        )}
                        {bid.status !== 'pending' && (
                          <span className={`bid-status status-${bid.status}`}>
                            {bid.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {job.status === 'in_progress' && job.work_submission_url && (
                  <div className="work-review-section">
                    <h4>Work Submitted:</h4>
                    <a href={job.work_submission_url} target="_blank" rel="noopener noreferrer" className="work-link">
                      View Submitted Work
                    </a>
                    {!job.work_approved && (
                      <button
                        onClick={() => handleApproveWork(job)}
                        className="approve-btn"
                      >
                        <CheckCircle size={18} /> Approve & Release Payment
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {jobs.length === 0 && <p className="no-items">No jobs posted yet</p>}
          </div>
        </div>
      )}

      {userRole === 'seller' && (
        <div className="seller-section">
          <h2>Available Jobs</h2>
          <div className="jobs-list">
            {jobs.map((job: any) => {
              const isExpired = job.bidCount >= job.max_bids;
              const hasBid = !!job.myBid;
              const isAccepted = job.accepted_seller_id === user?.id;

              return (
                <div key={job.id} className={`job-card seller-view ${isExpired ? 'expired' : ''}`}>
                  <div className="job-info">
                    <h3>{job.title}</h3>
                    <p>{job.description}</p>
                    <div className="job-meta">
                      <span className="budget">Budget: ${job.budget}</span>
                      <span className="category">{job.category}</span>
                      <span className="bid-count">
                        {job.bidCount}/{job.max_bids} Bids
                      </span>
                    </div>
                  </div>

                  {isExpired && !hasBid && (
                    <div className="expired-notice">
                      <Clock size={20} /> Bidding Closed
                    </div>
                  )}

                  {!isExpired && !hasBid && (
                    <div>
                      {selectedJobForBid === job.id ? (
                        <div className="bid-form">
                          <div className="form-group">
                            <label>Your Bid Amount ($)</label>
                            <input
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              required
                              min="1"
                              step="0.01"
                            />
                          </div>
                          <div className="form-group">
                            <label>Proposal</label>
                            <textarea
                              value={bidProposal}
                              onChange={(e) => setBidProposal(e.target.value)}
                              required
                              rows={3}
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              type="button"
                              onClick={() => handlePlaceBid(job.id)}
                              className="submit-btn"
                            >
                              <Send size={18} /> Submit Bid
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedJobForBid(null)}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedJobForBid(job.id)}
                          className="bid-btn"
                        >
                          Place Bid
                        </button>
                      )}
                    </div>
                  )}

                  {hasBid && (
                    <div className="my-bid-info">
                      <p>Your Bid: ${job.myBid.bid_amount}</p>
                      <span className={`bid-status status-${job.myBid.status}`}>
                        {job.myBid.status}
                      </span>
                    </div>
                  )}

                  {isAccepted && job.status === 'in_progress' && !job.work_submission_url && (
                    <div className="work-submission-section">
                      {selectedJobForWork === job.id ? (
                        <div className="work-form">
                          <div className="form-group">
                            <label>Work Submission URL</label>
                            <input
                              type="url"
                              value={workSubmissionUrl}
                              onChange={(e) => setWorkSubmissionUrl(e.target.value)}
                              required
                              placeholder="https://drive.google.com/... or https://github.com/..."
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              onClick={() => handleSubmitWork(job.id)}
                              className="submit-btn"
                            >
                              <Upload size={18} /> Submit Work
                            </button>
                            <button
                              onClick={() => setSelectedJobForWork(null)}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedJobForWork(job.id)}
                          className="submit-work-btn"
                        >
                          <Upload size={18} /> Submit Completed Work
                        </button>
                      )}
                    </div>
                  )}

                  {isAccepted && job.work_submission_url && (
                    <div className="work-submitted-info">
                      <CheckCircle size={20} color="#10b981" />
                      <span>Work submitted - Waiting for approval</span>
                    </div>
                  )}
                </div>
              );
            })}
            {jobs.length === 0 && <p className="no-items">No jobs available</p>}
          </div>
        </div>
      )}
    </div>
  );
};
