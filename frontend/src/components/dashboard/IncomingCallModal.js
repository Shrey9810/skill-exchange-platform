import React from 'react';

const IncomingCallModal = ({ caller, onAccept, onDecline }) => {
  if (!caller) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all animate-in fade-in zoom-in-95">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Incoming Call</h2>
        <div className="flex items-center justify-center my-6">
          <img src={caller.avatar} alt={caller.name} className="w-20 h-20 rounded-full ring-4 ring-indigo-300" />
        </div>
        <p className="text-lg text-gray-700 mb-8">
          <span className="font-semibold">{caller.name}</span> is calling you.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onDecline}
            className="px-8 py-3 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="px-8 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
