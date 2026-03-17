import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const RealTimeContext = createContext();

export const useRealTime = () => useContext(RealTimeContext);

export const RealTimeProvider = ({ children }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState([
        { id: 'ativas', label: 'Impressões Ativas', value: 0, trend: 'carregando...', color: 'var(--color-accent)' },
        { id: 'filamento', label: 'Estoque Total (kg)', value: 0, trend: 'carregando...', color: 'var(--color-accent-secondary)' },
        { id: 'projetos', label: 'Projetos Salvos', value: 0, trend: 'carregando...', color: '#f59e0b' },
        { id: 'lucro', label: 'Lucro Acumulado', value: 'R$ 0', trend: 'carregando...', color: '#10b981' },
    ]);

    const [orders, setOrders] = useState([]);
    const [connectedUsers, setConnectedUsers] = useState(1);
    const [isSyncing, setIsSyncing] = useState(true);

    const fetchDashboardData = async () => {
        if (!user) return;
        setIsSyncing(true);
        try {
            // 1. Impressões Ativas
            const { count: activeCount } = await supabase
                .from('impressoes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'Imprimindo');

            // 2. Estoque Filamento (kg)
            const { data: filaments } = await supabase
                .from('filamentos')
                .select('peso_atual')
                .eq('user_id', user.id);
            
            const totalWeightG = (filaments || []).reduce((acc, f) => acc + (f.peso_atual || 0), 0);
            const totalWeightKg = (totalWeightG / 1000).toFixed(2);

            // 3. Projetos Salvos (Orcamentos)
            const { count: projectsCount } = await supabase
                .from('orcamentos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // 4. Lucro Total
            const { data: history } = await supabase
                .from('impressoes')
                .select('lucro_liquido')
                .eq('user_id', user.id);
            
            const totalProfit = (history || []).reduce((acc, h) => acc + (h.lucro_liquido || 0), 0);

            // 5. Produção Recente (Últimas 5)
            const { data: recent } = await supabase
                .from('impressoes')
                .select('id, projeto, status, tempo_total, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setStats([
                { id: 'ativas', label: 'Impressões Ativas', value: activeCount || 0, trend: 'tempo real', color: 'var(--color-accent)' },
                { id: 'filamento', label: 'Estoque Total (kg)', value: totalWeightKg, trend: 'em estoque', color: 'var(--color-accent-secondary)' },
                { id: 'projetos', label: 'Projetos Salvos', value: projectsCount || 0, trend: 'orçamentos', color: '#f59e0b' },
                { id: 'lucro', label: 'Lucro Acumulado', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProfit), trend: 'total bruto', color: '#10b981' },
            ]);

            setOrders((recent || []).map(r => ({
                id: r.id,
                item: r.projeto,
                client: 'Registrado', // A tabela impressoes não guarda cliente diretamente em algumas versões, mas podemos ajustar se necessário
                status: r.status || 'Concluído',
                time: r.tempo_total || 'N/A'
            })));

        } catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDashboardData();
            // Polling simples a cada 30 segundos (ou podemos usar Realtime)
            const interval = setInterval(fetchDashboardData, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const value = {
        stats,
        orders,
        connectedUsers,
        isSyncing,
        refreshData: fetchDashboardData
    };

    return (
        <RealTimeContext.Provider value={value}>
            {children}
        </RealTimeContext.Provider>
    );
};
