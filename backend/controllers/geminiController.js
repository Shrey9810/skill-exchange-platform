const fetch = require('node-fetch');

// --- THIS IS THE FIXED FUNCTION ---
const callGeminiAPI = async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in your .env file.");
    }

    // FIX: Updated the model name from 'gemini-pro' to 'gemini-1.5-flash'
    const model = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const payload = { 
        contents: [{ 
            parts: [{ 
                text: prompt 
            }] 
        }] 
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json(); // Use .json() to get the detailed error object
        console.error("Gemini API Error Response:", errorBody);
        throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody.error.message}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0 || !data.candidates[0].content.parts[0].text) {
        if (data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
             throw new Error("Content blocked by Gemini API due to safety settings.");
        }
        throw new Error("Invalid or empty response structure from Gemini API");
    }

    return data.candidates[0].content.parts[0].text;
};

// Generate user bio
exports.generateBio = async (req, res) => {
    const { keywords } = req.body;
    if (!keywords) {
        return res.status(400).json({ msg: "Keywords are required." });
    }

    const prompt = `Generate a short, professional, and friendly bio for a skill exchange platform profile. The bio should be 2-3 sentences long and based on these keywords: "${keywords}".`;

    try {
        const bio = await callGeminiAPI(prompt);
        res.json({ bio });
    } catch (error) {
        console.error("Gemini API Error (generateBio):", error.message);
        res.status(500).json({ msg: `Failed to generate bio from AI. Reason: ${error.message}` });
    }
};

// Suggest skills
exports.suggestSkills = async (req, res) => {
    const { role } = req.body;
    if (!role) {
        return res.status(400).json({ msg: "A role or interest is required." });
    }

    const prompt = `Based on the role/interest "${role}", suggest 3 to 5 specific skills that a person could offer on a skill exchange platform. Format the response as a simple comma-separated list ONLY. For example: Skill One, Skill Two, Skill Three. Do not add any introductory text.`;
    
    try {
        const suggestionsText = await callGeminiAPI(prompt);
        const suggestions = suggestionsText.split(',').map(s => s.trim()).filter(s => s);
        res.json({ suggestions });
    } catch (error) {
        console.error("Gemini API Error (suggestSkills):", error.message);
        res.status(500).json({ msg: `Failed to suggest skills from AI. Reason: ${error.message}` });
    }
};
