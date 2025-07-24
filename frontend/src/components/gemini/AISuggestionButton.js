import React, { useState } from 'react';
import api from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

const AISuggestionButton = ({ onSuggestions, currentSkills }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [error, setError] = useState('');

    const handleSuggest = async () => {
        if (!role) {
            setError("Please enter a role or interest to get suggestions.");
            return;
        }
        setError('');
        setIsLoading(true);
        setSuggestions([]);
        try {
            const res = await api.post('/gemini/suggest-skills', { role });
            if (res.data.suggestions) {
                const newSuggestions = res.data.suggestions.filter(
                    suggestion => !currentSkills.some(skill => skill.title.toLowerCase() === suggestion.toLowerCase())
                );
                setSuggestions(newSuggestions);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.msg || "AI suggestion failed. Please try again.";
            setError(errorMessage);
            console.error("AI suggestion failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="my-4 p-4 border border-green-200 rounded-lg bg-green-50/50">
            <label className="font-semibold text-green-800 flex items-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-800 mr-1"
                viewBox="0 0 24 24"
                fill="currentColor"
                >
                <path d="M12 2a7 7 0 00-7 7c0 2.387 1.213 4.484 3 5.74V18a1 1 0 001 1h6a1 1 0 001-1v-3.26A6.986 6.986 0 0019 9a7 7 0 00-7-7zm0 16a1 1 0 01-1-1v-1h2v1a1 1 0 01-1 1zm-1 2h2v1a1 1 0 11-2 0v-1z" />
            </svg>

                AI Skill Suggester
            </label>
            <p className="text-sm text-green-700 mb-2">
                Stuck on what to offer? Enter a role or hobby (e.g., "photographer", "data analyst") to get ideas.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Enter a role or interest..."
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSuggest} 
                    disabled={isLoading} 
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center transition-colors"
                >
                    {isLoading ? <LoadingSpinner size="small" /> : 'Get Suggestions'}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {suggestions.length > 0 && (
                <div className="mt-4">
                    <p className="font-semibold text-sm text-gray-700">Here are some suggestions:</p>
                    <ul className="list-disc list-inside text-gray-600 text-sm mt-1">
                        {suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AISuggestionButton;
