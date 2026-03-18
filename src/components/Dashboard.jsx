import React from 'react';
import { useRealTime } from '../context/RealTimeContext';
import { RefreshCw, Zap, Package, BarChart3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const Dashboard = () => {
    const { stats, orders, connectedUsers, isSyncing, refreshData } = useRealTime();

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }} className="animate-fadeIn">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.4rem', color: 'white', letterSpacing: '-0.02em' }}>
                        Dashboard <span className="text-primary">CS3D</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Relatório consolidado e controle de produção.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status de Sincronização */}
                    <div className="glass-panel items-center gap-3 px-4 py-2 rounded-2xl hidden md:flex" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-primary animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white', opacity: 0.9 }}>
                            {isSyncing ? 'Sincronizando...' : 'Conectado'}
                        </span>
                    </div>

                    <button
                        onClick={refreshData}
                        disabled={isSyncing}
                        className="p-3 glass-panel rounded-2xl text-white hover:text-primary transition-all active:scale-95 disabled:opacity-50"
                        title="Atualizar Dados"
                    >
                        <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Cartões de Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass-panel group" style={{ padding: '1.75rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.3s ease' }}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</h3>
                            <div className="p-2 rounded-xl bg-white/5 text-primary group-hover:scale-110 transition-transform">
                                {stat.id === 'ativas' && <Zap size={18} />}
                                {stat.id === 'filamento' && <Package size={18} />}
                                {stat.id === 'projetos' && <BarChart3 size={18} />}
                                {stat.id === 'lucro' && <CheckCircle2 size={18} />}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'white', letterSpacing: '-0.03em' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: stat.color, backgroundColor: `${stat.color}15`, padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>{stat.trend}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela de Produção Recente */}
            <div className="glass-panel" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', maxWidth: '100%' }}>
                <div style={{ padding: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>Registros Recentes</h3>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full hidden sm:block">Últimos 5 Itens</span>
                </div>

                {/* Reduzi o padding no mobile para dar mais espaço ao toque */}
                <div className="px-4 pb-4 md:px-7 md:pb-7 pt-2" style={{ maxWidth: '100vw' }}>

                    {/* Contêiner que habilita o arraste com o dedo */}
                    <div style={{
                        width: '100%',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        display: 'block'
                    }}>
                        {/* A tabela agora tem um minWidth fixo para forçar a barra de rolagem */}
                        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'separate', borderSpacing: '0 12px', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '0 1rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', minWidth: '180px' }}>PROJETO</th>
                                    <th style={{ padding: '0 1rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', minWidth: '120px' }}>STATUS</th>
                                    <th style={{ padding: '0 1rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', minWidth: '100px' }}>DURAÇÃO</th>
                                    <th style={{ padding: '0 1rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', minWidth: '150px' }}>DATA/HORA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
                                            Nenhum registro encontrado ainda.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((row) => (
                                        <tr key={row.id} style={{
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            transition: 'all 0.2s ease',
                                        }} className="hover:bg-white/[0.04] cursor-default">
                                            <td style={{ padding: '1.25rem 1rem', borderRadius: '12px 0 0 12px' }}>
                                                <div className="font-bold text-white whitespace-nowrap" title={row.item}>{row.item}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <span style={{
                                                    padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                                                    backgroundColor: row.status === 'Concluído' ? 'rgba(16, 185, 129, 0.1)' :
                                                        row.status === 'Imprimindo' ? 'rgba(59, 130, 246, 0.1)' :
                                                            row.status === 'Falhou' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: row.status === 'Concluído' ? '#10b981' :
                                                        row.status === 'Imprimindo' ? '#3b82f6' :
                                                            row.status === 'Falhou' ? '#ef4444' : '#f59e0b'
                                                }}>
                                                    {row.status === 'Falhou' ? <AlertCircle size={14} /> : <Clock size={14} />}
                                                    {row.status || 'Pendente'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600', whiteSpace: 'nowrap' }}>{row.time}</td>
                                            <td style={{ padding: '1.25rem 1rem', borderRadius: '0 12px 12px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {row.date || 'Recente'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
