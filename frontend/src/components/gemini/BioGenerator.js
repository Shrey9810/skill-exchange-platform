import React, { useState } from 'react';
import api from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

const BioGenerator = ({ onBioGenerated, currentBio }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [keywords, setKeywords] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        const promptKeywords = keywords || currentBio;
        if (!promptKeywords) {
            setError("Please provide some keywords or an existing bio to generate from.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const res = await api.post('/gemini/generate-bio', { keywords: promptKeywords });
            if (res.data.bio) {
                onBioGenerated(res.data.bio);
                setKeywords(''); // Clear input after successful generation
            }
        } catch (err) {
            const errorMessage = err.response?.data?.msg || "AI generation failed. Please try again.";
            setError(errorMessage);
            console.error("AI generation failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="my-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50/50">
            <label className="font-semibold text-indigo-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                AI Bio Assistant
            </label>
            <p className="text-sm text-indigo-700 mb-2">
                Enter keywords (e.g., "React developer, loves hiking, coffee enthusiast") to generate a new bio, or click generate to refine your current one.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Enter keywords..."
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleGenerate} 
                    disabled={isLoading} 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center transition-colors"
                >
                    {isLoading ? <LoadingSpinner size="small" /> : 'Generate Bio'}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
    );
};

export default BioGenerator;
