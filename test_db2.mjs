import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const tryParse = (file) => {
  if (!fs.existsSync(file)) return {};
  const envContent = fs.readFileSync(file, 'utf8');
  return envContent.split('\n').reduce((acc, line) => { 
    if (!line.includes('=')) return acc;
    const [k, ...v] = line.split('='); 
    if (k && v) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, ''); 
    return acc; 
  }, {});
}

const env = { ...tryParse('.env'), ...tryParse('.env.local') };

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching data from", supabaseUrl);
  const { data, error } = await supabase.from('restaurants').select('name, category_id, categories(name, category_type)').limit(15);
  console.log("RESTAURANTS:");
  console.log(JSON.stringify(data, null, 2));

  const { data: cats, error: err2 } = await supabase.from('categories').select('*');
  console.log("CATEGORIES TABLE:");
  console.log(JSON.stringify(cats, null, 2));
}

run();
