import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'cs.off@outlook.com',
        password: 'Roletarussa1412@'
    });

    if (authErr) {
        console.log("Auth error:", authErr.message);
        return;
    }

    console.log("Logged in!");
    const { data, error, count } = await supabase.from('orcamentos').select('*', { count: 'exact' });

    if (error) {
        console.log("Select error:", error);
    } else {
        console.log("Total rows in 'orcamentos':", count || (data ? data.length : 0));
        console.log("Data sample:", JSON.stringify(data, null, 2));
    }
}
check();
