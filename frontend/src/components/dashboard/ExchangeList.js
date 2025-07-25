import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // --- FIX: Import Link ---
import api from '../../api';
import useAuth from '../../hooks/useAuth';

const TabBadge = ({ count }) => {
    if (!count || count === 0) return null;
    return <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2">{count > 9 ? '9+' : count}</span>;
};

const ChatNotificationDot = () => (
    <span className="h-2.5 w-2.5 rounded-full bg-red-500" title="New message"></span>
);

const ExchangeList = ({ exchanges, currentUser, onSelectExchange, onUpdateExchange, onRateUser }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const { notifications, fetchNotifications } = useAuth();

  useEffect(() => {
    if (activeTab === 'pending' && notifications.newProposalsCount > 0) {
      const markSeen = async () => {
        try {
          await api.put('/exchanges/notifications/seen', { type: 'proposals' });
          fetchNotifications();
        } catch (error) { console.error("Failed to mark proposals as seen", error); }
      };
      markSeen();
    }
  }, [activeTab, notifications.newProposalsCount, fetchNotifications]);

  const handleStatusUpdate = async (exchangeId, status) => {
    try {
      const res = await api.put(`/exchanges/${exchangeId}/status`, { status });
      onUpdateExchange(res.data);
    } catch (error) {
      alert(`Error: Could not update the exchange status.`);
    }
  };
  
  const handleComplete = async (exchangeId) => {
    try {
        const res = await api.put(`/exchanges/${exchangeId}/complete`);
        onUpdateExchange(res.data);
    } catch (error) {
        alert("Error: Could not mark the exchange as complete.");
    }
  };

  const unreadMessagesCount = useMemo(() => {
    return exchanges.reduce((count, ex) => {
      const isProposer = ex.proposer._id === currentUser._id;
      const hasUserCompleted = isProposer ? ex.proposerCompleted : ex.receiverCompleted;

      if (
        ex.status === 'active' &&
        !hasUserCompleted &&
        ex.lastMessageSender !== currentUser._id &&
        new Date(ex.lastMessageTimestamp) > new Date(isProposer ? ex.lastSeenByProposer : ex.lastSeenByReceiver)
      ) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [exchanges, currentUser]);

  const renderExchanges = (status) => {
    const filteredExchanges = exchanges.filter(ex => ex.status === status);

    if (filteredExchanges.length === 0) {
      return <p className="text-gray-500 italic mt-6 text-center">No exchanges in this category.</p>;
    }

    return filteredExchanges.map(ex => {
      const otherUser = ex.proposer._id === currentUser._id ? ex.receiver : ex.proposer;
      const isProposer = ex.proposer._id === currentUser._id;
      const isReceiver = ex.receiver._id === currentUser._id;
      const hasUserCompleted = isProposer ? ex.proposerCompleted : ex.receiverCompleted;
      const hasUserRated = isProposer ? ex.proposerRated : ex.receiverRated;
      
      const hasUnreadMessages = status === 'active' && 
                                !hasUserCompleted &&
                                ex.lastMessageSender !== currentUser._id && 
                                new Date(ex.lastMessageTimestamp) > new Date(isProposer ? ex.lastSeenByProposer : ex.lastSeenByReceiver);

      return (
        <div key={ex._id} onClick={() => onSelectExchange(ex)} className="bg-white p-4 my-2 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-transparent hover:border-indigo-500 hover:bg-indigo-50/50">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center">
              <img src={otherUser.avatar} alt={otherUser.name} className="w-12 h-12 rounded-full mr-4" />
              <div>
                <div className="flex items-center gap-2">
                  {hasUnreadMessages && <ChatNotificationDot />}
                  {/* --- MAJOR FIX: Wrap the user's name in a Link component --- */}
                  <Link 
                    to={`/user/${otherUser._id}`} 
                    className="font-bold text-gray-800 hover:text-indigo-600 transition-colors hover:underline"
                    onClick={(e) => e.stopPropagation()} // This is crucial to prevent the chat from opening
                  >
                    {otherUser.name}
                  </Link>
                </div>
                <p className="text-sm text-gray-600">You offer: <span className="font-medium">{isReceiver ? ex.receiverSkill.title : ex.proposerSkill.title}</span></p>
                <p className="text-sm text-gray-600">You get: <span className="font-medium">{isReceiver ? ex.proposerSkill.title : ex.receiverSkill.title}</span></p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {status === 'pending' && isReceiver && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ex._id, 'active'); }} className="px-3 py-1 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors">Accept</button>
                  <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ex._id, 'declined'); }} className="px-3 py-1 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Decline</button>
                </>
              )}
              {status === 'active' && (
                hasUserCompleted ? (
                  <span className="text-sm text-gray-500 italic px-3 py-1">Waiting for other user...</span>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); handleComplete(ex._id); }} className="px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">Mark as Complete</button>
                )
              )}
              {status === 'completed' && !hasUserRated && (
                 <button onClick={(e) => { e.stopPropagation(); onRateUser(ex); }} className="px-3 py-1 text-sm font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600">Rate {otherUser.name}</button>
              )}
                {status === 'completed' && hasUserRated && (
                   <span className="text-sm text-green-600 italic px-3 py-1">✓ Rated</span>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button onClick={() => setActiveTab('pending')} className={`${activeTab === 'pending' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Pending <TabBadge count={notifications.newProposalsCount} />
          </button>
          <button onClick={() => setActiveTab('active')} className={`${activeTab === 'active' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Active <TabBadge count={unreadMessagesCount} />
          </button>
          <button onClick={() => setActiveTab('completed')} className={`${activeTab === 'completed' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Completed
          </button>
        </nav>
      </div>
      <div className="mt-4">{renderExchanges(activeTab)}</div>
    </div>
  );
};

export default ExchangeList;
