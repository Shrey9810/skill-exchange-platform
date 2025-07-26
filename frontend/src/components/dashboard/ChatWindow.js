import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

const VideoCallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

const ChatWindow = ({ exchange, currentUser, onClose, onMessagesSeen, onInitiateCall, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesContainerRef = useRef(null);
  const otherUser = exchange.proposer._id === currentUser._id ? exchange.receiver : exchange.proposer;

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Effect for fetching initial messages and marking them as seen
  useEffect(() => {
    const markMessagesAsSeen = async () => {
        try {
            await api.put('/exchanges/notifications/seen', { type: 'messages', exchangeId: exchange._id });
            if (onMessagesSeen) onMessagesSeen();
        } catch (error) {
            console.error("Failed to mark messages as seen", error);
        }
    };

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/exchanges/${exchange._id}`);
        setMessages(res.data.messages);
        if (exchange.status === 'active') {
            markMessagesAsSeen();
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [exchange._id, exchange.status, onMessagesSeen]);

  // *** THE DEFINITIVE FIX IS HERE ***
  // This useEffect now handles joining the room and listening for messages.
  useEffect(() => {
    if (!socket) return;

    // 1. Join the specific chat room
    socket.emit('joinExchangeRoom', exchange._id);

    // 2. Set up the listener for new messages
    const handleNewMessage = (receivedMessage) => {
      // If the incoming message from the server belongs to this chat, add it to the state.
      // This works for everyone in the room (sender and receiver).
      if (receivedMessage.exchangeId === exchange._id) {
        setMessages(prev => [...prev, receivedMessage]);
      }
    };

    socket.on('newMessage', handleNewMessage);

    // 3. Clean up the listener when the component unmounts or the chat changes
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, exchange._id]); // Dependencies are stable and correct

  // Effect for scrolling to the bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !socket || !socket.connected) {
        return;
    }

    const messageData = {
      exchangeId: exchange._id,
      senderId: currentUser._id,
      text: newMessage,
    };
    
    // Send the message and wait for the server to broadcast it back to everyone,
    // including the sender. This ensures the UI is always in sync with the database.
    socket.emit('sendMessage', messageData);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center">
            <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full mr-3" />
            <span className="font-bold text-gray-800">{otherUser.name}</span>
        </div>
        <div className="flex items-center space-x-4">
            {exchange.status === 'active' && (
                 <button onClick={() => onInitiateCall(otherUser)} className="text-gray-500 hover:text-indigo-600 transition-colors" title="Start Video Call">
                    <VideoCallIcon />
                </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-grow p-4 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={`flex items-end mb-4 ${msg.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}>
              {msg.sender._id !== currentUser._id && (
                <img src={msg.sender.avatar} alt={msg.sender.name} className="w-8 h-8 rounded-full mr-2" />
              )}
              <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${msg.sender._id === currentUser._id ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        {exchange.status !== 'active' ? (
            <div className="text-center text-gray-500 italic">
                This chat is now closed.
            </div>
        ) : (
            <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    autoComplete="off"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-3 rounded-r-full hover:bg-indigo-700 transition-colors flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
