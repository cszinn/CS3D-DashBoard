import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { processGCodeFile } from '../lib/gcodeParser';
import jsPDF from 'jspdf';
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
    Wrench,
    Calculator as CalculatorIcon,
    History,
    ChartPie,
    Diamond,
    Palette,
    FileText
} from 'lucide-react';

const PRINTER_DB = {
    'custom': { name: '-- Personalizada / Outra --', watts: 0, price: 0, life: 1 },
    'ender3v3se': { name: 'Creality Ender 3 V3 SE', watts: 350, price: 2000, life: 5000 },
    'k1max': { name: 'Creality K1 Max', watts: 1000, price: 600, life: 5000 },
    'bambua1': { name: 'Bambu Lab A1', watts: 500, price: 5500, life: 5000 },
    'neptune4max': { name: 'Elegoo Neptune 4 Max', watts: 500, price: 3800, life: 5000 },
    'adventurer5m': { name: 'Flashforge Adventurer 5M Pro', watts: 350, price: 4200, life: 5000 }
};

const SectionHeader = ({ icon: Icon, title, iconColor = "text-primary" }) => (
    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', color: 'white' }}>
        <Icon size={20} className={iconColor} /> {title}
    </h3>
);

const SubHeader = ({ icon: Icon, title, iconColor = "text-muted-foreground" }) => (
    <h4 className="text-muted-foreground" style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <Icon size={14} className={iconColor} /> {title}
    </h4>
);

const InputGroup = ({ label, id, children, fullWidth = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: fullWidth ? '100%' : 'auto', flex: fullWidth ? 'none' : 1 }}>
        <label htmlFor={id} className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>{label}</label>
        {children}
    </div>
);

const inputStyle = {
    height: '40px',
    padding: '8px 12px',
    backgroundColor: 'var(--color-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s ease'
};

