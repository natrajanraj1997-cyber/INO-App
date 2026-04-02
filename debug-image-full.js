// Debug image status - wait for completion
const BASE_URL = 'http://localhost:3000';

async function debugImageFull() {
    // Submit
    const submitRes = await fetch(`${BASE_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'a cat' })
    });
    const { jobId } = await submitRes.json();
    console.log('Job ID:', jobId);
    
    // Poll until done
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000));
        
        const statusRes = await fetch(`${BASE_URL}/image-status/${jobId}`);
        const contentType = statusRes.headers.get('content-type') || '';
        
        console.log(`\nPoll ${i+1}: Content-Type = ${contentType}`);
        
        if (contentType.startsWith('image/')) {
            console.log('✓ GOT IMAGE!');
            const blob = await statusRes.blob();
            console.log('  Size:', blob.size, 'bytes');
            
            const fs = require('fs');
            const buffer = Buffer.from(await blob.arrayBuffer());
            fs.writeFileSync('debug-image-final.webp', buffer);
            console.log('  Saved to debug-image-final.webp');
            return;
        }
        
        const text = await statusRes.text();
        console.log('  Response:', text.substring(0, 150));
        
        try {
            const data = JSON.parse(text);
            if (data.done) {
                console.log('  Status: DONE but no image yet');
            }
        } catch (e) {
            console.log('  Not JSON - raw data length:', text.length);
        }
    }
    
    console.log('\n✗ TIMEOUT');
}

debugImageFull();
