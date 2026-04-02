// Check what Horde returns for completed job
const BASE_URL = 'http://localhost:3000';
const HORDE_KEY = '0000000000';

async function checkHordeDirectly() {
    // Submit to Horde directly
    const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': HORDE_KEY,
            'Client-Agent': 'INO-AI:2.0:Natarajan'
        },
        body: JSON.stringify({
            prompt: 'a cat',
            params: { width: 512, height: 512, steps: 20, n: 1, sampler_name: 'k_euler_a', cfg_scale: 7 },
            models: ['Deliberate']
        })
    });
    const { id: jobId } = await submitRes.json();
    console.log('Job ID:', jobId);
    
    // Poll until done
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000));
        
        const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`);
        const status = await statusRes.json();
        
        console.log(`\nPoll ${i+1}: done=${status.done}`);
        
        if (status.done && status.generations) {
            console.log('Generations:', status.generations);
            console.log('First gen:', status.generations[0]);
            
            // Check if img is a URL or base64
            const img = status.generations[0].img;
            console.log('Img type:', typeof img);
            console.log('Img length:', img.length);
            console.log('Img starts with:', img.substring(0, 50));
            
            // If it's a URL, fetch it
            if (img.startsWith('http')) {
                console.log('✓ Img is a URL, fetching...');
                const imgRes = await fetch(img);
                const buffer = await imgRes.arrayBuffer();
                console.log('Fetched image size:', buffer.byteLength);
                
                const fs = require('fs');
                fs.writeFileSync('horde-direct.webp', Buffer.from(buffer));
                console.log('Saved to horde-direct.webp');
            } else {
                // It's base64
                console.log('✓ Img is base64, decoding...');
                const fs = require('fs');
                const buffer = Buffer.from(img, 'base64');
                console.log('Decoded size:', buffer.length);
                fs.writeFileSync('horde-base64.webp', buffer);
                console.log('Saved to horde-base64.webp');
            }
            return;
        }
    }
    
    console.log('Timeout');
}

checkHordeDirectly();
