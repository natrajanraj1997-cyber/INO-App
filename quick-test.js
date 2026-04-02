const BASE_URL = 'http://localhost:3000';

async function testAll() {
    console.log('Testing all features...\n');
    
    // Test Image
    console.log('1. Testing Image Generation...');
    try {
        const res = await fetch(`${BASE_URL}/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'a cat' })
        });
        const data = await res.json();
        console.log('   Status:', res.status);
        console.log('   Response:', data);
        
        if (data.jobId) {
            // Poll for status
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await fetch(`${BASE_URL}/image-status/${data.jobId}`);
            const statusData = await statusRes.json();
            console.log('   Status check:', statusData);
        }
    } catch (e) {
        console.log('   ERROR:', e.message);
    }
    
    // Test Music
    console.log('\n2. Testing Music Generation...');
    try {
        const res = await fetch(`${BASE_URL}/generate-music`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'happy melody' })
        });
        console.log('   Status:', res.status);
        const blob = await res.blob();
        console.log('   Audio size:', blob.size, 'bytes');
    } catch (e) {
        console.log('   ERROR:', e.message);
    }
    
    // Test Video
    console.log('\n3. Testing Video/Scene Generation...');
    try {
        const res = await fetch(`${BASE_URL}/generate-video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'sunset over ocean' })
        });
        console.log('   Status:', res.status);
        const blob = await res.blob();
        console.log('   Image size:', blob.size, 'bytes');
    } catch (e) {
        console.log('   ERROR:', e.message);
    }
    
    console.log('\nDone!');
}

testAll();
