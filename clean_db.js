import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xczkmbxikrtbmnymwrdj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDB() {
    console.log("Fetching all CMS content...");
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) {
        console.error("Error fetching:", error);
        return;
    }
    
    let updatedCount = 0;
    for (const row of data) {
        if (typeof row.value === 'string') {
            let newValue = row.value;
            // Catch anything containing Kurdistan Places or KURDISTAN PLACES
            if (newValue.toLowerCase().includes('kurdistan places')) {
                // Use regex with 'i' flag to catch any case
                newValue = newValue.replace(/kurdistan places/gi, 'KurdTrip');
            }
            if (newValue !== row.value) {
                console.log(`Updating key [${row.key}] language [${row.language}] from:\n"${row.value}"\nto:\n"${newValue}"`);
                await supabase.from('site_content').update({ value: newValue }).eq('id', row.id);
                updatedCount++;
            }
        }
    }
    console.log(`Finished! Updated ${updatedCount} rows.`);
}

cleanDB();
