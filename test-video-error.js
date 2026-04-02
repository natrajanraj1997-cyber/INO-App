async function testVideoError() {
    try {
        const res = await fetch('http://localhost:3000/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'sunset' })
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testVideoError();
