import React from 'react';
import { Link } from 'react-router-dom';
import StarDisplay from '../common/StarDisplay';

const SkillCard = ({ skill, onPropose }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out group flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex items-center mb-4">
          <img 
            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200" 
            src={skill.owner.avatar} 
            alt={skill.owner.name} 
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/EED6D3/88394A?text=U'; }}
          />
          <div className="ml-4">
            {/* --- FIX: Make the name a clickable link --- */}
            <Link to={`/user/${skill.owner.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 hover:underline">
              {skill.owner.name}
            </Link>
            <StarDisplay rating={skill.owner.avgRating} reviewCount={skill.owner.reviewCount} />
          </div>
        </div>
        
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-2">
          {skill.category}
        </span>

        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors h-14">
          {skill.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 h-16 overflow-hidden">
          {skill.description || "No description provided."}
        </p>
      </div>

      <div className="p-6 pt-0 mt-auto">
        <button 
          onClick={() => onPropose(skill)} 
          className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center"
        >
          Propose Exchange
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SkillCard;
