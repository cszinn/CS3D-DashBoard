import React, { createContext, useContext, useState, useEffect } from 'react';

const RealTimeContext = createContext();

export const useRealTime = () => useContext(RealTimeContext);

export const RealTimeProvider = ({ children }) => {
    const [stats, setStats] = useState([
        { id: 'ativas', label: 'Impressões Ativas', value: 12, trend: '+2 hoje', color: 'var(--color-accent)' },
        { id: 'filamento', label: 'Filamento (kg)', value: 8.4, trend: '-1.2kg', color: 'var(--color-accent-secondary)' },
        { id: 'pendentes', label: 'Pedidos Pendentes', value: 34, trend: '+5', color: '#f59e0b' },
        { id: 'faturamento', label: 'Faturamento', value: '4.2k', trend: '+12%', color: '#10b981' },
    ]);

    const [orders, setOrders] = useState([
        { id: 1, item: 'Peça Motor V8', client: 'João M.', status: 'Imprimindo', time: '4h 20m' },
        { id: 2, item: 'Case Raspberry Pi', client: 'Tech Corp', status: 'Concluído', time: '1h 15m' },
        { id: 3, item: 'Suporte Articulado', client: 'Ana S.', status: 'Fila', time: '8h 00m' },
    ]);

    const [connectedUsers, setConnectedUsers] = useState(2);
    const [isSyncing, setIsSyncing] = useState(false);

    // Simulating real-time updates from other users
    useEffect(() => {
        const interval = setInterval(() => {
            setIsSyncing(true);

            // Simulate altering a random order status occasionally
            if (Math.random() > 0.4) {
                setOrders(prev => {
                    const statuses = ['Imprimindo', 'Concluído', 'Fila', 'Erro'];
                    const newOrders = [...prev];
                    const randomIdx = Math.floor(Math.random() * newOrders.length);
                    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                    newOrders[randomIdx] = { ...newOrders[randomIdx], status: randomStatus };
                    return newOrders;
                });
            }

            // Simulate a new impression starting or ending
            if (Math.random() > 0.5) {
                setStats(prev => prev.map(stat => {
                    if (stat.id === 'ativas') {
                        const newVal = Math.max(0, stat.value + (Math.random() > 0.5 ? 1 : -1));
                        return { ...stat, value: newVal };
                    }
                    if (stat.id === 'filamento') {
                        const newFilament = Math.max(0, stat.value - 0.1).toFixed(1);
                        return { ...stat, value: parseFloat(newFilament) };
                    }
                    return stat;
                }));
            }

            setTimeout(() => setIsSyncing(false), 800);
        }, 5000); // Trigger mock sync every 5 seconds for demonstration

        return () => clearInterval(interval);
    }, []);

    const value = {
        stats,
        orders,
        connectedUsers,
        isSyncing
    };

    return (
        <RealTimeContext.Provider value={value}>
            {children}
        </RealTimeContext.Provider>
    );
};
