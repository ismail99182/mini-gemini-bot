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

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                // 🌟 FIX: System instruction ko update kiya taake language dynamically detect ho sake
                systemInstruction: "You are a helpful AI assistant. Always detect the language of the user's prompt and reply in the EXACT same language and script. If the user writes in English, reply in English. If the user writes in Urdu script (اردو), reply in Urdu script. If the user writes in Roman Urdu (Urdu words using Latin/English alphabet), reply strictly in Roman Urdu. Maintain the same script and tone used by the user."
            }
        });
        
        // Response se text extract karne ke liye
        const replyText = typeof response.text === 'function' ? response.text() : response.text;
        
        res.json({ text: replyText });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Local development ke liye port setup
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
