import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
try {
  const c = fs.readFileSync('.env', 'utf-8');
  const u = c.split('\n').find(l=>l.includes('URL')).split('=')[1].trim();
  const k = c.split('\n').find(l=>l.includes('ANON_KEY')).split('=')[1].trim();
  const supabase = createClient(u,k);
  supabase.from('restaurants').select('name, category_id, categories(name)').limit(15).then(x => console.log(JSON.stringify(x.data, null, 2)));
} catch(e) {
  console.error(e);
}
