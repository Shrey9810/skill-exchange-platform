import React from 'react';

const LoadingSpinner = ({ size = 'large' }) => {
  const sizeClasses = {
    small: 'h-5 w-5 border-2',
    large: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]}`}
        style={{ borderColor: '#4f46e5', borderTopColor: 'transparent' }}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
