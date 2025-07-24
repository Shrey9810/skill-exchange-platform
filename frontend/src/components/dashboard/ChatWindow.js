import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

// Connect to the backend socket server
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

const ChatWindow = ({ exchange, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const otherUser = exchange.proposer._id === currentUser._id ? exchange.receiver : exchange.proposer;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/exchanges/${exchange._id}`);
        setMessages(res.data.messages);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    socket.emit('joinExchangeRoom', exchange._id);

    // This listener now handles messages from the other user
    socket.on('newMessage', (message) => {
      // Add the received message to the state
      setMessages(prevMessages => [...prevMessages, message]);
    });

    return () => {
      socket.off('newMessage');
    };
  }, [exchange._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      exchangeId: exchange._id,
      senderId: currentUser._id,
      text: newMessage,
    };

    // --- FIX ---
    // 1. We add the message to our own screen immediately.
    // The backend change ensures we don't receive it back again.
    const ownMessage = {
        _id: Date.now(), // temporary client-side ID
        sender: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
        text: newMessage,
        timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, ownMessage]);

    // 2. Emit the message to the server for the other user.
    socket.emit('sendMessage', messageData);
    
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center">
            <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full mr-3" />
            <span className="font-bold text-gray-800">{otherUser.name}</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="p-4 border-t border-gray-200 bg-white">
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
            {/* --- FIX --- Rotated the icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
