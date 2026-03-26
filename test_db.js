import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing URL or Key");
    return;
  }
  
  const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());
  const { data, error } = await supabase.from('restaurants').select('name, category_id, categories(name, category_type, parent_id)').limit(10);
  
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  fs.writeFileSync('db_dump.json', JSON.stringify(data, null, 2));
  console.log("Dumped to db_dump.json");
}

run();
