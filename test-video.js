// Test video APIs
async function testPollinationsVideo() {
    console.log('\n🎬 TESTING POLLINATIONS VIDEO...');
    // Try different endpoint formats
    const endpoints = [
        'https://video.pollinations.ai/prompt/a%20sunset?width=1280&height=720&seed=123',
        'https://image.pollinations.ai/prompt/a%20sunset?width=1280&height=720&seed=123&nologo=true',
        'https://text.pollinations.ai/Hello%20world'
    ];
    
    for (const url of endpoints) {
        try {
            console.log(`Trying: ${url}`);
            const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
            console.log(`  Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
        } catch (e) {
            console.log(`  Error: ${e.message}`);
        }
    }
}

async function testHFRouter() {
    console.log('\n🎵 TESTING HF ROUTER...');
    const HF_API_KEY = 'YOUR_HF_API_KEY';
    try {
        const res = await fetch('https://router.huggingface.co/hf-inference/models/facebook/musicgen-small', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: 'happy melody' })
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 300));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

(async () => {
    await testPollinationsVideo();
    await testHFRouter();
})();
