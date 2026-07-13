app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    // 🌟 Sirf wahi keys filter hongi jo sach mein text/string hain aur empty nahi hain
    const activeKeys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4
    ].filter(key => key && key.trim() !== ""); 

    if (activeKeys.length === 0) {
        return res.status(500).json({ error: "No valid API Keys found in Environment Variables." });
    }

    let attempts = 0;
    while (attempts < activeKeys.length) {
        // Hamesha current working key uthayega, bina wajah har baar change nahi karega
        const activeKey = activeKeys[currentKeyIndex % activeKeys.length];

        try {
            const ai = new GoogleGenAI({ apiKey: activeKey });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', 
                contents: prompt,
                config: {
                    systemInstruction: "You are a helpful AI assistant. Always detect the language of the user's prompt and reply in the EXACT same language and script. If the user writes in English, reply in English. If the user writes in Urdu script (اردو), reply in Urdu script. If the user writes in Roman Urdu (Urdu words using Latin/English alphabet), reply strictly in Roman Urdu. Maintain the same script and tone used by the user."
                }
            });
            
            const replyText = typeof response.text === 'function' ? response.text() : response.text;
            return res.json({ text: replyText }); // ⚡ Success! Foran response send ho jayega

        } catch (error) {
            console.error(`Key Index ${currentKeyIndex % activeKeys.length} failed:`, error.message);
            
            // Agar limit hit ho ya server down ho, sirf tabhi agli key par switch karein
            currentKeyIndex++; 
            attempts++;
            
            if (attempts < activeKeys.length) {
                console.log("Retrying immediately with the next key...");
                continue;
            }
        }
    }

    res.status(429).json({ 
        error: "Sari API keys is waqt busy hain. Please 1 minute baad try karein." 
    });
});
