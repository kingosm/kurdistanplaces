import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  "https://vugyakqabzksrwvrxkof.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Z3lha3FhYnprc3J3dnJ4a29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzE1MDQsImV4cCI6MjA4NTAwNzUwNH0.gydeQ9jiiBYQOjXf4FozDn1Acjv9ofxlpqnEzsojqtc"
);
async function run() {
  const { data, error } = await supabase.from('restaurants').select('*, categories(*)').limit(15);
  if (error) console.error(error);
  console.log("RESTAURANTS:");
  console.log(JSON.stringify(data.map(r => ({name: r.name, category: r.categories?.name, type: r.categories?.category_type})), null, 2));

  const { data: c } = await supabase.from('categories').select('*');
  console.log("\nCATEGORIES:");
  console.log(JSON.stringify(c.map(cc => ({name: cc.name, type: cc.category_type})), null, 2));
}
run();
