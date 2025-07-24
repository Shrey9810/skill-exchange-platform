import React from 'react';

const StarDisplay = ({ rating = 0, reviewCount }) => {
  // Create a unique ID for the gradient to avoid conflicts if multiple StarDisplays are on the page
  const gradientId = `starGradient-${React.useId()}`;
  
  // Calculate the percentage for the last partial star
  const partialPercentage = (rating % 1) * 100;

  return (
    <div className="flex items-center">
      {/* Define the SVG gradient that will be used for the partial star */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={gradientId}>
            <stop offset={`${partialPercentage}%`} stopColor="#facc15" /> {/* yellow-400 */}
            <stop offset={`${partialPercentage}%`} stopColor="#e5e7eb" /> {/* gray-200 */}
          </linearGradient>
        </defs>
      </svg>
      
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        let fill = '#e5e7eb'; // Default empty star color (gray-200)

        if (starValue <= rating) {
          fill = '#facc15'; // Full star color (yellow-400)
        } else if (starValue === Math.ceil(rating) && partialPercentage > 0) {
          fill = `url(#${gradientId})`; // Use the gradient for the partial star
        }

        return (
          <svg key={index} className="w-5 h-5" fill={fill} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
      
      {reviewCount !== undefined && <span className="text-gray-500 text-sm ml-2">({reviewCount} reviews)</span>}
    </div>
  );
};

export default StarDisplay;
