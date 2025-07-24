import React from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, children }) => {
  // Don't render anything if the modal is not open
  if (!isOpen) {
    return null;
  }

  // Use React Portal to render the modal at the root of the document body.
  // This helps to avoid z-index and styling issues with parent components.
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      // Close the modal when the backdrop is clicked
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        // Prevent clicks inside the modal from closing it
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg relative"
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* The content of the modal is passed as children */}
        <div className="p-6 sm:p-8">
            {children}
        </div>
      </div>
    </div>,
    document.body // The modal will be appended to the document body
  );
};

export default Modal;
