import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xczkmbxikrtbmnymwrdj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function revertDB() {
    console.log("Reverting CMS content back to Kurdistan Places...");
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) {
        console.error("Error fetching:", error);
        return;
    }
    
    let updatedCount = 0;
    for (const row of data) {
        if (typeof row.value === 'string') {
            let newValue = row.value;
            if (newValue.includes('KurdTrip')) {
                // Return to title case mostly, but maybe we can just do a flat replace
                newValue = newValue.replace(/KurdTrip/g, 'Kurdistan Places');
            }
            if (newValue.includes('KURDTRIP')) {
                newValue = newValue.replace(/KURDTRIP/g, 'KURDISTAN PLACES');
            }
            if (newValue !== row.value) {
                console.log(`Reverting key [${row.key}] from:\n"${row.value}"\nto:\n"${newValue}"`);
                await supabase.from('site_content').update({ value: newValue }).eq('id', row.id);
                updatedCount++;
            }
        }
    }
    
    // Also explicitly reset the logo DB keys just in case a fallback tries to use them
    await supabase.from('site_content').update({ value: 'KURDISTAN' }).eq('key', 'header.logo.main');
    await supabase.from('site_content').update({ value: 'PLACES' }).eq('key', 'header.logo.accent');
    
    console.log(`Finished reverting! Updated ${updatedCount} rows from KurdTrip -> Kurdistan Places.`);
}

revertDB();
