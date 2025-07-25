import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

const ChatWindow = ({ exchange, currentUser, onClose, onMessagesSeen }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);

  const otherUser = exchange.proposer._id === currentUser._id ? exchange.receiver : exchange.proposer;

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const socketURL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api', '');
    const connectionOptions = { transports: ['websocket'] };
    
    socketRef.current = io(socketURL, connectionOptions);
    const socket = socketRef.current;
    
    socket.on('connect', () => socket.emit('joinExchangeRoom', exchange._id));
    socket.on('connect_error', (err) => console.error('Socket connection error:', err.message));
    socket.on('disconnect', (reason) => console.log(`Socket disconnected. Reason: ${reason}`));

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
        // Only mark messages as seen if the exchange is still active
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

    const handleNewMessage = (receivedMessage) => {
      setMessages(prev => [...prev, receivedMessage]);
    };
    socket.on('newMessage', handleNewMessage);

    return () => {
        if(socketRef.current) {
            socketRef.current.disconnect();
        }
    };
  }, [exchange._id]); // Dependency array is correct

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (newMessage.trim() === '' || !socket || !socket.connected) {
        return;
    }

    const messageData = {
      exchangeId: exchange._id,
      senderId: currentUser._id,
      text: newMessage,
    };
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
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
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

      {/* --- MAJOR FIX: Conditionally render the input form --- */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {exchange.status === 'completed' ? (
            <div className="text-center text-gray-500 italic">
                This exchange is completed. The chat is now closed.
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
