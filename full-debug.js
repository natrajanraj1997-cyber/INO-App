const BASE_URL = 'http://localhost:3000';

async function testImageFull() {
    console.log('=== IMAGE GENERATION FULL TEST ===');
    
    // Submit job
    console.log('\n1. Submitting image job...');
    const submitRes = await fetch(`${BASE_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'a beautiful cat' })
    });
    const submitData = await submitRes.json();
    console.log('   Job ID:', submitData.jobId);
    
    // Poll until done
    console.log('\n2. Polling for completion...');
    let attempts = 0;
    let maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000));
        attempts++;
        
        const statusRes = await fetch(`${BASE_URL}/image-status/${submitData.jobId}`);
        const status = await statusRes.json();
        
        console.log(`   Attempt ${attempts}: done=${status.done}, processing=${status.processing}, waiting=${status.waiting}`);
        
        if (status.done) {
            console.log('\n3. DONE! Result:');
            console.log('   Generations:', status.generations);
            if (status.generations && status.generations[0]) {
                console.log('   Image URL:', status.generations[0].img);
            }
            return status;
        }
    }
    
    console.log('\n   TIMEOUT - image took too long');
    return null;
}

async function testVideoFull() {
    console.log('\n\n=== VIDEO/CINEMATIC TEST ===');
    
    const res = await fetch(`${BASE_URL}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'sunset over ocean' })
    });
    
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    
    if (res.ok) {
        const blob = await res.blob();
        console.log('Size:', blob.size, 'bytes');
        console.log('Type:', blob.type);
        
        // Check if it's actually an image
        if (blob.type.includes('image')) {
            console.log('✓ Received image data');
        } else if (blob.type.includes('video')) {
            console.log('✓ Received video data');
        }
    } else {
        const text = await res.text();
        console.log('Error:', text);
    }
}

async function testMusicQuality() {
    console.log('\n\n=== MUSIC TEST ===');
    
    const res = await fetch(`${BASE_URL}/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'upbeat happy melody' })
    });
    
    console.log('Status:', res.status);
    if (res.ok) {
        const blob = await res.blob();
        console.log('Audio size:', blob.size, 'bytes');
        console.log('Content-Type:', res.headers.get('content-type'));
        
        // Save for manual testing
        const fs = require('fs');
        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync('test-output-music.wav', buffer);
        console.log('✓ Saved to test-output-music.wav');
    }
}

(async () => {
    try {
        await testImageFull();
        await testVideoFull();
        await testMusicQuality();
    } catch (e) {
        console.error('Test error:', e);
    }
})();
