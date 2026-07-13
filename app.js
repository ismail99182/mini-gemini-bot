require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (index.html isi folder mein hai)
app.use(express.static(path.join(__dirname)));

// OpenAI Initialize (Yeh automatic process.env.OPENAI_API_KEY read karega)
const openai = new OpenAI();

// 1. Home Route (index.html serve karne ke liye)
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
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', 
            messages: [
                {
                    role: 'system',
                    content: "You are a helpful AI assistant. Always detect the language of the user's prompt and reply in the EXACT same language and script. If the user writes in English, reply in English. If the user writes in Urdu script (اردو), reply in Urdu script. If the user writes in Roman Urdu (Urdu words using Latin/English alphabet), reply strictly in Roman Urdu. Maintain the same script and tone used by the user."
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
        
        const replyText = response.choices[0].message.content;
        res.json({ text: replyText });

    } catch (error) {
        console.error("OpenAI Backend Error:", error);
        
        if (error.status === 429) {
            return res.status(429).json({ error: "OpenAI API limit exceeded or insufficient credits. Please check your billing dashboard." });
        }
        
        res.status(500).json({ error: error.message });
    }
});

// Local development ke liye port setup
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
