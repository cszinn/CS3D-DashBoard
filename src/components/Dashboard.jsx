import React from 'react';
import { useRealTime } from '../context/RealTimeContext';

const Dashboard = () => {
    const { stats, orders, connectedUsers, isSyncing } = useRealTime();

    return (
        <div style={{ width: '100%' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>Visão Geral</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Acompanhe o status e as métricas da equipe em tempo real.</p>
                </div>

                {/* Simulação de Status em Tempo Real */}
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px' }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: 'var(--color-accent)',
                        boxShadow: isSyncing ? '0 0 12px var(--color-accent), 0 0 4px var(--color-text-primary)' : '0 0 8px var(--color-accent)',
                        opacity: isSyncing ? 0.6 : 1,
                        transition: 'all 0.3s ease'
                    }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--color-accent)', minWidth: '80px' }}>
                        {isSyncing ? 'Sincronizando' : 'Sincronizado'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{connectedUsers} online</span>
                </div>
            </header>

            {/* Cartões de Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '500', marginBottom: '0.5rem' }}>{stat.label}</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: stat.color, backgroundColor: `${stat.color}22`, padding: '4px 8px', borderRadius: '6px' }}>{stat.trend}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Área de Conteúdo Secundária - Ex: Tabela de Pedidos Rápidos */}
            <div className="glass-panel" style={{ borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Produção Recente</h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ paddingBottom: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>ITEM</th>
                                <th style={{ paddingBottom: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>CLIENTE</th>
                                <th style={{ paddingBottom: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>STATUS</th>
                                <th style={{ paddingBottom: '1rem', color: 'var(--color-text-secondary)', fontWeight: '500', fontSize: '0.85rem' }}>TEMPO EST.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((row, i) => (
                                <tr key={i} style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background-color 0.5s ease',
                                    backgroundColor: isSyncing ? 'rgba(255,255,255,0.01)' : 'transparent'
                                }}>
                                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{row.item}</td>
                                    <td style={{ padding: '1rem 0', color: 'var(--color-text-secondary)' }}>{row.client}</td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                                            backgroundColor: row.status === 'Concluído' ? 'rgba(16, 185, 129, 0.1)' : row.status === 'Imprimindo' ? 'rgba(0, 229, 255, 0.1)' : row.status === 'Erro' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: row.status === 'Concluído' ? '#10b981' : row.status === 'Imprimindo' ? 'var(--color-accent)' : row.status === 'Erro' ? '#ef4444' : '#f59e0b'
                                        }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 0', color: 'var(--color-text-secondary)' }}>{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
