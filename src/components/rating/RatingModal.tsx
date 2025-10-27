import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './RatingModal.css';

interface RatingModalProps {
  transactionId: string;
  ratedUserId: string;
  ratedUserName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RatingModal = ({
  transactionId,
  ratedUserId,
  ratedUserName,
  onClose,
  onSuccess,
}: RatingModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ratings').insert({
        transaction_id: transactionId,
        rated_user_id: ratedUserId,
        rater_user_id: user?.id,
        rating,
        review_text: reviewText.trim() || null,
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: ratedUserId,
        type: 'rating',
        title: 'New Rating Received',
        message: `You received a ${rating}-star rating from a transaction`,
        reference_type: 'rating',
        reference_id: transactionId,
      });

      alert('Rating submitted successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      alert(error.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rating-modal-header">
          <h3>Rate {ratedUserName}</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rating-form">
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="star-button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={40}
                  fill={star <= (hoveredRating || rating) ? '#fbbf24' : 'none'}
                  stroke={star <= (hoveredRating || rating) ? '#fbbf24' : '#d1d5db'}
                />
              </button>
            ))}
          </div>

          <p className="rating-description">
            {rating === 0
              ? 'Click on stars to rate'
              : rating === 1
              ? 'Poor'
              : rating === 2
              ? 'Fair'
              : rating === 3
              ? 'Good'
              : rating === 4
              ? 'Very Good'
              : 'Excellent'}
          </p>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={4}
            className="rating-textarea"
          />

          <div className="rating-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitting}
              className="submit-button"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
