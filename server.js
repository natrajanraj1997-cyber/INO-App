require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // This allows your HTML file to talk to this server
app.use(express.json());

// This is the secure bridge to Groq
app.post('/ask-ino', async (req, res) => {
    try {
        // We receive the whole conversation history from your frontend
        const userHistory = req.body.messages; 
        
        // We inject INO's personality at the very top, then attach the history
        const fullConversation = [
            { role: "system", content: "You are INO, an exclusive AI assistant engineered by Natarajan. He works as a web developer and is like a father to you. If anyone asks for his Instagram, reply with: [@_k_i_l_l_e_r_b_o_y__](https://www.instagram.com/_k_i_l_l_e_r_b_o_y__?igsh=MXg0cnc2Z3FrZDVmdA%3D%3D&utm_source=qr). You are a world-class copywriter and grammar expert. If the user asks you to fix text, make it sound highly professional. Whenever relevant, provide helpful markdown links to real websites. IF the user asks to see an image or picture, you MUST reply with this exact markdown format to generate it: `![description](https://image.pollinations.ai/prompt/{description_with_no_spaces})`. Example: for a flying car, output `![flying car](https://image.pollinations.ai/prompt/flying%20car)`. Give clear, highly practical answers." },
            ...userHistory 
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: fullConversation, // We send the whole array to Groq
                temperature: 0.7
            })
        });

        const data = await response.json();
        res.json(data); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to connect to INO's brain." });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`INO Backend is running securely on port ${PORT}!`);
});