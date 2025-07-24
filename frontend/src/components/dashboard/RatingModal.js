import React, { useState } from 'react';
import api from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

const Star = ({ filled, onClick }) => (
  <svg onClick={onClick} className={`w-8 h-8 cursor-pointer ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const RatingModal = ({ exchange, currentUser, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otherUser = exchange.proposer._id === currentUser._id ? exchange.receiver : exchange.proposer;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating by clicking on a star.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.post('/profile/review', {
        exchangeId: exchange._id,
        ratedUserId: otherUser._id,
        rating,
        comment,
      });
      const updatedExchangeRes = await api.get(`/exchanges/${exchange._id}`);
      onClose(updatedExchangeRes.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit review.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button onClick={() => onClose(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Your Exchange with {otherUser.name}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} filled={star <= rating} onClick={() => setRating(star)} />
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Add a comment (optional)</label>
            <textarea
              id="comment"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience?"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center">
            {loading ? <LoadingSpinner size="small" /> : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
