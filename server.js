require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
// Increase JSON body limit for base64 image uploads (up to 10MB)
app.use(express.json({ limit: '10mb' }));

// Serve frontend — access at: http://localhost:3000
app.use(express.static(path.join(__dirname)));

// Silence favicon 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const HORDE_KEY    = '0000000000'; // anonymous Stable Horde key (free, no signup)
const HORDE_AGENT  = 'INO-AI:2.0:Natarajan';
const HORDE_PARAMS = {
    width: 512, height: 512,
    steps: 20, n: 1,
    sampler_name: 'k_euler_a',
    cfg_scale: 7
};

async function submitHordeJob(prompt, sourceImageBase64 = null) {
    const body = {
        prompt,
        params: { ...HORDE_PARAMS },
        models: ['Deliberate'],    // fast, reliable, high quality
        censor_nsfw: false,
        trusted_workers: false,
        slow_workers: true         // use more workers = shorter queue
    };

    if (sourceImageBase64) {
        body.source_image       = sourceImageBase64.replace(/^data:image\/\w+;base64,/, '');
        body.source_processing  = 'img2img';
        body.params.denoising_strength = 0.65;
    }

    const res = await fetch('https://stablehorde.net/api/v2/generate/async', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': HORDE_KEY,
            'Client-Agent': HORDE_AGENT
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Horde submit failed (${res.status}): ${err.slice(0, 200)}`);
    }
    return res.json(); // { id: "..." }
}

// ─────────────────────────────────────────────
//  1. CHAT — Google Gemini 1.5 Pro (Highest Tier)
// ─────────────────────────────────────────────
app.post('/ask-ino', async (req, res) => {
    try {
        const userHistory = req.body.messages || [];
        const systemInstruction = `You are INO, an exclusive high-level AI assistant engineered by Natarajan. He works as a web developer and is like a father to you. If anyone asks for his Instagram, reply with: [@_k_i_l_l_e_r_b_o_y__](https://www.instagram.com/_k_i_l_l_e_r_b_o_y__?igsh=MXg0cnc2Z3FrZDVmdA%3D%3D&utm_source=qr). You are a world-class copywriter, coder, and grammar expert. If the user asks you to fix text, make it sound highly professional. Whenever relevant, provide helpful markdown links to real websites. Give clear, highly practical answers.`;

        // Map OpenAI-style history formats to Gemini's strict structural requirement
        const contents = userHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }]
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: systemInstruction } },
                contents: contents,
                generationConfig: { temperature: 0.7 }
            })
        });

        const data = await response.json();
        
        // Handle Gemini API specific errors securely
        if (data.error) {
            console.error('[GEMINI API ERROR]', data.error);
            return res.status(500).json({ error: "Failed to connect to INO's Gemini brain." });
        }

        // We wrap the Gemini response inside an OpenAI-style shape 
        // to maintain 100% backwards compatibility with the frontend UI codebase!
        const openaiFormattedData = {
            choices: [{
                message: {
                    content: data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble analyzing that request at the moment."
                }
            }]
        };

        res.json(openaiFormattedData);
    } catch (error) {
        console.error('[CHAT ERROR]', error);
        res.status(500).json({ error: "Failed to connect to INO's chat brain." });
    }
});

// ─────────────────────────────────────────────
//  2. IMAGE GENERATE — Stable Horde (free, no key)
//  Returns { jobId } — client polls /image-status/:id
// ─────────────────────────────────────────────
app.post('/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required.' });

        const job = await submitHordeJob(prompt);
        res.json({ jobId: job.id });
    } catch (error) {
        console.error('[IMAGE ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────
//  3. IMAGE EDIT — img2img via Stable Horde
//  Returns { jobId } — client polls /image-status/:id
// ─────────────────────────────────────────────
app.post('/edit-image', async (req, res) => {
    try {
        const { prompt, imageBase64 } = req.body;
        if (!prompt || !imageBase64) return res.status(400).json({ error: 'Prompt and image required.' });

        const job = await submitHordeJob(prompt, imageBase64);
        res.json({ jobId: job.id });
    } catch (error) {
        console.error('[EDIT ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────
//  4. IMAGE STATUS — Poll Stable Horde job
//  Returns JSON status while pending,
//  returns image/webp when done
// ─────────────────────────────────────────────
app.get('/image-status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;

        const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${jobId}`, {
            headers: { 'apikey': HORDE_KEY, 'Client-Agent': HORDE_AGENT },
            signal: AbortSignal.timeout(60000)
        });

        if (!checkRes.ok) {
            const e = await checkRes.text();
            return res.status(checkRes.status).json({ error: 'Status check failed.', details: e });
        }

        const status = await checkRes.json();

        if (!status.done) {
            return res.json({
                done: false,
                processing: status.processing,
                waiting: status.waiting,
                queuePosition: status.queue_position,
                waitTime: status.wait_time,    // seconds
                kudos: status.kudos_details
            });
        }

        // Job done — fetch the actual image
        const resultRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`, {
            headers: { 'apikey': HORDE_KEY, 'Client-Agent': HORDE_AGENT },
            signal: AbortSignal.timeout(60000)
        });
        const result = await resultRes.json();

        if (!result.generations || result.generations.length === 0) {
            return res.status(502).json({ error: 'No image was generated. Try again.' });
        }

        // Stable Horde returns URL in result.generations[0].img
        const imgUrl = result.generations[0].img;
        
        // Fetch the actual image from the URL
        const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(60000) });
        if (!imgRes.ok) {
            throw new Error(`Failed to fetch image: ${imgRes.status}`);
        }
        
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        res.set('Content-Type', 'image/webp');
        res.set('Cache-Control', 'no-store');
        res.send(buffer);

    } catch (error) {
        console.error('[STATUS ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────
//  5. CODE — Groq llama-3.3-70b (powerful)
// ─────────────────────────────────────────────
app.post('/generate-code', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required.' });

        const systemPrompt = `You are INO Code, an elite senior software engineer. Produce clean, production-ready, well-commented code. Always wrap code in a fenced markdown code block with the correct language tag. Language: ${language || 'auto-detect'}.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 4096
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            res.json({ code: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: 'No code generated.', details: data });
        }
    } catch (error) {
        console.error('[CODE ERROR]', error);
        res.status(500).json({ error: 'Failed to generate code.' });
    }
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════╗
║     INO AI PLATFORM — Backend v3.1       ║
║     Running on http://localhost:${PORT}     ║
║                                           ║
║  POST /ask-ino           Chat (Groq)      ║
║  POST /generate-image    Image (Horde)   ║
║  GET  /image-status/:id  Poll status     ║
║  POST /edit-image        Edit (img2img)  ║
║  POST /generate-code     Code (Groq 70B) ║
╚═══════════════════════════════════════════╝
    `);
});