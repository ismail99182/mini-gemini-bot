require('dotenv').config();

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');
const path = require('path'); 

const app = express();
app.use(cors());
app.use(express.json());

// Serving static files (Safe for Vercel)
app.use(express.static(path.join(__dirname)));

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// 🌟 Default route for serving the interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🤖 Chat route configuration
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required!" });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful AI assistant named Nexus Gemini. You must ALWAYS reply in Roman Urdu (Urdu language written in Latin/English alphabet). Do not use Arabic/Urdu script, and do not reply in pure Hindi or English. Keep responses formatting clean."
            }
        });
        
        res.json({ text: response.text });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 🌟 Local server active check (Universal Port Management)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// VERCEL SPECIFIC EXPORT
module.exports = app;
