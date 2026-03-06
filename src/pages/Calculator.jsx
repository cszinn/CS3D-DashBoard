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
    DollarSign
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
    const [margemFalhas, setMargemFalhas] = useState(10);

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
        const cDepreciacao = (valorImpNum / vidaUtilNum) * tempoH;

        // Matemática Original: Custo Fixo rateado por unidade, adicionado uma única vez ao total do lote
        const cFixoCalculado = (pecasEstMesNum > 0 && custoFixoMesNum > 0) ? (custoFixoMesNum / pecasEstMesNum) : 0;

        const subtotal = cFilamento + cEnergia + cDepreciacao;
        const cFalhas = subtotal * (falhasNum / 100);

        // Custo do Lote = Soma de tudo (Tempo e Peso já são do lote total)
        const custoTotalLote = subtotal + cFixoCalculado + totalAcessorios + cFalhas;

        let basePrecoVenda = custoTotalLote * (1 + markupNum / 100);
        let precoFinal = basePrecoVenda;

        if (incluirTaxas) {
            const taxaTotalPercent = (impostoNum + taxaNum) / 100;
            if (taxaTotalPercent < 0.99) {
                precoFinal = basePrecoVenda / (1 - taxaTotalPercent);
            }
        }

        const descontosTaxas = precoFinal * ((impostoNum + taxaNum) / 100);
        const lucroLiq = precoFinal - custoTotalLote - descontosTaxas;

        setResultados({
            custoFilamento: cFilamento,
            custoEnergia: cEnergia,
            custoFixo: cFixoCalculado,
            custoDepreciacao: cDepreciacao,
            custoAcessorios: totalAcessorios,
            custoFalhas: cFalhas,
            custoTotalLote: custoTotalLote,
            custoUnitario: qtdNum > 0 ? custoTotalLote / qtdNum : 0,
            precoTotalLote: precoFinal,
            precoUnitario: qtdNum > 0 ? precoFinal / qtdNum : 0,
            lucroBruto: precoFinal - custoTotalLote,
            lucroLiquido: lucroLiq
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

    return (
        <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>

            <header style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>Calculadora de Orçamentos</h2>
                <p style={{ color: '#8b949e' }}>Obtenha precisão total baseada na sua calculadora original.</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Lado Esquerdo - Forms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <section className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                        <SectionHeader icon={UploadCloud} title="Modelo e Quantidade" />
                        <div
                            style={{ border: '2px dashed #30363d', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', marginBottom: '1.5rem' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud size={24} color="#8b949e" style={{ marginBottom: '8px' }} />
                            <p style={{ fontSize: '0.9rem', color: '#c9d1d9' }}>Solte o <strong>.gcode</strong> aqui</p>
                            <input type="file" ref={fileInputRef} accept=".gcode,.gco" style={{ display: 'none' }} onChange={handleFileUpload} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <InputGroup label="Projeto / Cliente"><input style={inputStyle} value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} placeholder="Ex: Miniatura Dragão" /></InputGroup>
                            <InputGroup label="Quantidade"><input style={inputStyle} type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} /></InputGroup>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <InputGroup label="Tempo Total (Lote)">
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input style={inputStyle} type="number" value={horas} onChange={e => setHoras(e.target.value)} placeholder="Hrs" />
                                    <input style={inputStyle} type="number" value={minutos} onChange={e => setMinutos(e.target.value)} placeholder="Min" />
                                </div>
                            </InputGroup>
                            <InputGroup label="Peso Total (Lote)">
                                <div style={{ position: 'relative' }}>
                                    <input style={inputStyle} type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Grams" />
                                    <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.75rem', color: '#8b949e' }}>g</span>
                                </div>
                            </InputGroup>
                        </div>
                    </section>

                    <section className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                        <SectionHeader icon={Printer} title="Custos e Equipamento" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <InputGroup label="Custo por Kg Filamento"><input style={inputStyle} type="number" value={custoKg} onChange={e => setCustoKg(e.target.value)} /></InputGroup>
                            <InputGroup label="Selecionar Impressora">
                                <select style={inputStyle} value={impressoraSelected} onChange={e => setImpressoraSelected(e.target.value)}>
                                    {Object.entries(PRINTER_DB).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}
                                </select>
                            </InputGroup>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: '#111418', borderRadius: '12px' }}>
                            <InputGroup label="Consumo (W)"><input style={inputStyle} type="number" value={consumoW} onChange={e => setConsumoW(e.target.value)} /></InputGroup>
                            <InputGroup label="Energia (kWh)"><input style={inputStyle} type="number" value={custoKwh} onChange={e => setCustoKwh(e.target.value)} /></InputGroup>
                            <InputGroup label="Falhas (%)"><input style={inputStyle} type="number" value={margemFalhas} onChange={e => setMargemFalhas(e.target.value)} /></InputGroup>
                        </div>
                    </section>

                    <section className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                        <SectionHeader icon={DollarSign} title="Custos Fixos Mentais" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <InputGroup label="Custo Fixo Mensal (R$)"><input style={inputStyle} type="number" value={custoFixoMes} onChange={e => setCustoFixoMes(e.target.value)} /></InputGroup>
                            <InputGroup label="Peças Est. / Mês"><input style={inputStyle} type="number" value={pecasEstMes} onChange={e => setPecasEstMes(e.target.value)} /></InputGroup>
                        </div>
                    </section>

                    <section className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                        <SectionHeader icon={TrendingUp} title="Configuração de Venda" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <InputGroup label="Markup (%)"><input style={inputStyle} type="number" value={markup} onChange={e => setMarkup(e.target.value)} /></InputGroup>
                            <InputGroup label="Imposto (%)"><input style={inputStyle} type="number" value={imposto} onChange={e => setImposto(e.target.value)} /></InputGroup>
                            <InputGroup label="Taxa Cartão (%)"><input style={inputStyle} type="number" value={taxaMaquininha} onChange={e => setTaxaMaquininha(e.target.value)} /></InputGroup>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={incluirTaxas} onChange={e => setIncluirTaxas(e.target.checked)} />
                            <label>Incluir taxas no cálculo do lucro</label>
                        </div>
                    </section>

                </div>

                {/* Lado Direito - Resumo de Preços (3 Colunas) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        📊 Resumo de Preços
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>

                        {/* Card 1: Produção */}
                        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #30363d' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: '#8b949e', textTransform: 'uppercase' }}>Custo Unitário (Produção)</p>
                                <h4 style={{ fontSize: '1.5rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>{fmt(resultados.custoUnitario)}</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Filamento</span><span>{fmt(resultados.custoFilamento)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Energia</span><span>{fmt(resultados.custoEnergia)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Custo Fixo</span><span>{fmt(resultados.custoFixo)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Amortização</span><span>{fmt(resultados.custoDepreciacao)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Acessórios</span><span>{fmt(resultados.custoAcessorios)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Falhas</span><span>{fmt(resultados.custoFalhas)}</span></div>
                                <hr style={{ border: '0', borderTop: '1px solid #232830' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                                    <span>Custo Total do Lote</span><span>{fmt(resultados.custoTotalLote)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 & 3 (Lojista/Consumidor) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #30363d' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#8b949e' }}>Preço Unitário (Lojista)</p>
                                    <h4 style={{ fontSize: '1.3rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>{fmt(resultados.precoUnitario)}</h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Lucro/Mão de Obra</span><span>{fmt(resultados.lucroBruto)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Lucro Líquido</span><span>{fmt(resultados.lucroLiquido)}</span></div>
                                    <hr style={{ border: '0', borderTop: '1px solid #232830' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                                        <span>Total do Lote</span><span>{fmt(resultados.precoTotalLote)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #30363d' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#8b949e' }}>Preço Unitário (Consumidor)</p>
                                    <h4 style={{ fontSize: '1.3rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>{fmt(resultados.precoUnitario)}</h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Lucro/Mão de Obra</span><span>{fmt(resultados.lucroBruto)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span color="#8b949e">Lucro Líquido</span><span>{fmt(resultados.lucroLiquido)}</span></div>
                                    <hr style={{ border: '0', borderTop: '1px solid #232830' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                                        <span>Total do Lote</span><span>{fmt(resultados.precoTotalLote)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                        <button onClick={saveBudget} className="btn-save" style={{ backgroundColor: '#f97316', color: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', border: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            <Save size={16} /> Salvar Interno
                        </button>
                        <button className="btn-export" style={{ backgroundColor: '#10b981', color: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'not-allowed', border: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            <Download size={16} /> PDF Cliente
                        </button>
                        <button className="btn-wa" style={{ backgroundColor: '#22c55e', color: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', border: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            <Send size={16} /> WhatsApp
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
