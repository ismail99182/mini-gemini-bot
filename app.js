require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// 🌟 Safe Key Filter: Khali keys ya undefined ko nikal dega
const activeKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
].filter(key => key && key.trim() !== ""); 

// 🌟 FIX: Is variable ko yahan define karna zaroori tha taake function ise access kar sake
let currentKeyIndex = 0; 

// 1. Home Route for HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. API Chat Route
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    if (activeKeys.length === 0) {
        return res.status(500).json({ error: "No valid API Keys found in Environment Variables." });
    }

    let attempts = 0;
    while (attempts < activeKeys.length) {
        // Safe rotation index calculation
        const activeKey = activeKeys[currentKeyIndex % activeKeys.length];

        try {
            console.log(`Trying Key Index: ${currentKeyIndex % activeKeys.length}`);
            const ai = new GoogleGenAI({ apiKey: activeKey });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', 
                contents: prompt,
                config: {
                    systemInstruction: "You are a helpful AI assistant. Always detect the language of the user's prompt and reply in the EXACT same language and script. If the user writes in English, reply in English. If the user writes in Urdu script (اردو), reply in Urdu script. If the user writes in Roman Urdu (Urdu words using Latin/English alphabet), reply strictly in Roman Urdu. Maintain the same script and tone used by the user."
                }
            });
            
            const replyText = typeof response.text === 'function' ? response.text() : response.text;
            return res.json({ text: replyText }); // ⚡ Success! Reply foran chala jayega

        } catch (error) {
            console.error(`Key Index ${currentKeyIndex % activeKeys.length} failed:`, error.message);
            
            // Limit ya busy hone par agli key par jaye
            currentKeyIndex++; 
            attempts++;
            
            if (attempts < activeKeys.length) {
                console.log("Switching to next key...");
                continue;
            }
        }
    }

    res.status(429).json({ 
        error: "Sari API keys is waqt busy hain. Please 1 minute baad try karein." 
    });
});

// Local development ke liye port setup
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