const fmt = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Calculator() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('cliente'); // 'cliente' ou 'producao'

    // --- LER RASCUNHO SALVO ---
    const [initialDraft] = useState(() => {
        try {
            const item = localStorage.getItem('@stlhub:calcDraft');
            return item ? JSON.parse(item) : {};
        } catch {
            return {};
        }
    });

    // States para Dados do Modelo
    const [nomeProjeto, setNomeProjeto] = useState(initialDraft.nomeProjeto ?? '');
    const [cliente, setCliente] = useState(initialDraft.cliente ?? '');
    const [quantidade, setQuantidade] = useState(initialDraft.quantidade ?? 1);
    const [horas, setHoras] = useState(initialDraft.horas ?? '');
    const [minutos, setMinutos] = useState(initialDraft.minutos ?? '');
    const [peso, setPeso] = useState(initialDraft.peso ?? '');

    // States para Custos
    const [custoKg, setCustoKg] = useState(initialDraft.custoKg ?? 100);
    const [impressoraSelected, setImpressoraSelected] = useState(initialDraft.impressoraSelected ?? 'custom');
    const [consumoW, setConsumoW] = useState(initialDraft.consumoW ?? 350);
    const [custoKwh, setCustoKwh] = useState(initialDraft.custoKwh ?? 0.85);
    const [custoFixoMes, setCustoFixoMes] = useState(0);
    const [pecasEstMes, setPecasEstMes] = useState(50);
    const [valorImpressora, setValorImpressora] = useState(2000);
    const [vidaUtil, setVidaUtil] = useState(5000);
    const [margemFalhas, setMargemFalhas] = useState(initialDraft.margemFalhas ?? 5);

    // Novos Campos Granulares (STLHub)
    const [depImpHoraria, setDepImpHoraria] = useState(initialDraft.depImpHoraria ?? 0.3);
    const [depMaqHoraria, setDepMaqHoraria] = useState(initialDraft.depMaqHoraria ?? 0.2);
    const [desBicoHoraria, setDesBicoHoraria] = useState(initialDraft.desBicoHoraria ?? 0.1);
    const [freteEmbalagem, setFreteEmbalagem] = useState(initialDraft.freteEmbalagem ?? 0);
    const [cores, setCores] = useState(initialDraft.cores ?? '');
    const [detalhesProjeto, setDetalhesProjeto] = useState(initialDraft.detalhesProjeto ?? '');

    // Acessórios
    const [acessorios, setAcessorios] = useState(initialDraft.acessorios ?? []);
    const [novoAcessorioNome, setNovoAcessorioNome] = useState('');
    const [novoAcessorioCusto, setNovoAcessorioCusto] = useState('');

    // Config de Venda
    const [markup, setMarkup] = useState(initialDraft.markup ?? 100);
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

    // States para Projetos Salvos (Tab: Projetos Recentes)
    const [savedProjects, setSavedProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // --- RASCUNHO AUTOMÁTICO (LOCALSTORAGE) ---
    // (A leitura agora ocorre no momento inicial da declaração dos states para evitar race conditions)


    useEffect(() => {
        const draft = {
            nomeProjeto, cliente, quantidade, horas, minutos, peso,
            custoKg, impressoraSelected, consumoW, custoKwh, margemFalhas,
            depImpHoraria, depMaqHoraria, desBicoHoraria, freteEmbalagem, cores, detalhesProjeto, markup, acessorios
        };
        localStorage.setItem('@stlhub:calcDraft', JSON.stringify(draft));
    }, [nomeProjeto, cliente, quantidade, horas, minutos, peso, custoKg, impressoraSelected, consumoW, custoKwh, margemFalhas, depImpHoraria, depMaqHoraria, desBicoHoraria, freteEmbalagem, cores, detalhesProjeto, markup, acessorios]);

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

    // --- COPIAR PARA WHATSAPP ---
    const copyToWhatsapp = () => {
        const nome = nomeProjeto || 'Sem Nome';
        const qtd = quantidade || 1;
        const precoUnit = fmt(resultados.precoUnitario);
        const precoTotal = fmt(resultados.precoTotalLote);
        const pesoPeca = peso || 0;

        const text = `🤖 *Orçamento Impressão 3D*\n📦 *Modelo:* ${nome}\n🔢 *Qtd:* ${qtd} un.\n⚖️ *Peso Est:* ${pesoPeca}g\n💰 *Unitário:* ${precoUnit}\n\n✅ *VALOR TOTAL:* ${precoTotal}\n\n_Orçamento válido por 7 dias._`;

        navigator.clipboard.writeText(text).then(() => {
            setMsg({ type: 'success', text: 'Resumo copiado para a Área de Transferência!' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        }).catch(err => {
            setMsg({ type: 'error', text: 'Erro ao copiar: ' + err });
        });
    };

    // --- GERADOR DE PDF ---
    const exportPDF = (type) => {
        const doc = new jsPDF();

        const nome = nomeProjeto || 'Sem Nome';
        const qtd = quantidade || 1;

        let y = 20; const marginL = 20; const marginR = 190;
        const line = (l, v, b = false, c = [0, 0, 0]) => {
            doc.setFont("helvetica", b ? "bold" : "normal"); doc.setTextColor(...c);
            doc.text(l, marginL, y);
            doc.setFont("helvetica", b ? "bold" : "normal");
            doc.text(v.toString(), marginR, y, { align: "right" });
            y += 10;
        };
        const sep = () => { doc.setDrawColor(200); doc.line(marginL, y - 5, marginR, y - 5); y += 5; };

        doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(20);
        doc.text(type === 'cliente' ? "Orçamento de Impressão 3D" : "Relatório Interno de Custos", marginL, y); y += 15;

        doc.setFontSize(12); doc.setTextColor(100);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginL, y); y += 7;
        doc.text(`Projeto: ${nome}`, marginL, y); y += 15; sep();

        doc.setFontSize(14); doc.setTextColor(0); doc.text("Detalhes do Modelo", marginL, y); y += 10;
        doc.setFontSize(11);
        line("Quantidade:", `${qtd} un.`);
        line("Peso Estimado:", `${peso || 0} g`);
        if (type !== 'cliente') line("Tempo de Impressão:", `${horas || 0}h ${minutos || 0}m`);
        y += 5; sep();

        doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold");

        if (type === 'cliente') {
            doc.text("Valores", marginL, y); y += 15; doc.setFontSize(12);
            line("Preço Unitário:", fmt(resultados.precoUnitario)); y += 5;
            doc.setFillColor(245); doc.rect(marginL - 2, y - 8, 175, 14, 'F'); doc.setFontSize(14);
            line("VALOR TOTAL:", fmt(resultados.precoTotalLote), true, [0, 80, 180]);
            y += 20; doc.setFontSize(9); doc.setTextColor(150);
            doc.text("Orçamento válido por 7 dias.", 105, y, { align: 'center' });
        } else {
            doc.text("Detalhamento de Custos (Lote)", marginL, y); y += 15; doc.setFontSize(11);
            line("Custo Filamento:", fmt(resultados.custoFilamento));
            line("Custo Energia:", fmt(resultados.custoEnergia));
            const custoEquipamentos = resultados.custoDepImp + resultados.custoDepMaq + resultados.custoDesBico + resultados.custoAcessorios;
            line("Equipamentos/Logística:", fmt(custoEquipamentos));
            line("Risco/Falhas:", fmt(resultados.custoFalhas));
            line("Custo Total de Produção:", fmt(resultados.custoTotalLote), true); y += 10;

            doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text("Análise Financeira", marginL, y); y += 15; doc.setFontSize(11);
            line("Custo Unitário (Prod):", fmt(resultados.custoUnitario));
            line("Lucro Líquido Previsto:", fmt(resultados.lucroLiquido), true, [0, 150, 0]); y += 5;
            doc.setFillColor(245); doc.rect(marginL - 2, y - 8, 175, 14, 'F'); doc.setFontSize(14);
            line("PREÇO FINAL DE VENDA:", fmt(resultados.precoTotalLote), true, [0, 86, 179]);
        }
        doc.save(`${type}_${nome}.pdf`);
    };

    const addAcessorio = () => {
        if (!novoAcessorioNome || !novoAcessorioCusto) return;
        setAcessorios([...acessorios, { id: Date.now(), nome: novoAcessorioNome, custo: parseFloat(novoAcessorioCusto) }]);
        setNovoAcessorioNome('');
        setNovoAcessorioCusto('');
    };

    const removeAcessorio = (id) => setAcessorios(acessorios.filter(a => a.id !== id));

    const saveOrcamento = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('orcamentos').insert({
                user_id: user.id,
                nome_projeto: nomeProjeto || 'Sem Nome',
                cliente: cliente || '',
                quantidade: quantidade,
                peso_gramas: parseFloat(peso) || 0,
                tempo_horas: parseInt(horas) || 0,
                tempo_minutos: parseInt(minutos) || 0,
                custo_total_producao: resultados.custoTotalLote,
                preco_venda_final: resultados.precoTotalLote,
                lucro_liquido: resultados.lucroLiquido,
                detalhes_custos: {
                    ...resultados,
                    cores, detalhesProjeto, custoKg, impressoraSelected, consumoW, custoKwh,
                    margemFalhas, depImpHoraria, depMaqHoraria, desBicoHoraria, freteEmbalagem,
                    acessorios, markup, imposto, taxaMaquininha, incluirTaxas
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

    // --- BUSCAR PROJETOS RECENTES ---
    const fetchProjects = async () => {
        if (!user) return;
        setLoadingProjects(true);
        try {
            const { data, error } = await supabase
                .from('orcamentos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedProjects(data || []);
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao carregar projetos: ' + err.message });
        } finally {
            setLoadingProjects(false);
        }
    };

    // Efeito para buscar projetos quando a aba "producao" for ativada
    useEffect(() => {
        if (activeTab === 'producao') {
            fetchProjects();
        }
    }, [activeTab]);

    // --- CARREGAR PROJETO PARA A CALCULADORA ---
    const loadProject = (proj) => {
        setNomeProjeto(proj.nome_projeto || '');
        setCliente(proj.cliente || '');
        setQuantidade(proj.quantidade || 1);
        setHoras(proj.tempo_horas?.toString() || '');
        setMinutos(proj.tempo_minutos?.toString() || '');
        setPeso(proj.peso_gramas?.toString() || '');

        if (proj.detalhes_custos) {
            const dc = proj.detalhes_custos;
            setCustoKg(dc.custoKg ?? 100);
            setImpressoraSelected(dc.impressoraSelected || 'custom');

            // Usamos setTimeout para garantir que o consumoW sobrescreva um possível trigger do useEffect(impressoraSelected) caso o React tente recomeçar pelo preset.
            setTimeout(() => {
                if (dc.consumoW !== undefined) setConsumoW(dc.consumoW);
            }, 50);

            setCustoKwh(dc.custoKwh ?? 0.85);
            setMargemFalhas(dc.margemFalhas ?? 5);
            setDepImpHoraria(dc.depImpHoraria ?? 0.3);
            setDepMaqHoraria(dc.depMaqHoraria ?? 0.2);
            setDesBicoHoraria(dc.desBicoHoraria ?? 0.1);
            setFreteEmbalagem(dc.freteEmbalagem ?? 0);
            setCores(dc.cores || '');
            setDetalhesProjeto(dc.detalhesProjeto || '');
            setAcessorios(dc.acessorios || []);
            setMarkup(dc.markup ?? 100);
            setImposto(dc.imposto ?? 0);
            setTaxaMaquininha(dc.taxaMaquininha ?? 0);
            setIncluirTaxas(dc.incluirTaxas ?? false);
        }
        setActiveTab('cliente');
        setMsg({ type: 'success', text: `Projeto "${proj.nome_projeto || 'Carregado'}" carregado!` });
        setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    };

    // --- DELETAR PROJETO ---
    const deleteProject = async (id, e) => {
        e.stopPropagation(); // Evita que o click do card dispare o Load
        if (!window.confirm("Deseja realmente excluir este orçamento salvo?")) return;

        try {
            const { error } = await supabase.from('orcamentos').delete().eq('id', id);
            if (error) throw error;
            setSavedProjects(savedProjects.filter(p => p.id !== id));
            setMsg({ type: 'success', text: 'Projeto excluído com sucesso!' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao excluir: ' + err.message });
        }
    };

    // --- COMPONENTES AUXILIARES DE UI (ESTILO PREMIUM) ---
    const SummaryPill = ({ label, value, colorHex, colorRGB }) => (
        <div style={{
            backgroundColor: `rgba(${colorRGB}, 0.1)`,
            border: `1px solid rgba(${colorRGB}, 0.2)`,
            borderRadius: '12px',
            padding: '10px 16px',
            minWidth: '90px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <p className="uppercase font-bold" style={{ fontSize: '10px', color: colorHex, opacity: 0.8, letterSpacing: '0.05em', margin: 0, marginBottom: '4px' }}>{label}</p>
            <p className="font-bold font-mono" style={{ fontSize: '15px', color: colorHex, margin: 0, lineHeight: 1 }}>{value}</p>
        </div>
    );

    const AnalysisRow = ({ label, value, total, icon, color }) => {
        const percent = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span style={{ color }}>{icon}</span> {label}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">{percent.toFixed(1)}%</span>
                        <span className="font-bold font-mono">{fmt(value)}</span>
                    </div>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
                </div>
            </div>
        );
    };



    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 min-h-[40px] ${activeTab === id
                ? 'bg-primary/10 text-primary border border-primary/50 shadow-[0_0_15px_rgba(0,224,255,0.1)]'
                : 'text-muted-foreground hover:bg-secondary border border-transparent'
                }`}
            style={activeTab === id
                ? { backgroundColor: 'rgba(0, 224, 255, 0.1)', borderColor: 'var(--color-accent)', color: 'var(--color-accent)', padding: '8px 12px', flex: 1 }
                : { padding: '8px 12px', flex: 1 }}
        >
            <Icon size={16} style={{ flexShrink: 0 }} /> <span style={{ lineHeight: 1.2 }}>{label}</span>
        </button>
    );

    const CostDistributionGroup = ({ data }) => {
        const [hoveredSlice, setHoveredSlice] = useState(null);
        const [activeTooltip, setActiveTooltip] = useState({ slice: null, left: '50%', top: '50%', opacity: 0 });

        const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
        let cumulativePercent = 0;

        const getCoordinatesForPercent = (percent, radius) => {
            const x = Math.cos(2 * Math.PI * percent) * radius;
            const y = Math.sin(2 * Math.PI * percent) * radius;
            return [x, y];
        };

        const handleMouseEnter = (i) => {
            setHoveredSlice(i);

            let curr = 0;
            for (let j = 0; j < i; j++) {
                curr += data[j].value / total;
            }
            const midPercent = curr + (data[i].value / total) / 2;
            const angle = 2 * Math.PI * midPercent;

            // X e Y originais na perspectiva do plano cartesiano
            const x = Math.cos(angle);
            const y = Math.sin(angle);

            // Aplica a rotação visual de -90 graus (-PI/2) para igualar o gráfico
            const vx = y;
            const vy = -x;

            // A âncora real do componente é fixa no centro da DIV
            const left = '50%';
            const top = '50%';

            // O raio define a quantidade de PIXELS REAIS para empurrar o tooltip do centro direção à borda
            // Uma rosca de w-40 (160px) tem raio 80px. 60px vai deixá-lo pousado visualmente no meio da cor.
            const pushRadius = 60;
            const transform = `translate(calc(-50% + ${vx * pushRadius}px), calc(-50% + ${vy * pushRadius}px))`;

            setActiveTooltip({ slice: i, left, top, transform, opacity: 1 });
        };

        const handleMouseLeave = () => {
            setHoveredSlice(null);
            setActiveTooltip(prev => ({ ...prev, opacity: 0 }));
        };

        return (
            <div className="flex justify-start items-center w-full px-4 md:px-8 chart-layout" style={{ position: 'relative', minHeight: '220px' }}>
                {/* GRÁFICO (Menor e alinhado mais à esquerda) */}
                <div className="w-32 h-32 md:w-40 md:h-40 chart-donut" style={{ marginLeft: '5%' }}>
                    <div className="relative w-full h-full aspect-square max-w-[280px] mx-auto" onMouseLeave={handleMouseLeave}>
                        <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', overflow: 'visible' }}>
                            {data.map((slice, i) => {
                                if (slice.value === 0) return null;

                                const startPercent = cumulativePercent;
                                const endPercent = cumulativePercent + (slice.value / total);
                                cumulativePercent = endPercent;

                                const isFullCircle = (slice.value / total) > 0.999;
                                const safeEndPercent = isFullCircle ? endPercent - 0.0001 : endPercent;

                                const [startX_out, startY_out] = getCoordinatesForPercent(startPercent, 1);
                                const [endX_out, endY_out] = getCoordinatesForPercent(safeEndPercent, 1);
                                const [startX_in, startY_in] = getCoordinatesForPercent(startPercent, 0.65);
                                const [endX_in, endY_in] = getCoordinatesForPercent(safeEndPercent, 0.65);

                                const largeArcFlag = (slice.value / total) > 0.5 ? 1 : 0;

                                const pathData = [
                                    `M ${startX_out} ${startY_out}`,
                                    `A 1 1 0 ${largeArcFlag} 1 ${endX_out} ${endY_out}`,
                                    `L ${endX_in} ${endY_in}`,
                                    `A 0.65 0.65 0 ${largeArcFlag} 0 ${startX_in} ${startY_in}`,
                                    `Z`
                                ].join(' ');

                                const isHovered = hoveredSlice === i;

                                return (
                                    <path
                                        key={i}
                                        d={pathData}
                                        fill={slice.color}
                                        stroke={isHovered ? '#ffffff' : 'var(--color-bg-card)'}
                                        strokeWidth={isHovered ? '0.025' : '0.015'}
                                        strokeLinejoin="round"
                                        style={{
                                            transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                                            transformOrigin: '0 0',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={() => handleMouseEnter(i)}
                                    />
                                );
                            })}
                        </svg>

                        <div style={{
                            position: 'absolute',
                            top: activeTooltip.top,
                            left: activeTooltip.left,
                            transform: activeTooltip.transform || 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            backgroundColor: '#161b22',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: '1px solid #30363d',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            zIndex: 50,
                            whiteSpace: 'nowrap',
                            opacity: activeTooltip.opacity,
                            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease',
                        }}>
                            {activeTooltip.slice !== null && (
                                <>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'white', margin: 0, marginBottom: '4px' }}>
                                        {data[activeTooltip.slice].name}
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#8b949e', margin: 0 }}>
                                        R$ {data[activeTooltip.slice].value.toFixed(2)} ({((data[activeTooltip.slice].value / total) * 100).toFixed(1)}%)
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* LEGENDA (Maior e centralizada na direita) */}
                <div className="recharts-legend-wrapper chart-legend" style={{ position: 'absolute', width: 'auto', height: 'auto', right: '10%', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', paddingLeft: '10px' }}>
                    <ul className="recharts-default-legend" style={{ padding: '0px', margin: '0px', textAlign: 'left', listStyle: 'none' }}>
                        {data.map((item, index) => {
                            const isHovered = hoveredSlice === index;
                            return (
                                <li
                                    key={item.name}
                                    className={`recharts-legend-item legend-item-${index}`}
                                    style={{
                                        display: 'block', marginRight: '10px', marginBottom: '4px',
                                        cursor: 'pointer',
                                        fontWeight: isHovered ? 'bold' : 'normal',
                                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <svg className="recharts-surface" width="8" height="8" viewBox="0 0 32 32" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                        <title></title><desc></desc>
                                        <path fill={item.color} cx="16" cy="16" className="recharts-symbols" transform="translate(16, 16)" d="M16,0A16,16,0,1,1,-16,0A16,16,0,1,1,16,0"></path>
                                    </svg>
                                    <span className="recharts-legend-item-text" style={{ color: isHovered ? '#ffffff' : item.color, transition: 'color 0.2s' }}>{item.name}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        );
    };

    const costDistributionData = [
        { name: 'Material', value: resultados.custoFilamento, color: '#0ea5e9' },
        { name: 'Energia', value: resultados.custoEnergia, color: '#eab308' },
        { name: 'Impressora', value: resultados.custoDepImp, color: '#64748b' },
        { name: 'Máquina', value: resultados.custoDepMaq, color: '#8b5cf6' },
        { name: 'Hardware', value: resultados.custoDesBico, color: '#f97316' },
        { name: 'Falha/Risco', value: resultados.custoFalhas, color: '#ef4444' },
        { name: 'Emb/Frete', value: resultados.frete + resultados.custoAcessorios, color: '#22c55e' },
    ].sort((a, b) => b.value - a.value);

    return (
        <div style={{ color: 'white', width: '100%', margin: '0', paddingBottom: '4rem' }}>

            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px', color: 'white' }}>Calculadora de Preços</h1>
                <p style={{ color: '#8b949e', fontSize: '1rem' }}>Calcule o custo total de impressão dos seus modelos STL</p>

                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '1.5rem', width: '100%' }}>
                    <TabButton id="cliente" label="Orçamento" icon={CalculatorIcon} />
                    <TabButton id="producao" label="Projetos Salvos" icon={History} />
                </div>
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

            {activeTab === 'cliente' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                    {/* COLUNA ESQUERDA - INPUTS CATEGORIZADOS */}
                    <div className="space-y-6">
                        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-lg shadow-black/20 glow-border p-6 space-y-6">

                            {/* IDENTIFICAÇÃO DO PROJETO */}
                            <div className="space-y-3">
                                <SubHeader icon={FileText} title="Identificação do Projeto" iconColor="text-primary" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Nome da Peça / Projeto">
                                        <input style={inputStyle} placeholder="Ex: Suporte para câmera" value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} />
                                    </InputGroup>
                                    <InputGroup label="Cliente (Opcional)">
                                        <input style={inputStyle} placeholder="Ex: João Silva" value={cliente} onChange={e => setCliente(e.target.value)} />
                                    </InputGroup>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <InputGroup label="Detalhes do Projeto">
                                        <input style={inputStyle} placeholder="Opcional: Acabamento liso, etc." value={detalhesProjeto} onChange={e => setDetalhesProjeto(e.target.value)} />
                                    </InputGroup>
                                    <InputGroup label="Quantidade (un.)">
                                        <input style={inputStyle} type="number" min="1" placeholder="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
                                    </InputGroup>
                                </div>
                            </div>

                            {/* MATERIAL */}
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <SubHeader icon={Package} title="Material" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <InputGroup label="Tipo de Filamento">
                                        <select style={inputStyle} defaultValue="PLA">
                                            <option value="PLA" style={{ backgroundColor: '#1e293b', color: 'white' }}>PLA</option>
                                            <option value="ABS" style={{ backgroundColor: '#1e293b', color: 'white' }}>ABS</option>
                                            <option value="PETG" style={{ backgroundColor: '#1e293b', color: 'white' }}>PETG</option>
                                            <option value="TPU" style={{ backgroundColor: '#1e293b', color: 'white' }}>TPU</option>
                                            <option value="Outros" style={{ backgroundColor: '#1e293b', color: 'white' }}>Outros</option>
                                        </select>
                                    </InputGroup>
                                    <InputGroup label="Cor">
                                        <div style={{ position: 'relative' }}>
                                            <input style={inputStyle} placeholder="Ex: Preto" value={cores} onChange={e => setCores(e.target.value)} />
                                            <Palette size={14} style={{ position: 'absolute', right: '12px', top: '13px', color: '#8b949e' }} />
                                        </div>
                                    </InputGroup>
                                    <InputGroup label="Custo (R$/kg)">
                                        <input style={inputStyle} type="number" value={custoKg} onChange={e => setCustoKg(e.target.value)} />
                                    </InputGroup>
                                    <InputGroup label="Peso da Peça (g)">
                                        <input style={inputStyle} type="number" value={peso} onChange={e => setPeso(e.target.value)} />
                                    </InputGroup>
                                </div>
                            </div>

                            {/* TEMPO E ENERGIA */}
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <SubHeader icon={Clock} title="Tempo e Energia" iconColor="text-primary" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Tempo de Impressão">
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <input style={{ ...inputStyle, paddingRight: '1.75rem', width: '100%' }} type="number" value={horas} onChange={e => setHoras(e.target.value)} placeholder="0" />
                                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#8b949e', fontWeight: 'bold', pointerEvents: 'none' }}></span>
                                            </div>
                                            <div className="flex-1 relative">
                                                <input style={{ ...inputStyle, paddingRight: '1.75rem', width: '100%' }} type="number" value={minutos} onChange={e => setMinutos(e.target.value)} placeholder="0" />
                                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#8b949e', fontWeight: 'bold', pointerEvents: 'none' }}></span>
                                            </div>
                                        </div>
                                    </InputGroup>
                                    <InputGroup label="Potência da Impressora (W)">
                                        <input style={inputStyle} type="number" value={consumoW} onChange={e => setConsumoW(e.target.value)} />
                                    </InputGroup>
                                    <InputGroup label="Custo da Energia (R$/kWh)">
                                        <input style={inputStyle} type="number" value={custoKwh} onChange={e => setCustoKwh(e.target.value)} step="0.01" />
                                    </InputGroup>
                                </div>
                            </div>

                            {/* DEPRECIAÇÃO E DESGASTE */}
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <SubHeader icon={Printer} title="Depreciação e Desgaste" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputGroup label="Depreciação Impressora (R$/h)">
                                        <input style={inputStyle} type="number" value={depImpHoraria} onChange={e => setDepImpHoraria(e.target.value)} step="0.1" />
                                    </InputGroup>
                                    <InputGroup label="Depreciação Máquina (R$/h)">
                                        <input style={inputStyle} type="number" value={depMaqHoraria} onChange={e => setDepMaqHoraria(e.target.value)} step="0.1" />
                                    </InputGroup>
                                    <InputGroup label="Desgaste Bico/Mesa (R$/h)">
                                        <input style={inputStyle} type="number" value={desBicoHoraria} onChange={e => setDesBicoHoraria(e.target.value)} step="0.05" />
                                    </InputGroup>
                                </div>
                            </div>

                            {/* RISCO E LOGÍSTICA */}
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <SubHeader icon={AlertTriangle} title="Risco e Logística" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Risco de Falha (%)">
                                        <input style={inputStyle} type="number" value={margemFalhas} onChange={e => setMargemFalhas(e.target.value)} />
                                    </InputGroup>
                                    <InputGroup label="Embalagem/Frete (R$)">
                                        <input style={inputStyle} type="number" value={freteEmbalagem} onChange={e => setFreteEmbalagem(e.target.value)} step="0.5" />
                                    </InputGroup>
                                </div>
                            </div>

                            {/* MARGEM DE LUCRO */}
                            <div className="space-y-3 pt-4 border-t border-border/50">
                                <SubHeader icon={DollarSign} title="Margem de Lucro" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="Margem (%)">
                                        <input style={inputStyle} type="number" value={markup} onChange={e => setMarkup(e.target.value)} />
                                    </InputGroup>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COLUNA DIREITA - ANÁLISE E RESUMO */}
                    <div className="space-y-6 sticky top-6">

                        {/* CARD PREÇO SUGERIDO */}
                        <div
                            className="rounded-xl overflow-hidden py-10"
                            style={{
                                minHeight: '220px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: 'rgba(6, 208, 249, 0.05)',
                                border: '1px solid rgba(6, 208, 249, 0.3)',
                                boxShadow: 'inset 0 0 40px rgba(6, 208, 249, 0.05), 0 0 15px rgba(6, 208, 249, 0.1)',
                                transition: 'all 0.3s ease',
                                padding: '32px 16px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = 'inset 0 0 60px rgba(6, 208, 249, 0.1), 0 0 25px rgba(6, 208, 249, 0.2)';
                                e.currentTarget.style.border = '1px solid rgba(6, 208, 249, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'inset 0 0 40px rgba(6, 208, 249, 0.05), 0 0 15px rgba(6, 208, 249, 0.1)';
                                e.currentTarget.style.border = '1px solid rgba(6, 208, 249, 0.3)';
                            }}
                        >
                            <div className="text-center space-y-2 relative z-10 w-full flex flex-col items-center">
                                <p style={{
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'rgb(123, 137, 157)',
                                    letterSpacing: '0.7px',
                                    textTransform: 'uppercase',
                                    lineHeight: '20px',
                                    margin: '0 auto',
                                    textAlign: 'center',
                                    display: 'block',
                                    width: '100%'
                                }}>Preço de Venda Sugerido</p>

                                <div className="flex justify-center items-center gap-4" style={{ marginTop: '24px', marginBottom: quantidade > 1 ? '16px' : '40px' }}>
                                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '48px', fontWeight: '700', color: 'rgb(6, 208, 249)' }}>R$</span>
                                    <h2 style={{
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontSize: '48px',
                                        fontWeight: '700',
                                        color: 'rgb(6, 208, 249)',
                                        lineHeight: '48px',
                                        margin: 0
                                    }}>{fmt(resultados.precoTotalLote).replace('R$', '').trim()}</h2>
                                </div>

                                {parseInt(quantidade || 1) > 1 && (
                                    <p style={{
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontSize: '16px',
                                        color: 'rgba(6, 208, 249, 0.9)',
                                        margin: '0 auto 40px auto',
                                        textAlign: 'center',
                                        fontWeight: '700',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {fmt(resultados.precoUnitario)} por peça
                                    </p>
                                )}

                                <div className="flex justify-center gap-4 mt-4">
                                    {/* MARKUP PILL */}
                                    <SummaryPill
                                        label="Markup"
                                        value={`${(resultados.precoTotalLote / (resultados.custoTotalLote || 1)).toFixed(2)}x`}
                                        colorHex="rgb(37, 99, 235)"
                                        colorRGB="59, 130, 246"
                                    />

                                    {/* LUCRO PILL */}
                                    <SummaryPill
                                        label="Lucro"
                                        value={fmt(resultados.lucroLiquido)}
                                        colorHex="rgb(16, 185, 129)"
                                        colorRGB="16, 185, 129"
                                    />

                                    {/* MARGEM PILL */}
                                    <SummaryPill
                                        label="Margem"
                                        value={`${((resultados.lucroLiquido / (resultados.precoTotalLote || 1)) * 100).toFixed(0)}%`}
                                        colorHex="rgb(168, 85, 247)"
                                        colorRGB="168, 85, 247"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* GRÁFICO DE DISTRIBUIÇÃO */}
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-lg shadow-black/20 glow-border p-6 space-y-6">
                            <SectionHeader icon={ChartPie} title="Distribuição de Custos" />
                            <CostDistributionGroup data={costDistributionData} />
                        </div>

                        {/* ANÁLISE DETALHADA */}
                        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-lg shadow-black/20 glow-border p-6 space-y-6">
                            <SectionHeader icon={TrendingUp} title="Análise de Custos" />
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <SubHeader icon={Zap} title="Produção Direta" />
                                    <AnalysisRow label="Material (Filamento)" value={resultados.custoFilamento} total={resultados.custoTotalLote} icon={<Circle size={10} />} color="#0ea5e9" />
                                    <AnalysisRow label="Energia Elétrica" value={resultados.custoEnergia} total={resultados.custoTotalLote} icon={<Zap size={10} />} color="#f59e0b" />
                                </div>
                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <SubHeader icon={Settings} title="Equipamento e Desgaste" />
                                    <AnalysisRow label="Depreciação Impressora" value={resultados.custoDepImp} total={resultados.custoTotalLote} icon={<Printer size={12} />} color="#94a3b8" />
                                    <AnalysisRow label="Depreciação Software" value={resultados.custoDepMaq} total={resultados.custoTotalLote} icon={<Diamond size={12} />} color="#94a3b8" />
                                    <AnalysisRow label="Desgaste Componentes" value={resultados.custoDesBico} total={resultados.custoTotalLote} icon={<Wrench size={12} />} color="#94a3b8" />
                                </div>
                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <SubHeader icon={AlertTriangle} title="Riscos e Adicionais" />
                                    <AnalysisRow label="Risco de Falhas" value={resultados.custoFalhas} total={resultados.custoTotalLote} icon={<AlertTriangle size={12} />} color="#ef4444" />
                                    {resultados.custoAcessorios > 0 && <AnalysisRow label="Acessórios" value={resultados.custoAcessorios} total={resultados.custoTotalLote} icon={<Package size={12} />} color="#10b981" />}
                                    {resultados.frete > 0 && <AnalysisRow label="Embalagem/Frete" value={resultados.frete} total={resultados.custoTotalLote} icon={<Package size={12} />} color="#10b981" />}
                                </div>
                                <div className="pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-xl border border-border/50">
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            <TrendingUp size={18} className="text-primary" /> CUSTO TOTAL DE PRODUÇÃO
                                        </div>
                                        <div className="text-2xl font-black text-white font-mono">{fmt(resultados.custoTotalLote)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AÇÕES (EXPORTAÇÃO) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            <button onClick={saveOrcamento} className="h-12 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                                <Save size={18} /> Salvar Projeto (BD)
                            </button>
                            <button onClick={copyToWhatsapp} className="h-12 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-600" style={{ backgroundColor: '#059669' }}>
                                <Send size={18} /> Resumo p/ WhatsApp
                            </button>
                            <button onClick={() => exportPDF('interno')} className="h-12 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 hover:bg-orange-600" style={{ backgroundColor: '#ea580c' }}>
                                <Download size={18} /> Relatório Interno (PDF)
                            </button>
                            <button onClick={() => exportPDF('cliente')} className="h-12 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 hover:bg-sky-600" style={{ backgroundColor: '#0284c7' }}>
                                <FileText size={18} /> Orçamento Cliente (PDF)
                            </button>
                        </div>

                    </div>

                </div>
            ) : (
                /* --- ABA: PROJETOS RECENTES --- */
                <div className="w-full space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                            <History size={24} className="text-primary" /> Histórico de Orçamentos Salvos
                        </h2>
                    </div>

                    {loadingProjects ? (
                        <div className="text-center py-20">
                            <Zap size={40} className="mx-auto text-primary animate-pulse mb-4" />
                            <p className="text-muted-foreground font-medium">Buscando projetos no banco de dados...</p>
                        </div>
                    ) : savedProjects.length === 0 ? (
                        <div className="text-center py-20 rounded-xl border border-border/50 bg-card/30">
                            <History size={40} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-muted-foreground font-medium">Nenhum projeto salvo encontrado.</p>
                            <p className="text-sm text-muted-foreground/70 mt-2">Os orçamentos que você salvar na Calculadora aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {savedProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    onClick={() => loadProject(proj)}
                                    className="project-card px-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer group flex items-center justify-between gap-4 w-full"
                                    style={{
                                        minHeight: '110px',
                                        boxShadow: '0 4px 10px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    }}
                                >
                                    <div className="project-card-left flex items-center gap-5 flex-1" style={{ minWidth: 0 }}>
                                        <div className="p-3 bg-secondary/30 rounded-xl text-primary/80 group-hover:text-primary group-hover:bg-primary/10 transition-colors" style={{ flexShrink: 0 }}>
                                            <Package size={22} />
                                        </div>
                                        <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-white font-bold group-hover:text-primary transition-colors" style={{ fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {proj.nome_projeto || 'Projeto sem nome'}
                                                </h3>
                                                <span className="bg-secondary/80 text-muted-foreground font-medium border border-border/50" style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                                                    {proj.quantidade || 1} {proj.quantidade > 1 ? 'un.' : 'un.'}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <Clock size={11} style={{ opacity: 0.7 }} /> {new Date(proj.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="project-card-right flex items-center justify-end gap-10" style={{ flexShrink: 0 }}>
                                        <div className="project-card-stats flex items-center gap-10">
                                            <div style={{ textAlign: 'right' }}>
                                                <p className="text-muted-foreground uppercase font-bold tracking-wider" style={{ fontSize: '11px', marginBottom: '4px', opacity: 0.8 }}>Preço Venda</p>
                                                <p className="font-mono font-bold text-sky-400" style={{ fontSize: '15px', whiteSpace: 'nowrap' }}>{fmt(proj.preco_venda_final)}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p className="text-muted-foreground uppercase font-bold tracking-wider" style={{ fontSize: '11px', marginBottom: '4px', opacity: 0.8 }}>Lucro Líq.</p>
                                                <p className="font-mono font-bold text-emerald-400" style={{ fontSize: '15px', whiteSpace: 'nowrap' }}>{fmt(proj.lucro_liquido)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div style={{ height: '40px', width: '1px', backgroundColor: 'rgba(30, 41, 59, 0.4)', margin: '0 8px' }}></div>
                                            <button
                                                onClick={(e) => deleteProject(proj.id, e)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                                style={{ padding: '10px', borderRadius: '8px' }}
                                                title="Excluir Projeto"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
