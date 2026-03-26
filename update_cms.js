import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateCMS() {
    console.log(`Updating CMS at ${SUPABASE_URL}`);
    
    // Update main logo text
    const { error: err1 } = await supabase
        .from('site_content')
        .update({ value: 'Kurd' })
        .eq('key', 'header.logo.main');
        
    // Update accent logo text
    const { error: err2 } = await supabase
        .from('site_content')
        .update({ value: 'Trip' })
        .eq('key', 'header.logo.accent');

    // Also update any 'Kurdistan Places' strings
    const { data: rows, error: err3 } = await supabase
        .from('site_content')
        .select('*');

    if (rows) {
        for (const row of rows) {
            if (row.value && row.value.includes('Kurdistan Places')) {
                const newValue = row.value.replace(/Kurdistan Places/g, 'KurdTrip');
                await supabase
                    .from('site_content')
                    .update({ value: newValue })
                    .eq('id', row.id);
            }
            if (row.value && row.value.includes('KURDISTAN PLACES')) {
                const newValue = row.value.replace(/KURDISTAN PLACES/g, 'KurdTrip');
                await supabase
                    .from('site_content')
                    .update({ value: newValue })
                    .eq('id', row.id);
            }
        }
    }
        
    console.log("CMS Update completed!");
}

updateCMS();
