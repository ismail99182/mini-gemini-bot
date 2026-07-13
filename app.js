require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (Yeh Vercel par HTML, CSS direct uthane mein madad karega)
app.use(express.static(path.join(__dirname)));

const API_KEY = process.env.GEMINI_API_KEY;

// Naya SDK sahi tareeqe se init karne ke liye bina { apiKey } wrapper ke direct pass hota hai ya empty chora jata hai agar env mein GEMINI_API_KEY ho
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
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful AI assistant. You must ALWAYS reply in Roman Urdu (Urdu language written in Latin/English alphabet). Do not use Arabic/Urdu script, and do not reply in pure Hindi or English."
            }
        });
        
        // 🌟 FIX: Naye SDK mein text nikalne ke liye .text() call karna parta hai
        const replyText = response.text ? response.text : (typeof response.text === 'function' ? response.text() : '');
        
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
