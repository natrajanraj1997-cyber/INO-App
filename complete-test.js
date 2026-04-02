const BASE_URL = 'http://localhost:3000';
const fs = require('fs');

async function testImageToCompletion() {
    console.log('=== TESTING IMAGE TO COMPLETION ===\n');
    
    // Submit
    const submitRes = await fetch(`${BASE_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'a cat' })
    });
    const { jobId } = await submitRes.json();
    console.log('Job ID:', jobId);
    
    // Poll for up to 2 minutes
    for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 3000));
        
        const statusRes = await fetch(`${BASE_URL}/image-status/${jobId}`);
        const contentType = statusRes.headers.get('content-type') || '';
        
        if (contentType.startsWith('image/')) {
            // Done! Got image
            const blob = await statusRes.blob();
            const buffer = Buffer.from(await blob.arrayBuffer());
            fs.writeFileSync('test-image-result.webp', buffer);
            console.log('✓ IMAGE COMPLETE! Size:', buffer.length, 'bytes');
            console.log('  Saved to test-image-result.webp');
            return true;
        }
        
        const data = await statusRes.json();
        console.log(`Poll ${i+1}: done=${data.done}, processing=${data.processing}, waiting=${data.waiting}, queuePos=${data.queuePosition}`);
        
        if (data.done && data.error) {
            console.log('✗ ERROR:', data.error);
            return false;
        }
    }
    
    console.log('✗ TIMEOUT');
    return false;
}

async function testMusicFile() {
    console.log('\n=== TESTING MUSIC FILE ===\n');
    
    const res = await fetch(`${BASE_URL}/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'happy melody' })
    });
    
    console.log('Status:', res.status);
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync('test-music-result.wav', buffer);
    console.log('✓ SAVED: test-music-result.wav');
    console.log('  Size:', buffer.length, 'bytes');
    console.log('  Type:', blob.type);
}

async function testVideoFile() {
    console.log('\n=== TESTING VIDEO/SCENE FILE ===\n');
    
    const res = await fetch(`${BASE_URL}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'sunset' })
    });
    
    console.log('Status:', res.status);
    const contentType = res.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    if (contentType && contentType.includes('image')) {
        fs.writeFileSync('test-video-result.jpg', buffer);
        console.log('✓ SAVED IMAGE: test-video-result.jpg');
    } else if (contentType && contentType.includes('video')) {
        fs.writeFileSync('test-video-result.mp4', buffer);
        console.log('✓ SAVED VIDEO: test-video-result.mp4');
    } else {
        fs.writeFileSync('test-video-result.bin', buffer);
        console.log('? SAVED UNKNOWN: test-video-result.bin');
    }
    console.log('  Size:', buffer.length, 'bytes');
}

(async () => {
    try {
        await testImageToCompletion();
        await testMusicFile();
        await testVideoFile();
        console.log('\n=== ALL TESTS COMPLETE ===');
    } catch (e) {
        console.error('Test error:', e);
    }
})();
