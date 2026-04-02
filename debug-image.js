// Debug image status endpoint
const BASE_URL = 'http://localhost:3000';

async function debugImage() {
    // Submit
    const submitRes = await fetch(`${BASE_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'a cat' })
    });
    const { jobId } = await submitRes.json();
    console.log('Job ID:', jobId);
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 5000));
    
    // Check status with full debug
    const statusRes = await fetch(`${BASE_URL}/image-status/${jobId}`);
    console.log('Status:', statusRes.status);
    console.log('Content-Type:', statusRes.headers.get('content-type'));
    
    const text = await statusRes.text();
    console.log('Response length:', text.length);
    console.log('Response preview:', text.substring(0, 200));
    
    // Try to parse as JSON
    try {
        const data = JSON.parse(text);
        console.log('JSON parsed:', data);
    } catch (e) {
        console.log('Not JSON - might be binary image data');
        console.log('First 100 chars (as bytes):', text.slice(0, 100).split('').map(c => c.charCodeAt(0)));
    }
}

debugImage();
