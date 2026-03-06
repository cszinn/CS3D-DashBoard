import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { processGCodeFile } from '../lib/gcodeParser';
import {
    Printer,
    Trash2,
    Save,
    Plus,
    Zap,
    Package,
    TrendingUp,
    AlertTriangle,
    UploadCloud,
    CheckCircle2,
    Clock,
    Send,
    Download,
    DollarSign,
    Circle,
    Settings,
    Wrench
} from 'lucide-react';

const PRINTER_DB = {
    'custom': { name: '-- Personalizada / Outra --', watts: 0, price: 0, life: 1 },
    'ender3v3se': { name: 'Creality Ender 3 V3 SE', watts: 350, price: 2000, life: 5000 },
    'k1max': { name: 'Creality K1 Max', watts: 1000, price: 600, life: 5000 },
    'bambua1': { name: 'Bambu Lab A1', watts: 500, price: 5500, life: 5000 },
    'neptune4max': { name: 'Elegoo Neptune 4 Max', watts: 500, price: 3800, life: 5000 },
    'adventurer5m': { name: 'Flashforge Adventurer 5M Pro', watts: 350, price: 4200, life: 5000 }
};

const SectionHeader = ({ icon: Icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0, 224, 255, 0.1)', border: '1px solid rgba(0, 224, 255, 0.2)' }}>
            <Icon size={18} color="var(--color-accent)" />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>{title}</h3>
    </div>
);

const InputGroup = ({ label, id, children, fullWidth = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: fullWidth ? '100%' : 'auto', flex: fullWidth ? 'none' : 1 }}>
        <label htmlFor={id} style={{ fontSize: '0.85rem', color: '#8b949e', fontWeight: '500' }}>{label}</label>
        {children}
    </div>
);

const inputStyle = {
    padding: '10px 14px',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s ease'
};

