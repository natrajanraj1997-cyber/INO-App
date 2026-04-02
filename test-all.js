const BASE_URL = 'http://localhost:3000';

async function testImage() {
    console.log('\n🖼️ TESTING IMAGE GENERATION...');
    try {
        // Submit job
        const res = await fetch(`${BASE_URL}/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'a beautiful sunset over mountains' })
        });
        const data = await res.json();
        console.log('Submit response:', data);
        
        if (data.jobId) {
            console.log('✓ Image job submitted successfully');
            console.log('  Job ID:', data.jobId);
            return { success: true, jobId: data.jobId };
        } else {
            console.log('✗ No jobId returned');
            return { success: false, error: 'No jobId' };
        }
    } catch (e) {
        console.log('✗ Error:', e.message);
        return { success: false, error: e.message };
    }
}

async function testMusic() {
    console.log('\n🎵 TESTING MUSIC GENERATION...');
    try {
        const res = await fetch(`${BASE_URL}/generate-music`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'happy upbeat melody' })
        });
        
        console.log('Status:', res.status);
        
        if (res.status === 503) {
            console.log('⚠ Model is loading (expected on first run)');
            const data = await res.json();
            console.log('  Message:', data.message || data.error);
            return { success: true, loading: true };
        }
        
        if (res.ok) {
            const blob = await res.blob();
            console.log('✓ Music generated successfully');
            console.log('  Size:', blob.size, 'bytes');
            console.log('  Content-Type:', res.headers.get('content-type'));
            return { success: true, size: blob.size };
        } else {
            const text = await res.text();
            console.log('✗ Failed:', text.substring(0, 200));
            return { success: false, error: text };
        }
    } catch (e) {
        console.log('✗ Error:', e.message);
        return { success: false, error: e.message };
    }
}

async function testVideo() {
    console.log('\n🎬 TESTING VIDEO/CINEMATIC SCENE...');
    try {
        const res = await fetch(`${BASE_URL}/generate-video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'cyberpunk city at night with neon lights' })
        });
        
        console.log('Status:', res.status);
        
        if (res.ok) {
            const blob = await res.blob();
            console.log('✓ Cinematic scene generated successfully');
            console.log('  Size:', blob.size, 'bytes');
            console.log('  Content-Type:', res.headers.get('content-type'));
            console.log('  Scene URL header:', res.headers.get('x-scene-url') ? 'present' : 'missing');
            return { success: true, size: blob.size };
        } else {
            const text = await res.text();
            console.log('✗ Failed:', text.substring(0, 200));
            return { success: false, error: text };
        }
    } catch (e) {
        console.log('✗ Error:', e.message);
        return { success: false, error: e.message };
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════');
    console.log('  INO AI PLATFORM - API TESTS');
    console.log('═══════════════════════════════════════════');
    
    const imageResult = await testImage();
    const musicResult = await testMusic();
    const videoResult = await testVideo();
    
    console.log('\n═══════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`🖼️ Image:   ${imageResult.success ? '✓ WORKING' : '✗ FAILED'}`);
    console.log(`🎵 Music:   ${musicResult.success ? (musicResult.loading ? '⚠ MODEL LOADING (retry in 30s)' : '✓ WORKING') : '✗ FAILED'}`);
    console.log(`🎬 Video:   ${videoResult.success ? '✓ WORKING' : '✗ FAILED'}`);
    
    if (musicResult.success && musicResult.loading) {
        console.log('\n💡 Music needs 30-60s warm-up. This is normal for HF free tier.');
    }
    
    console.log('\n═══════════════════════════════════════════');
}

runTests();
