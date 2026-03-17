import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

(async () => {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k) env[k.trim()] = v.join('=').trim();
    });

    const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

    const { error: authErr } = await supabase.auth.signInWithPassword({
        email: 'cs.off@outlook.com',
        password: 'Roletarussa1412@'
    });

    if (authErr) { console.error('Auth error:', authErr.message); process.exit(1); }
    console.log('✅ Logged in!');

    const filaments = [
        // Krei 3D
        { marca: 'Krei 3D', material: 'PLA',  cor: 'Preto',         preco_kg: 89.90, peso_atual: 1000 },
        { marca: 'Krei 3D', material: 'PLA',  cor: 'Branco',        preco_kg: 89.90, peso_atual: 1000 },
        { marca: 'Krei 3D', material: 'PLA',  cor: 'Cinza',         preco_kg: 92.00, peso_atual: 850  },
        { marca: 'Krei 3D', material: 'PETG', cor: 'Preto',         preco_kg: 99.90, peso_atual: 750  },
        // 3D Lab
        { marca: '3D Lab',  material: 'PLA',  cor: 'Preto',         preco_kg: 94.90, peso_atual: 1000 },
        { marca: '3D Lab',  material: 'PLA',  cor: 'Branco',        preco_kg: 94.90, peso_atual: 1000 },
        { marca: '3D Lab',  material: 'PLA',  cor: 'Vermelho',      preco_kg: 97.00, peso_atual: 600  },
        { marca: '3D Lab',  material: 'ABS',  cor: 'Preto',         preco_kg: 89.00, peso_atual: 500  },
        // Voolt
        { marca: 'Voolt',   material: 'PLA',  cor: 'Preto',         preco_kg: 84.90, peso_atual: 1000 },
        { marca: 'Voolt',   material: 'PLA',  cor: 'Branco',        preco_kg: 84.90, peso_atual: 1000 },
        { marca: 'Voolt',   material: 'PLA',  cor: 'Azul',          preco_kg: 88.00, peso_atual: 700  },
        { marca: 'Voolt',   material: 'PETG', cor: 'Transparente',  preco_kg: 99.00, peso_atual: 500  },
    ];

    const { data, error } = await supabase.from('filamentos').insert(filaments).select();

    if (error) {
        console.error('❌ Insert error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} filaments!`);
        data.forEach(f => console.log(`  → [${f.marca}] ${f.material} - ${f.cor}`));
    }
})();
