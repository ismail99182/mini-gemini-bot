 require('dotenv').config();

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');
const path = require('path'); // 🌟 Yeh HTML file ka rasta dhoondne ke liye hai

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ YAHAN APNI ASLI GEMINI API KEY (AIzaSy...) PASTE KAREIN
const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// 🌟 1. Yeh route aapki HTML file ko http://localhost:3000 par show karega
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Yeh route AI se baat karne ke liye hai
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Taake AI hamesha Roman Urdu mein hi jawab de
                systemInstruction: "You are a helpful AI assistant. You must ALWAYS reply in Roman Urdu (Urdu language written in Latin/English alphabet). Do not use Arabic/Urdu script, and do not reply in pure Hindi or English."
            }
        });
        
        res.json({ text: response.text });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
});
// Purane app.listen ko is tarah rehne dein ya badal lein
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
}

// 🌟 VERCEL KE LIYE YEH LINE SAB SE END MEIN ZAROORI HAI
module.exports = app;     
