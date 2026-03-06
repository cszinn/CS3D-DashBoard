import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { processGCodeFile } from '../lib/gcodeParser';
import {
    Printer,
    Trash2,
    Save,
    Plus,
    FileText,
    Zap,
    Package,
    TrendingUp,
    AlertTriangle,
    UploadCloud,
    CheckCircle2,
    Clock,
    ChevronDown
} from 'lucide-react';

const PRINTER_DB = {
    'custom': { name: '-- Personalizada / Outra --', watts: 0, price: 0, life: 1 },
    'ender3v3se': { name: 'Creality Ender 3 V3 SE', watts: 350, price: 2000, life: 5000 },
    'k1max': { name: 'Creality K1 Max', watts: 1000, price: 600, life: 5000 },
    'bambua1': { name: 'Bambu Lab A1', watts: 500, price: 5500, life: 5000 },
    'neptune4max': { name: 'Elegoo Neptune 4 Max', watts: 500, price: 3800, life: 5000 },
    'adventurer5m': { name: 'Flashforge Adventurer 5M Pro', watts: 350, price: 4200, life: 5000 }
};

export default function Calculator() {
    const { user } = useAuth();

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
    const [custoFixoMes, setCustoFixoMes] = useState(200);
    const [pecasEstMes, setPecasEstMes] = useState(50);
    const [valorImpressora, setValorImpressora] = useState(2000);
    const [vidaUtil, setVidaUtil] = useState(5000);
    const [margemFalhas, setMargemFalhas] = useState(10);

    // Acessórios
    const [acessorios, setAcessorios] = useState([]);
    const [novoAcessorioNome, setNovoAcessorioNome] = useState('');
    const [novoAcessorioCusto, setNovoAcessorioCusto] = useState('');

    // Config de Venda
    const [markup, setMarkup] = useState(100);
    const [imposto, setImposto] = useState(0);
    const [taxaMaquininha, setTaxaMaquininha] = useState(4.5);
    const [incluirTaxas, setIncluirTaxas] = useState(false);

    // Resultados
    const [resultados, setResultados] = useState({
        custoFilamento: 0,
        custoEnergia: 0,
        custoFixo: 0,
        custoDepreciacao: 0,
        custoAcessorios: 0,
        custoFalhas: 0,
        custoTotal: 0,
        precoVenda: 0,
        lucroLiquido: 0,
        markupReal: 0
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    // Efeito para carregar defaults do modelo de impressora
    useEffect(() => {
        if (impressoraSelected !== 'custom') {
            const p = PRINTER_DB[impressoraSelected];
            setConsumoW(p.watts);
            setValorImpressora(p.price);
            setVidaUtil(p.life);
        }
    }, [impressoraSelected]);

    // Efeito para Cálculo Real-time
    useEffect(() => {
        const tempoH = (parseFloat(horas) || 0) + ((parseFloat(minutos) || 0) / 60);
        const pesoNum = parseFloat(peso) || 0;
        const custoKgNum = parseFloat(custoKg) || 0;
        const consumoNum = parseFloat(consumoW) || 0;
        const custoKwhNum = parseFloat(custoKwh) || 0;
        const custoFixoMesNum = parseFloat(custoFixoMes) || 0;
        const pecasEstMesNum = parseFloat(pecasEstMes) || 0;
        const valorImpNum = parseFloat(valorImpressora) || 0;
        const vidaUtilNum = parseFloat(vidaUtil) || 1;
        const falhasNum = parseFloat(margemFalhas) || 0;
        const markupNum = parseFloat(markup) || 0;
        const impostoNum = parseFloat(imposto) || 0;
        const taxaNum = parseFloat(taxaMaquininha) || 0;
        const qtdNum = parseInt(quantidade) || 1;

        let totalAcessorios = acessorios.reduce((acc, curr) => acc + curr.custo, 0);

        const cFilamento = (custoKgNum / 1000) * pesoNum;
        const cEnergia = (consumoNum / 1000) * tempoH * custoKwhNum;
        const cFixoUn = pecasEstMesNum > 0 ? (custoFixoMesNum / pecasEstMesNum) : 0;
        const cDepreciacao = (valorImpNum / vidaUtilNum) * tempoH;

        const subtotal = cFilamento + cEnergia + cDepreciacao;
        const cFalhas = subtotal * (falhasNum / 100);

        const custoTotalProdLote = (subtotal + cFixoUn + totalAcessorios + cFalhas) * qtdNum;

        let basePrecoVenda = custoTotalProdLote * (1 + markupNum / 100);
        let precoFinal = basePrecoVenda;

        if (incluirTaxas) {
            const taxaTotalPercent = (impostoNum + taxaNum) / 100;
            if (taxaTotalPercent < 0.99) {
                precoFinal = basePrecoVenda / (1 - taxaTotalPercent);
            }
        }

        const impostosETaxas = precoFinal * ((impostoNum + taxaNum) / 100);
        const lucroLiq = precoFinal - custoTotalProdLote - impostosETaxas;

        setResultados({
            custoFilamento: cFilamento,
            custoEnergia: cEnergia,
            custoFixo: cFixoUn,
            custoDepreciacao: cDepreciacao,
            custoAcessorios: totalAcessorios,
            custoFalhas: cFalhas,
            custoTotal: custoTotalProdLote,
            precoVenda: precoFinal,
            lucroLiquido: lucroLiq,
            markupReal: custoTotalProdLote > 0 ? ((precoFinal - custoTotalProdLote) / custoTotalProdLote) * 100 : 0
        });

    }, [horas, minutos, peso, custoKg, consumoW, custoKwh, custoFixoMes, pecasEstMes, valorImpressora, vidaUtil, margemFalhas, acessorios, markup, imposto, taxaMaquininha, incluirTaxas, quantidade]);

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
        setAcessorios([...acessorios, {
            id: Date.now(),
            nome: novoAcessorioNome,
            custo: parseFloat(novoAcessorioCusto)
        }]);
        setNovoAcessorioNome('');
        setNovoAcessorioCusto('');
    };

    const removeAcessorio = (id) => {
        setAcessorios(acessorios.filter(a => a.id !== id));
    };

    const saveBudget = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('orcamentos').insert({
                user_id: user.id,
                nome_projeto: nomeProjeto || 'Sem Nome',
                cliente: cliente,
                quantidade: quantidade,
                peso_gramas: parseFloat(peso) || 0,
                tempo_horas: parseInt(horas) || 0,
                tempo_minutos: parseInt(minutos) || 0,
                custo_total_producao: resultados.custoTotal,
                preco_venda_final: resultados.precoVenda,
                lucro_liquido: resultados.lucroLiquido,
                detalhes_custos: {
                    filamento: resultados.custoFilamento,
                    energia: resultados.custoEnergia,
                    amortizacao: resultados.custoDepreciacao,
                    fixos: resultados.custoFixo,
                    acessorios: resultados.custoAcessorios,
                    falhas: resultados.custoFalhas,
                    markup_config: markup,
                    impostos_config: imposto
                }
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

    const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

    return (
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* Header */}
            <header style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Calculadora de Orçamentos</h2>
                <p style={{ color: '#8b949e' }}>Ajuste os parâmetros para obter o preço de venda ideal para sua impressão 3D.</p>
            </header>

            {msg.text && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 100,
                    backgroundColor: msg.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideIn 0.3s ease'
                }}>
                    {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: '2rem' }}>

                {/* Lado Esquerdo - Forms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Sessão 1: Modelo */}
                    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                        <SectionHeader icon={UploadCloud} title="Dados do Modelo (Automático)" />

                        <div
                            style={{
                                border: '2px dashed #30363d', borderRadius: '12px', padding: '2rem', textAlign: 'center',
                                backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', marginBottom: '2rem',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.backgroundColor = 'rgba(0, 224, 255, 0.03)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                        >
                            <UploadCloud size={32} color="#8b949e" style={{ marginBottom: '12px' }} />
                            <p style={{ fontSize: '0.95rem', color: '#c9d1d9', marginBottom: '4px' }}>Clique ou Arraste seu arquivo <strong>.gcode</strong> aqui</p>
                            <p style={{ fontSize: '0.8rem', color: '#8b949e' }}>Compatível com Cura, Prusa, Orca e Bambu</p>
                            <input type="file" ref={fileInputRef} accept=".gcode,.gco" style={{ display: 'none' }} onChange={handleFileUpload} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <InputGroup label="Nome do Projeto / Cliente" id="nome">
                                <input style={inputStyle} value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} placeholder="Ex: Suporte de Notebook" />
                            </InputGroup>
                            <InputGroup label="Quantidade" id="qtd">
                                <input style={inputStyle} type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
                            </InputGroup>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <InputGroup label="Tempo de Impressão" id="tempo">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <input style={inputStyle} type="number" value={horas} onChange={e => setHoras(e.target.value)} placeholder="0" />
                                        <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.75rem', color: '#8b949e' }}>h</span>
                                    </div>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <input style={inputStyle} type="number" value={minutos} onChange={e => setMinutos(e.target.value)} placeholder="0" />
                                        <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.75rem', color: '#8b949e' }}>m</span>
                                    </div>
                                </div>
                            </InputGroup>
                            <InputGroup label="Peso Estimado (g)" id="peso">
                                <div style={{ position: 'relative' }}>
                                    <input style={inputStyle} type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="0" />
                                    <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.75rem', color: '#8b949e' }}>g</span>
                                </div>
                            </InputGroup>
                        </div>
                    </section>

                    {/* Sessão 2: Custos e Impressora */}
                    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                        <SectionHeader icon={Printer} title="Custos e Equipamento" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            <InputGroup label="Custo por Kg de Filamento (R$)" fullWidth>
                                <div style={{ position: 'relative' }}>
                                    <input style={inputStyle} type="number" value={custoKg} onChange={e => setCustoKg(e.target.value)} />
                                    <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '0.85rem', color: '#8b949e' }}>R$</span>
                                </div>
                            </InputGroup>
                            <InputGroup label="Selecionar Impressora" fullWidth>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b949e\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                                    value={impressoraSelected}
                                    onChange={e => setImpressoraSelected(e.target.value)}
                                >
                                    {Object.entries(PRINTER_DB).map(([key, p]) => (
                                        <option key={key} value={key}>{p.name}</option>
                                    ))}
                                </select>
                            </InputGroup>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', padding: '1.5rem', backgroundColor: '#111418', borderRadius: '12px', border: '1px solid #232830' }}>
                            <InputGroup label="Consumo (W)">
                                <input style={inputStyle} type="number" value={consumoW} onChange={e => setConsumoW(e.target.value)} />
                            </InputGroup>
                            <InputGroup label="Custo Energia (kWh)">
                                <input style={inputStyle} type="number" value={custoKwh} onChange={e => setCustoKwh(e.target.value)} />
                            </InputGroup>
                            <InputGroup label="Margem Falhas (%)">
                                <input style={inputStyle} type="number" value={margemFalhas} onChange={e => setMargemFalhas(e.target.value)} />
                            </InputGroup>
                        </div>
                    </section>

                    {/* Sessão 3: Configuração Financeira */}
                    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                        <SectionHeader icon={TrendingUp} title="Configuração de Venda" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            <InputGroup label="Markup (%)">
                                <input style={inputStyle} type="number" value={markup} onChange={e => setMarkup(e.target.value)} />
                            </InputGroup>
                            <InputGroup label="Imposto (%)">
                                <input style={inputStyle} type="number" value={imposto} onChange={e => setImposto(e.target.value)} />
                            </InputGroup>
                            <InputGroup label="Taxa Cartão (%)">
                                <input style={inputStyle} type="number" value={taxaMaquininha} onChange={e => setTaxaMaquininha(e.target.value)} />
                            </InputGroup>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                id="inc"
                                checked={incluirTaxas}
                                onChange={e => setIncluirTaxas(e.target.checked)}
                                style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                            />
                            <label htmlFor="inc" style={{ fontSize: '0.9rem', color: '#c9d1d9', cursor: 'pointer' }}>Incluir impostos e taxas no cálculo do preço final</label>
                        </div>
                    </section>

                    {/* Sessão 4: Acessórios */}
                    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                        <SectionHeader icon={Package} title="Acessórios e Embalagem" />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {acessorios.map(a => (
                                <div key={a.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#111418', padding: '8px 12px', borderRadius: '8px', border: '1px solid #232830' }}>
                                    <span style={{ fontSize: '0.9rem', flex: 1 }}>{a.nome}</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-accent)' }}>{fmt(a.custo)}</span>
                                    <button onClick={() => removeAcessorio(a.id)} style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input style={{ ...inputStyle, flex: 3 }} placeholder="Nome (Ex: Caixa de Papelão)" value={novoAcessorioNome} onChange={e => setNovoAcessorioNome(e.target.value)} />
                            <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="Custo R$" value={novoAcessorioCusto} onChange={e => setNovoAcessorioCusto(e.target.value)} />
                            <button
                                onClick={addAcessorio}
                                style={{ padding: '10px 16px', backgroundColor: '#30363d', border: '1px solid #444c56', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </section>

                </div>

                {/* Lado Direito - Resumo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '24px', height: 'fit-content' }}>

                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-accent)', boxShadow: '0 0 40px rgba(0, 224, 255, 0.1)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Preço de Venda Sugerido</span>
                            <h2 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--color-accent)', marginTop: '0.5rem' }}>{fmt(resultados.precoVenda)}</h2>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '1rem' }}>
                                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                                    LUCRO: {fmt(resultados.lucroLiquido)}
                                </div>
                                <div style={{ backgroundColor: 'rgba(0, 224, 255, 0.1)', color: 'var(--color-accent)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                                    MARKUP: {resultados.markupReal.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <hr style={{ borderColor: '#232830', marginBottom: '1.5rem' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: '#8b949e' }}>Material (Filamento)</span>
                                <span>{fmt(resultados.custoFilamento)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: '#8b949e' }}>Energia Elétrica</span>
                                <span>{fmt(resultados.custoEnergia)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: '#8b949e' }}>Amortização Máquina</span>
                                <span>{fmt(resultados.custoDepreciacao)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: '#8b949e' }}>Acessórios</span>
                                <span>{fmt(resultados.custoAcessorios)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: '#8b949e' }}>Falhas e Riscos</span>
                                <span>{fmt(resultados.custoFalhas)}</span>
                            </div>

                            <div style={{ margin: '1rem 0', padding: '15px', backgroundColor: '#111418', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                                <span style={{ color: 'white' }}>Custo Total Produção</span>
                                <span style={{ color: 'white' }}>{fmt(resultados.custoTotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={saveBudget}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '14px', marginTop: '1rem',
                                backgroundColor: 'var(--color-accent)', color: '#060b14', fontWeight: '700', borderRadius: '12px',
                                border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                            }}
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar no Histórico'}
                        </button>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #232830' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1.25rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} /> Opções Rápidas
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button style={{ backgroundColor: '#181c22', border: '1px solid #30363d', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'not-allowed' }}>
                                Gerar PDF Cliente
                            </button>
                            <button style={{ backgroundColor: '#181c22', border: '1px solid #30363d', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'not-allowed' }}>
                                Enviar WhatsApp
                            </button>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#484f58', marginTop: '12px', textAlign: 'center' }}>PDF e WhatsApp estarão disponíveis após salvar o orçamento.</p>
                    </div>

                </div>

            </div>
        </div>
    );
}
