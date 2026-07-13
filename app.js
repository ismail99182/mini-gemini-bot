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

// 🌟 Sabhi API keys ko ek array mein load kar rahe hain
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
].filter(key => key); // filter karne se sirf wahi keys array mein aayengi jo .env / Vercel mein configured hain

let currentKeyIndex = 0; // Yeh track karega ke abhi kaunsi key use ho rahi hai

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

    if (API_KEYS.length === 0) {
        return res.status(500).json({ error: "No API Keys found in Environment Variables." });
    }

    let attempts = 0;
    const maxAttempts = API_KEYS.length;

    // Jab tak available keys hain, tab tak try karega agar error aaye
    while (attempts < maxAttempts) {
        const activeKey = API_KEYS[currentKeyIndex];
        
        // Agli request ke liye index update kar rahe hain (Round-robin rotation)
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        attempts++;

        try {
            // Har request ke liye active key ke sath SDK initialize karein
            const ai = new GoogleGenAI({ apiKey: activeKey });

            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash', // Muft chalane ke liye sab se behtareen aur high limit wala model
                contents: prompt,
                config: {
                    systemInstruction: "You are a helpful AI assistant. Always detect the language of the user's prompt and reply in the EXACT same language and script. If the user writes in English, reply in English. If the user writes in Urdu script (اردو), reply in Urdu script. If the user writes in Roman Urdu (Urdu words using Latin/English alphabet), reply strictly in Roman Urdu. Maintain the same script and tone used by the user."
                }
            });
            
            // Response se text extract karne ke liye
            const replyText = typeof response.text === 'function' ? response.text() : response.text;
            
            // Success hone par yahin se response send ho jayega
            return res.json({ text: replyText });

        } catch (error) {
            console.error(`Error with API Key Index ${currentKeyIndex}:`, error.message);
            
            // Agar Rate Limit (429) ya Server Unavailable (503) error aaye to agli key try karein
            if (error.status === 429 || error.status === 503 || error.message.includes('429') || error.message.includes('503')) {
                console.log("Switching to next API Key due to limits/busy server...");
                continue; // Loop ko agle iteration par le jaye jahan agli key use hogi
            }
            
            // Kisi aur kism ka crash error ho to direct user ko bata do
            return res.status(500).json({ error: error.message });
        }
    }

    // Agar saari keys check karne ke baad bhi fail ho jaye
    res.status(429).json({ 
        error: "Saari API keys ki limits is waqt temporary khatam ho chuki hain. Please thodi dair baad dobara koshish karein." 
    });
});

// Local development ke liye port setup
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
