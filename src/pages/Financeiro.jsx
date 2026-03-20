import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    DollarSign,
    TrendingDown,
    TrendingUp,
    Target,
    Plus,
    Filter,
    ArrowUpCircle,
    ArrowDownCircle,
    Download,
    Trash2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';

// Componente simples para StatCards do topo
const StatCard = ({ title, amount, icon: Icon, trend, colorClass, invertTrendColors = false }) => (
    <div style={{ backgroundColor: '#13171e', border: '1px solid #232830', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#8b949e', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
            <div style={{ backgroundColor: 'rgba(0, 224, 255, 0.1)', padding: '8px', borderRadius: '8px' }}>
                <Icon size={20} className={colorClass} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: 'white', fontSize: '2rem', fontWeight: '800', letterSpacing: '-1px', whiteSpace: 'nowrap' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
            </span>
            {trend !== undefined && trend !== null && (
                <span style={{ 
                    color: trend > 0 ? (invertTrendColors ? '#f87171' : '#34d399') : (trend < 0 ? (invertTrendColors ? '#34d399' : '#f87171') : '#8b949e'), 
                    fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'
                }}>
                    {trend > 0 ? '↑' : (trend < 0 ? '↓' : '')} {Math.abs(trend)}%
                </span>
            )}
        </div>
    </div>
);

export default function Financeiro() {
    const { user } = useAuth();
    const [transacoes, setTransacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [receitaBruta, setReceitaBruta] = useState(0);
    const [custosTotais, setCustosTotais] = useState(0);
    const [lucroLiquido, setLucroLiquido] = useState(0);
    
    // Tendências
    const [receitaTrend, setReceitaTrend] = useState(0);
    const [custosTrend, setCustosTrend] = useState(0);
    const [lucroTrend, setLucroTrend] = useState(0);

    // Modal Nova Transação
    const [showModal, setShowModal] = useState(false);
    const [formTipo, setFormTipo] = useState('entrada');
    const [formCategoria, setFormCategoria] = useState('');
    const [formValor, setFormValor] = useState('');
    const [formDescricao, setFormDescricao] = useState('');

    useEffect(() => {
        fetchFinancas();
    }, [user]);

    const fetchFinancas = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financas')
                .select('*')
                .order('data', { ascending: false });
            
            if (error) throw error;
            
            setTransacoes(data || []);
            calcularMetricas(data || []);
        } catch (err) {
            console.error('Erro ao buscar finanças:', err);
        } finally {
            setLoading(false);
        }
    };

    const calcularMetricas = (dados) => {
        let entradas = 0;
        let saidas = 0;

        let entradasMesAtual = 0;
        let entradasMesPassado = 0;
        let saidasMesAtual = 0;
        let saidasMesPassado = 0;

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        const mesPassado = mesAtual === 0 ? 11 : mesAtual - 1;
        const anoPassado = mesAtual === 0 ? anoAtual - 1 : anoAtual;

        dados.forEach(t => {
            const valor = parseFloat(t.valor);
            const dataT = new Date(t.data);
            const tMes = dataT.getMonth();
            const tAno = dataT.getFullYear();

            if (t.tipo === 'entrada') {
                entradas += valor;
                if (tMes === mesAtual && tAno === anoAtual) entradasMesAtual += valor;
                if (tMes === mesPassado && tAno === anoPassado) entradasMesPassado += valor;
            }
            if (t.tipo === 'saida') {
                saidas += valor;
                if (tMes === mesAtual && tAno === anoAtual) saidasMesAtual += valor;
                if (tMes === mesPassado && tAno === anoPassado) saidasMesPassado += valor;
            }
        });

        setReceitaBruta(entradas);
        setCustosTotais(saidas);
        setLucroLiquido(entradas - saidas);

        // A porcentagem do Lucro Líquido agora é a Margem de Lucro (Lucro / Receita) * 100
        const lucroBruto = entradas - saidas;
        const margemLucro = entradas > 0 ? (lucroBruto / entradas) * 100 : 0;
        setLucroTrend(margemLucro);
    };

    const handleSubmitNovaTransacao = async (e) => {
        e.preventDefault();
        try {
            const novaTransacao = {
                user_id: user.id,
                tipo: formTipo,
                categoria: formCategoria,
                valor: parseFloat(formValor),
                descricao: formDescricao,
            };

            const { error } = await supabase.from('financas').insert([novaTransacao]);
            
            if (error) throw error;

            setShowModal(false);
            setFormCategoria('');
            setFormValor('');
            setFormDescricao('');
            fetchFinancas();
        } catch (err) {
            alert('Erro ao salvar transação: ' + err.message);
        }
    };

    const handleDeleteTransacao = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta transação? Ela será removida do seu saldo e gráficos.')) return;
        try {
            const { error } = await supabase.from('financas').delete().eq('id', id);
            if (error) throw error;
            fetchFinancas();
        } catch (err) {
            alert('Erro ao excluir transação: ' + err.message);
        }
    };

    // Processamento Dinâmico dos Dados do Gráfico (Evolução Mês a Mês)
    const chartData = useMemo(() => {
        if (!transacoes || transacoes.length === 0) return [];
        
        const meses = {};
        const sorted = [...transacoes].sort((a,b) => new Date(a.data) - new Date(b.data));
        
        sorted.forEach(t => {
            const date = new Date(t.data);
            // Pega o nome abreviado do mês (ex: "jan", "fev")
            const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''); 
            const chave = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);

            if (!meses[chave]) {
                meses[chave] = { name: chave, entradas: 0, saidas: 0 };
            }
            if (t.tipo === 'entrada') meses[chave].entradas += parseFloat(t.valor);
            if (t.tipo === 'saida') meses[chave].saidas += parseFloat(t.valor);
        });

        return Object.values(meses);
    }, [transacoes]);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', paddingBottom: '4rem', paddingTop: '1rem', fontFamily: 'inherit' }} className="animate-in fade-in duration-500">
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px' }}>
                        Controle Financeiro
                    </h1>
                    <p style={{ color: '#8b949e', fontSize: '0.95rem', fontWeight: 500 }}>
                        Visão analítica de custos e faturamento da sua produção.
                    </p>
                </div>
                <div>
                    <button 
                        onClick={() => setShowModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00e0ff', color: '#060b14', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 224, 255, 0.25)' }}
                    >
                        <Plus size={20} /> Nova Transação
                    </button>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                <StatCard title="Receita Bruta" amount={receitaBruta} icon={TrendingUp} colorClass="text-[#34d399]" />
                <StatCard title="Custos Totais" amount={-Math.abs(custosTotais)} icon={TrendingDown} colorClass="text-[#f87171]" />
                <StatCard title="Lucro Líquido" amount={lucroLiquido} icon={DollarSign} colorClass="text-[#00e0ff]" trend={parseFloat(lucroTrend.toFixed(1))} />
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: { gridTemplateColumns: '2fr 1fr' }, gap: '24px' }}>
                
                {/* Tabela de Fluxo de Caixa */}
                <div style={{ backgroundColor: '#13171e', border: '1px solid #232830', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '800' }}>Fluxo de Caixa Recente</h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{ background: 'none', border: '1px solid #30363d', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}><Filter size={16} /> Filtros</button>
                            <button style={{ background: 'none', border: '1px solid #30363d', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}><Download size={16} /> Exportar</button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #232830' }}>
                                    <th style={{ padding: '12px 16px', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Tipo</th>
                                    <th style={{ padding: '12px 16px', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Descrição</th>
                                    <th style={{ padding: '12px 16px', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Valor</th>
                                    <th style={{ padding: '12px 16px', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Data</th>
                                    <th style={{ padding: '12px 16px', width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {transacoes.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px 16px', color: '#8b949e', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            {loading ? 'Carregando financas...' : 'Nenhuma transação registrada.'}
                                        </td>
                                    </tr>
                                ) : (
                                    transacoes.map((t) => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '16px' }}>
                                                {t.tipo === 'entrada' 
                                                    ? <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowUpCircle size={14} /> Entrada</span>
                                                    : <span style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)', color: '#f87171', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowDownCircle size={14} /> Saída</span>
                                                }
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{t.descricao}</div>
                                                <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>{t.categoria}</div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: 'white', fontWeight: '800', fontSize: '1rem' }}>
                                                {t.tipo === 'entrada' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#8b949e', fontSize: '0.85rem' }}>
                                                {new Date(t.data).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleDeleteTransacao(t.id)} 
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    title="Excluir Transação"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Gráfico de Evolução Mês a Mês */}
                <div style={{ gridColumn: '1 / -1', lg: { gridColumn: 'auto' } }}> {/* Apenas para ficar responsive depois */}
                    <div style={{ backgroundColor: '#13171e', border: '1px solid #232830', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Evolução de Receita</h2>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00e0ff" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#00e0ff" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#8b949e" tick={{fill: '#8b949e'}} />
                                    <YAxis stroke="#8b949e" tick={{fill: '#8b949e'}} />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#232830" vertical={false} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#181c22', border: '1px solid #30363d', borderRadius: '8px', color: 'white' }}
                                        itemStyle={{ color: '#00e0ff' }}
                                    />
                                    <Area type="monotone" dataKey="entradas" stroke="#00e0ff" fillOpacity={1} fill="url(#colorEntradas)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="saidas" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaidas)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Nova Transação */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: '16px' }}>
                    <form onSubmit={handleSubmitNovaTransacao} style={{ backgroundColor: '#13171e', border: '1px solid #30363d', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem' }}>Lançar Transação</h2>
                        
                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Tipo</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div 
                                    onClick={() => setFormTipo('entrada')}
                                    style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '8px', border: formTipo === 'entrada' ? '1px solid #34d399' : '1px solid #30363d', backgroundColor: formTipo === 'entrada' ? 'rgba(52,211,153,0.1)' : '#1c2128', color: formTipo === 'entrada' ? '#34d399' : '#8b949e', cursor: 'pointer', fontWeight: '700' }}
                                >
                                    Entrada
                                </div>
                                <div 
                                    onClick={() => setFormTipo('saida')}
                                    style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '8px', border: formTipo === 'saida' ? '1px solid #f87171' : '1px solid #30363d', backgroundColor: formTipo === 'saida' ? 'rgba(248,113,113,0.1)' : '#1c2128', color: formTipo === 'saida' ? '#f87171' : '#8b949e', cursor: 'pointer', fontWeight: '700' }}
                                >
                                    Saída
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Valor (R$)</label>
                            <input 
                                type="number" step="0.01" required value={formValor} onChange={e => setFormValor(e.target.value)}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '8px', color: 'white', fontSize: '1rem', outline: 'none' }} 
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Descrição</label>
                            <input 
                                type="text" required value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Ex: Venda Vaso Escultura"
                                style={{ width: '100%', padding: '12px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none' }} 
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Categoria</label>
                            <select 
                                required value={formCategoria} onChange={e => setFormCategoria(e.target.value)}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', appearance: 'none' }}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option value="Venda Peça">Venda Peça</option>
                                <option value="Modelagem 3D">Serviço de Modelagem</option>
                                <option value="Filamento">Compra Filamento</option>
                                <option value="Energia">Conta de Energia</option>
                                <option value="Manutencao">Manutenção/Reposição</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #30363d', backgroundColor: 'transparent', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#00e0ff', color: '#060b14', fontWeight: '800', cursor: 'pointer' }}>Salvar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
