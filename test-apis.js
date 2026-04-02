const HF_API_KEY = 'YOUR_HF_API_KEY';
const HORDE_KEY = '0000000000';

async function testMusicAPI() {
    console.log('\n🎵 TESTING MUSIC API...');
    try {
        const res = await fetch('https://api-inference.huggingface.co/models/facebook/musicgen-small', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: 'happy upbeat melody' })
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 200));
    } catch (e) {
        console.error('Music Error:', e.message);
    }
}

async function testHordeAPI() {
    console.log('\n🖼️ TESTING HORDE IMAGE API...');
    try {
        const res = await fetch('https://stablehorde.net/api/v2/generate/async', {
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
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Horde Error:', e.message);
    }
}

async function testVideoAPI() {
    console.log('\n🎬 TESTING VIDEO POLLINATIONS...');
    const url = 'https://video.pollinations.ai/test%20prompt?width=1280&height=720&seed=123&nologo=true';
    console.log('Video URL:', url);
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
    } catch (e) {
        console.error('Video Error:', e.message);
    }
}

(async () => {
    await testHordeAPI();
    await testMusicAPI();
    await testVideoAPI();
})();
