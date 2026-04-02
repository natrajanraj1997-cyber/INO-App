const fetch = require('node-fetch');

async function testPollinations() {
    console.log('Testing Pollinations...');
    try {
        const prompt = 'sunset over ocean';
        const encoded = encodeURIComponent(`${prompt}, cinematic shot, film still, professional cinematography, dramatic lighting, 8k quality, movie scene`);
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${Date.now()}&nologo=true&enhance=true`;
        
        console.log('URL:', url.substring(0, 100) + '...');
        
        const res = await fetch(url, { timeout: 30000 });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        
        if (res.ok) {
            const buffer = await res.arrayBuffer();
            console.log('Image size:', buffer.byteLength, 'bytes');
        } else {
            const text = await res.text();
            console.log('Error response:', text.substring(0, 200));
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testPollinations();
