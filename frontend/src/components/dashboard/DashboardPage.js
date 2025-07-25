import React, { useState, useEffect } from 'react';
import api from '../../api';
import useAuth from '../../hooks/useAuth';
import ExchangeList from './ExchangeList';
import ChatWindow from './ChatWindow';
import LoadingSpinner from '../common/LoadingSpinner';
import RatingModal from './RatingModal';

const DashboardPage = () => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [exchangeToRate, setExchangeToRate] = useState(null);
  const { user, fetchNotifications } = useAuth();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/exchanges');
        setExchanges(res.data);
        fetchNotifications();
      } catch (err) {
        setError('Failed to fetch your exchanges. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []); // Note: fetchNotifications is intentionally omitted to prevent loops

  const handleSelectExchange = (exchange) => {
    setSelectedExchange(exchange);
  };

  const handleUpdateExchange = (updatedExchange) => {
    setExchanges(prevExchanges =>
      prevExchanges.map(ex => ex._id === updatedExchange._id ? updatedExchange : ex)
    );
    if (selectedExchange && selectedExchange._id === updatedExchange._id) {
        setSelectedExchange(updatedExchange);
    }
  };
  
  // --- MAJOR FIX: This function now re-fetches all data needed ---
  const handleMessagesSeen = () => {
    // 1. Refresh the global notification counts from the auth hook
    fetchNotifications();
    // 2. Re-fetch the entire exchanges list to update the `lastSeenBy` timestamps
    //    This will cause the `unreadMessagesCount` in ExchangeList to recalculate correctly.
    api.get('/exchanges')
       .then(res => setExchanges(res.data))
       .catch(err => console.error("Failed to refresh exchanges after seen", err));
  };

  const handleOpenRatingModal = (exchange) => {
    setExchangeToRate(exchange);
    setIsRatingModalOpen(true);
  };

  const handleCloseRatingModal = (updatedExchange) => {
    if (updatedExchange) {
      handleUpdateExchange(updatedExchange);
    }
    setIsRatingModalOpen(false);
    setExchangeToRate(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Your Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ExchangeList 
              exchanges={exchanges} 
              currentUser={user}
              onSelectExchange={handleSelectExchange}
              onUpdateExchange={handleUpdateExchange}
              onRateUser={handleOpenRatingModal}
            />
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 h-[70vh] flex flex-col">
            {selectedExchange ? (
              <ChatWindow 
                key={selectedExchange._id}
                exchange={selectedExchange} 
                currentUser={user}
                onClose={() => setSelectedExchange(null)}
                // Pass the new, more complete handler to the ChatWindow
                onMessagesSeen={handleMessagesSeen}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <h3 className="text-xl font-semibold">No Conversation Selected</h3>
                <p>Select an exchange from the list to view messages.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isRatingModalOpen && (
        <RatingModal
          exchange={exchangeToRate}
          currentUser={user}
          onClose={handleCloseRatingModal}
        />
      )}
    </>
  );
};

export default DashboardPage;
