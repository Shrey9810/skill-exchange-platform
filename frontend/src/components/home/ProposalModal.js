import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

const ProposalModal = ({ skill, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mySkills = user?.skillsOffered || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      setError('Please select a skill you want to offer.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const proposerSkill = mySkills.find(s => s._id === selectedSkillId);

    const proposalData = {
      receiverId: skill.owner.id,
      proposerSkill: {
        id: proposerSkill._id,
        title: proposerSkill.title,
        category: proposerSkill.category,
      },
      receiverSkill: {
        id: skill.id,
        title: skill.title,
        category: skill.category,
      },
      // The message will be the first in the chat history, handled by backend/socket
    };

    try {
      // For now, we just create the exchange. Chat can be added.
      await api.post('/exchanges', proposalData);
      setSuccess(true);
    } catch (err) {
      setError('Failed to send proposal. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Proposal Sent!</h3>
          <p className="text-gray-600 mb-6">
            Your proposal has been sent to {skill.owner.name}. You can track its status on your dashboard.
          </p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Propose an Exchange</h2>
        <p className="text-gray-600 mb-6">
          You are requesting <span className="font-semibold text-indigo-600">{skill.title}</span> from <span className="font-semibold">{skill.owner.name}</span>.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="skillOffer" className="block text-sm font-medium text-gray-700 mb-1">What skill will you offer in return?</label>
            <select
              id="skillOffer"
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="" disabled>Select one of your skills</option>
              {mySkills.length > 0 ? (
                mySkills.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)
              ) : (
                <option disabled>You have no skills to offer. Please add one in your profile.</option>
              )}
            </select>
          </div>
          {/* Message functionality can be added here if desired, but for now it's handled in chat */}
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button 
            type="submit" 
            disabled={isSubmitting || mySkills.length === 0} 
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isSubmitting ? <LoadingSpinner size="small" /> : 'Send Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProposalModal;
