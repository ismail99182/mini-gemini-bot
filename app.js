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

// 1. Home Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Text Chat Route (Gemini 2.5 Flash)
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
        
        const replyText = response.text ? response.text : (typeof response.text === 'function' ? response.text() : '');
        res.json({ text: replyText });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 🌟 3. NEW: Image Generation Route (Imagen 3)
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        // Image data ko base64 se nikalna
        const base64Image = response.generatedImages[0].image.imageBytes;
        res.json({ image: `data:image/jpeg;base64,${base64Image}` });
    } catch (error) {
        console.error("Imagen Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Port configuration
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
