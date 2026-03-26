import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSignIn() {
    console.log(`Connecting to: ${SUPABASE_URL}`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'kingosm2016@gmail.com',
        password: '12345678'
    });
    
    if (error) {
        console.error("Sign in failed:", error.message);
    } else {
        console.log("Sign in successful! User ID:", data.user?.id);
    }
}

testSignIn();