const fmt = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Calculator() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('cliente'); // 'cliente' ou 'producao'

    // States para Dados do Modelo
    const [nomeProjeto, setNomeProjeto] = useState('');
    const [cliente, setCliente] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [horas, setHoras] = useState('');
    const [minutos, setMinutos] = useState('');
    const [peso, setPeso] = useState('');

    // States para Custos
    const [custoKg, setCustoKg] = useState(100);
    const [impressoraSelected, setImpressoraSelected] = useState('custom');
    const [consumoW, setConsumoW] = useState(350);
    const [custoKwh, setCustoKwh] = useState(0.85);
    const [custoFixoMes, setCustoFixoMes] = useState(0);
    const [pecasEstMes, setPecasEstMes] = useState(50);
    const [valorImpressora, setValorImpressora] = useState(2000);
    const [vidaUtil, setVidaUtil] = useState(5000);
    const [margemFalhas, setMargemFalhas] = useState(5);

    // Novos Campos Granulares (STLHub)
    const [depImpHoraria, setDepImpHoraria] = useState(0.3);
    const [depMaqHoraria, setDepMaqHoraria] = useState(0.2);
    const [desBicoHoraria, setDesBicoHoraria] = useState(0.1);
    const [freteEmbalagem, setFreteEmbalagem] = useState(0);
    const [cores, setCores] = useState('');
    const [detalhesProjeto, setDetalhesProjeto] = useState('');

    // Acessórios
    const [acessorios, setAcessorios] = useState([]);
    const [novoAcessorioNome, setNovoAcessorioNome] = useState('');
    const [novoAcessorioCusto, setNovoAcessorioCusto] = useState('');

    // Config de Venda
    const [markup, setMarkup] = useState(100);
    const [imposto, setImposto] = useState(0);
    const [taxaMaquininha, setTaxaMaquininha] = useState(0);
    const [incluirTaxas, setIncluirTaxas] = useState(false);

    // Resultados
    const [resultados, setResultados] = useState({
        custoFilamento: 0,
        custoEnergia: 0,
        custoFixo: 0,
        custoDepreciacao: 0,
        custoAcessorios: 0,
        custoFalhas: 0,
        custoTotalLote: 0,
        custoUnitario: 0,
        precoTotalLote: 0,
        precoUnitario: 0,
        lucroBruto: 0,
        lucroLiquido: 0
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (impressoraSelected !== 'custom') {
            const p = PRINTER_DB[impressoraSelected];
            setConsumoW(p.watts);
            setValorImpressora(p.price);
            setVidaUtil(p.life);
        }
    }, [impressoraSelected]);

    // Efeito para Cálculo Real-time (Sincronizado e Expandido)
    useEffect(() => {
        const getVal = (v) => parseFloat(v) || 0;

        const hNum = getVal(horas);
        const mNum = getVal(minutos);
        const pesoPeca = getVal(peso);
        const custoKgNum = getVal(custoKg);
        const consumoWNum = getVal(consumoW);
        const custoKwhNum = getVal(custoKwh);
        const markupNum = getVal(markup);
        const falhasNum = getVal(margemFalhas);
        const qtdNum = parseInt(quantidade) || 1;

        // Depreciações e Extras
        const dImp = getVal(depImpHoraria);
        const dMaq = getVal(depMaqHoraria);
        const dBico = getVal(desBicoHoraria);
        const frete = getVal(freteEmbalagem);

        const totalAcessorios = acessorios.reduce((acc, curr) => acc + curr.custo, 0);
        const tempoH = hNum + (mNum / 60);

        // --- CÁLCULOS STLHub ---
        const cFilamento = (custoKgNum / 1000) * pesoPeca;
        const cEnergia = (consumoWNum / 1000) * tempoH * custoKwhNum;

        // Agora usamos as taxas horárias específicas
        const cDepImp = dImp * tempoH;
        const cDepMaq = dMaq * tempoH;
        const cDesBico = dBico * tempoH;
        const cEquipamentoTotal = cDepImp + cDepMaq + cDesBico;

        const subtotalBase = cFilamento + cEnergia + cEquipamentoTotal;
        const cFalhas = subtotalBase * (falhasNum / 100);

        // Custo Total Lote
        const custoTotalProdLote = subtotalBase + cFalhas + totalAcessorios + frete;

        // Markup e Margens
        let precoVendaTotal = custoTotalProdLote * (1 + markupNum / 100);

        if (incluirTaxas) {
            const impostoNum = getVal(imposto);
            const taxaNum = getVal(taxaMaquininha);
            const taxasTotais = (impostoNum + taxaNum) / 100;
            if (taxasTotais < 0.99) precoVendaTotal = precoVendaTotal / (1 - taxasTotais);
        }

        const lucroLiquido = precoVendaTotal - custoTotalProdLote;

        setResultados({
            custoFilamento: cFilamento,
            custoEnergia: cEnergia,
            custoDepImp: cDepImp,
            custoDepMaq: cDepMaq,
            custoDesBico: cDesBico,
            custoAcessorios: totalAcessorios,
            custoFalhas: cFalhas,
            custoTotalLote: custoTotalProdLote,
            custoUnitario: qtdNum > 0 ? custoTotalProdLote / qtdNum : 0,
            precoTotalLote: precoVendaTotal,
            precoUnitario: qtdNum > 0 ? precoVendaTotal / qtdNum : 0,
            lucroLiquido: lucroLiquido,
            frete: frete
        });
    }, [horas, minutos, peso, custoKg, consumoW, custoKwh, pecasEstMes, margemFalhas, acessorios, markup, imposto, taxaMaquininha, incluirTaxas, quantidade, depImpHoraria, depMaqHoraria, desBicoHoraria, freteEmbalagem]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = await processGCodeFile(file);
            setHoras(data.hours.toString());
            setMinutos(data.minutes.toString());
            setPeso(data.weight.toString());
            if (!nomeProjeto) setNomeProjeto(data.fileName);
            setMsg({ type: 'success', text: `G-Code lido: ${data.hours}h ${data.minutes}m | ${data.weight}g` });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao ler G-Code.' });
        }
    };

    const addAcessorio = () => {
        if (!novoAcessorioNome || !novoAcessorioCusto) return;
        setAcessorios([...acessorios, { id: Date.now(), nome: novoAcessorioNome, custo: parseFloat(novoAcessorioCusto) }]);
        setNovoAcessorioNome('');
        setNovoAcessorioCusto('');
    };

    const removeAcessorio = (id) => setAcessorios(acessorios.filter(a => a.id !== id));

    const saveBudget = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('orcamentos').insert({
                user_id: user.id,
                nome_projeto: nomeProjeto || 'Sem Nome',
                cliente: cliente,
                quantidade: quantidade,
                cores: cores,
                detalhes: detalhesProjeto,
                peso_gramas: parseFloat(peso) || 0,
                tempo_horas: parseInt(horas) || 0,
                tempo_minutos: parseInt(minutos) || 0,
                custo_total_producao: resultados.custoTotalLote,
                preco_venda_final: resultados.precoTotalLote,
                lucro_liquido: resultados.lucroLiquido,
                detalhes_custos: { ...resultados, markup, imposto }
            });
            if (error) throw error;
            setMsg({ type: 'success', text: 'Orçamento salvo no histórico!' });
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 4000);
        }
    };

    // --- COMPONENTES AUXILIARES DE UI (ESTILO PREMIUM) ---
    const AnalysisRow = ({ label, value, total, icon, color }) => {
        const percent = total > 0 ? (value / total) * 100 : 0;
        return (
            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c9d1d9', fontSize: '0.85rem' }}>
                        <span style={{ color }}>{icon}</span> {label}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>{percent.toFixed(1)}%</span>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{fmt(value)}</span>
                    </div>
                </div>
                <div style={{ height: '4px', backgroundColor: '#30363d', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, backgroundColor: color, transition: 'width 0.5s ease' }} />
                </div>
            </div>
        );
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px',
                backgroundColor: activeTab === id ? 'rgba(0, 224, 255, 0.1)' : 'transparent',
                border: activeTab === id ? '1px solid var(--color-accent)' : '1px solid transparent',
                color: activeTab === id ? 'var(--color-accent)' : '#8b949e',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.3s ease'
            }}
        >
            <Icon size={16} /> {label}
        </button>
    );

    const DonutChart = ({ data }) => {
        const [hoveredSlice, setHoveredSlice] = useState(null);
        const total = data.reduce((acc, curr) => acc + curr.value, 0);
        let cumulativePercent = 0;

        const getCoordinatesForPercent = (percent) => {
            const x = Math.cos(2 * Math.PI * percent);
            const y = Math.sin(2 * Math.PI * percent);
            return [x, y];
        };

        return (
            <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
                <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {data.map((slice, i) => {
                        if (slice.value === 0) return null;
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += slice.value / total;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                        const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `L 0 0`,
                        ].join(' ');

                        const isHovered = hoveredSlice === i;

                        return (
                            <path
                                key={i}
                                d={pathData}
                                fill={slice.color}
                                style={{
                                    transition: 'all 0.2s ease',
                                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                    opacity: hoveredSlice !== null && !isHovered ? 0.6 : 1,
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={() => setHoveredSlice(i)}
                                onMouseLeave={() => setHoveredSlice(null)}
                            />
                        );
                    })}
                    <circle r="0.65" fill="#0d1117" cx="0" cy="0" />
                </svg>
                {hoveredSlice !== null && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        textAlign: 'center', pointerEvents: 'none', backgroundColor: 'rgba(13, 17, 23, 0.9)',
                        padding: '10px', borderRadius: '8px', border: '1px solid #30363d', minWidth: '100px'
                    }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{data[hoveredSlice].name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{fmt(data[hoveredSlice].value)} ({((data[hoveredSlice].value / total) * 100).toFixed(1)}%)</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ color: 'white', maxWidth: '1300px', margin: '0 auto', padding: '1rem 2rem 4rem' }}>

            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>Calculadora</h1>
                    <p style={{ color: '#8b949e', fontSize: '0.95rem' }}>Orçamentos para clientes e registro interno de produção</p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                        <TabButton id="cliente" label="Orçamento para Cliente" icon={Package} />
                        <TabButton id="producao" label="Perfil de Produção" icon={Printer} />
                    </div>
                </div>
                <button
                    onClick={() => setMsg({ text: 'Cálculo atualizado!', type: 'success' })}
                    style={{
                        backgroundColor: 'transparent', color: 'var(--color-accent)', border: '1px solid var(--color-accent)',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                        transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = 'rgba(0, 224, 255, 0.1)'}
                    onMouseOut={e => e.target.style.backgroundColor = 'transparent'}
                >
                    <TrendingUp size={16} /> Calcular Custo
                </button>
            </header>

            {msg.text && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 100,
                    backgroundColor: msg.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2.5rem' }}>

                {/* COLUNA ESQUERDA - INPUTS CATEGORIZADOS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #30363d' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <div style={{ backgroundColor: 'rgba(0, 224, 255, 0.1)', padding: '8px', borderRadius: '8px' }}>
                                <UploadCloud size={18} color="var(--color-accent)" />
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Dados da Impressão</h2>
                        </div>

                        {/* MATERIAL */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>❂ Material</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <InputGroup label="Tipo de Filamento" id="tipo">
                                    <select style={inputStyle}>
                                        <option>PLA</option>
                                        <option>ABS</option>
                                        <option>PETG</option>
                                        <option>Resina</option>
                                    </select>
                                </InputGroup>
                                <InputGroup label="Custo do Filamento (R$/kg)" id="custoKg">
                                    <input style={inputStyle} type="number" value={custoKg} onChange={e => setCustoKg(e.target.value)} />
                                </InputGroup>
                            </div>
                            <InputGroup label="Peso da Peça (gramas)" id="peso" fullWidth>
                                <input style={inputStyle} type="number" value={peso} onChange={e => setPeso(e.target.value)} />
                            </InputGroup>
                        </div>

                        {/* TEMPO E ENERGIA */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>🕒 Tempo e Energia</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                <InputGroup label="Tempo de Impressão">
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input style={inputStyle} type="number" value={horas} onChange={e => setHoras(e.target.value)} />
                                            <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.8rem', color: '#484f58' }}>H</span>
                                        </div>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input style={inputStyle} type="number" value={minutos} onChange={e => setMinutos(e.target.value)} />
                                            <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.8rem', color: '#484f58' }}>M</span>
                                        </div>
                                    </div>
                                </InputGroup>
                                <InputGroup label="Potência da Impressora (W)">
                                    <input style={inputStyle} type="number" value={consumoW} onChange={e => setConsumoW(e.target.value)} />
                                </InputGroup>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                <InputGroup label="Custo da Energia (R$/kWh)">
                                    <input style={inputStyle} type="number" value={custoKwh} onChange={e => setCustoKwh(e.target.value)} />
                                </InputGroup>
                                <InputGroup label="Selecionar Impressora">
                                    <select style={inputStyle} value={impressoraSelected} onChange={e => setImpressoraSelected(e.target.value)}>
                                        {Object.entries(PRINTER_DB).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}
                                    </select>
                                </InputGroup>
                            </div>
                        </div>

                        {/* DEPRECIAÇÃO */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>♨ Depreciação e Desgaste</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <InputGroup label="Depr. Impressora (R$/h)">
                                    <input style={inputStyle} type="number" value={depImpHoraria} onChange={e => setDepImpHoraria(e.target.value)} />
                                </InputGroup>
                                <InputGroup label="Depr. Máquina (R$/h)">
                                    <input style={inputStyle} type="number" value={depMaqHoraria} onChange={e => setDepMaqHoraria(e.target.value)} />
                                </InputGroup>
                                <InputGroup label="Bico/Mesa (R$/h)">
                                    <input style={inputStyle} type="number" value={desBicoHoraria} onChange={e => setDesBicoHoraria(e.target.value)} />
                                </InputGroup>
                            </div>
                        </div>

                        {/* RISCO E LOGÍSTICA */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>🚚 Risco e Logística</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <InputGroup label="Risco de Falha (%)">
                                    <input style={inputStyle} type="number" value={margemFalhas} onChange={e => setMargemFalhas(e.target.value)} />
                                </InputGroup>
                                <InputGroup label="Embalagem/Frete (R$)">
                                    <input style={inputStyle} type="number" value={freteEmbalagem} onChange={e => setFreteEmbalagem(e.target.value)} />
                                </InputGroup>
                            </div>
                        </div>

                        {/* MARGEM E PROJETO */}
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>🖋️ Margem e Projeto</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                <InputGroup label="Margem (%)">
                                    <input style={inputStyle} type="number" value={markup} onChange={e => setMarkup(e.target.value)} />
                                </InputGroup>
                                <InputGroup label="Nome do Produto / Projeto">
                                    <input style={inputStyle} value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} placeholder="Ex: Suporte para câmera" />
                                </InputGroup>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                <InputGroup label="Cores">
                                    <input style={inputStyle} value={cores} onChange={e => setCores(e.target.value)} placeholder="Ex: Preto, Branco" />
                                </InputGroup>
                                <InputGroup label="Quantidade (un.)">
                                    <input style={inputStyle} type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
                                </InputGroup>
                            </div>
                            <InputGroup label="Detalhes do Projeto" fullWidth>
                                <textarea
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                    value={detalhesProjeto}
                                    onChange={e => setDetalhesProjeto(e.target.value)}
                                    placeholder="Ex: Peça personalizada para fixação de câmera na parede..."
                                />
                            </InputGroup>
                        </div>
                    </section>
                </div>

                {/* COLUNA DIREITA - ANÁLISE E RESUMO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* CARD PREÇO SUGERIDO */}
                    <div className="glass-panel" style={{ padding: '2.5rem 2rem', borderRadius: '24px', textAlign: 'center', border: '1.5px solid var(--color-accent)', background: 'linear-gradient(180deg, rgba(0, 224, 255, 0.05) 0%, transparent 100%)' }}>
                        <p style={{ fontSize: '0.8rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Preço de Venda Sugerido</p>
                        <h2 style={{ fontSize: '3.5rem', color: 'var(--color-accent)', fontWeight: '900', margin: '0.5rem 0' }}>{fmt(resultados.precoTotalLote)}</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', backgroundColor: '#30363d', margin: '1.5rem 0 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid #30363d' }}>
                            <div style={{ backgroundColor: '#0d1117', padding: '12px' }}>
                                <p style={{ fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>Markup</p>
                                <p style={{ fontSize: '1rem', color: '#38bdf8', fontWeight: 'bold' }}>{markup}%</p>
                            </div>
                            <div style={{ backgroundColor: '#0d1117', padding: '12px' }}>
                                <p style={{ fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>Lucro</p>
                                <p style={{ fontSize: '1rem', color: '#10b981', fontWeight: 'bold' }}>{fmt(resultados.lucroLiquido)}</p>
                            </div>
                            <div style={{ backgroundColor: '#0d1117', padding: '12px' }}>
                                <p style={{ fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>Margem</p>
                                <p style={{ fontSize: '1rem', color: '#a855f7', fontWeight: 'bold' }}>{((resultados.lucroLiquido / (resultados.precoTotalLote || 1)) * 100).toFixed(0)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* GRÁFICO DE DISTRIBUIÇÃO */}
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <Zap size={18} color="var(--color-accent)" />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Distribuição de Custos</h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center' }}>
                            <DonutChart data={[
                                { name: 'Material', value: resultados.custoFilamento, color: '#31a7e2' },
                                { name: 'Energia', value: resultados.custoEnergia, color: '#eab308' },
                                { name: 'Impressora', value: resultados.custoDepImp, color: '#636e81' },
                                { name: 'Máquina', value: resultados.custoDepMaq, color: '#8b5cf6' },
                                { name: 'Hardware', value: resultados.custoDesBico, color: '#f59e0b' },
                                { name: 'Falha/Risco', value: resultados.custoFalhas, color: '#ef4444' },
                            ]} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: '#8b949e' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#31a7e2' }} /> Material</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#eab308' }} /> Energia</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#636e81' }} /> Impressora</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#8b5cf6' }} /> Máquina</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#f59e0b' }} /> Hardware</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#ef4444' }} /> Falha/Risco</div>
                            </div>
                        </div>
                    </div>

                    {/* ANÁLISE DETALHADA */}
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <TrendingUp size={18} color="var(--color-accent)" />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Detalhamento de Custos</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>❂ Produção Direta</p>
                                <AnalysisRow label="Material (Filamento)" value={resultados.custoFilamento} total={resultados.custoTotalLote} icon={<Circle size={14} />} color="#31a7e2" />
                                <AnalysisRow label="Energia Elétrica" value={resultados.custoEnergia} total={resultados.custoTotalLote} icon={<Zap size={14} />} color="#eab308" />
                            </div>

                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>🕒 Equipamento & Desgaste</p>
                                <AnalysisRow label="Depreciação Impressora" value={resultados.custoDepImp} total={resultados.custoTotalLote} icon={<Printer size={14} />} color="#636e81" />
                                <AnalysisRow label="Depreciação Máquina" value={resultados.custoDepMaq} total={resultados.custoTotalLote} icon={<Settings size={14} />} color="#8b5cf6" />
                                <AnalysisRow label="Desgaste Bico/Mesa" value={resultados.custoDesBico} total={resultados.custoTotalLote} icon={<Wrench size={14} />} color="#f59e0b" />
                            </div>

                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>⚠ Risco & Logística</p>
                                <AnalysisRow label="Risco de Falha" value={resultados.custoFalhas} total={resultados.custoTotalLote} icon={<AlertTriangle size={14} />} color="#ef4444" />
                                <AnalysisRow label="Embalagem/Frete" value={resultados.frete} total={resultados.custoTotalLote} icon={<Package size={14} />} color="#10b981" />
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '16px',
                                border: '1px solid #30363d', marginTop: '0.5rem'
                            }}>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <TrendingUp size={20} color="var(--color-accent)" /> CUSTO TOTAL
                                </div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>{fmt(resultados.custoTotalLote)}</div>
                            </div>
                        </div>
                    </div>

                    {/* AÇÕES */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <button onClick={saveBudget} className="btn-save" style={{ backgroundColor: '#f97316', padding: '14px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={18} /> Salvar
                        </button>
                        <button style={{ backgroundColor: '#10b981', padding: '14px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Download size={18} /> PDF
                        </button>
                        <button style={{ backgroundColor: '#22c55e', padding: '14px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Send size={18} /> WhatsApp
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
