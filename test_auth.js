const SUPABASE_URL = "https://vugyakqabzksrwvrxkof.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Z3lha3FhYnprc3J3dnJ4a29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzE1MDQsImV4cCI6MjA4NTAwNzUwNH0.gydeQ9jiiBYQOjXf4FozDn1Acjv9ofxlpqnEzsojqtc";

async function testAuth() {
    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    console.log(`Sending POST to ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'kingosm2016@gmail.com',
                password: '12345678'
            })
        });
        
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response Text:", text);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testAuth();
