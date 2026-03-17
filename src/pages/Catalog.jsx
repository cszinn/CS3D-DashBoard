import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Package,
    Plus,
    Search,
    Trash2,
    Edit,
    Layers,
    Palette,
    DollarSign,
    Box,
    ChevronDown,
    ChevronRight,
    Tag,
    AlertCircle,
    TrendingUp,
    Scale,
    ShoppingBag,
    X
} from 'lucide-react';

// Brand & Asset Imports
import logo3DPrime from '../assets/catalog/3D Prime.svg';
import logo3DLab from '../assets/catalog/3d lab.svg';
import logoVoolt from '../assets/catalog/Voolt.svg';
import logoCreality from '../assets/catalog/creality.svg';
import logoKrei3D from '../assets/catalog/krei 3d.svg';
import iconSpool from '../assets/catalog/Rolo de filamento.svg';

const inputStyle = {
    height: '42px',
    padding: '10px 14px',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)'
};

const StatCard = ({ icon: Icon, label, value, colorClass = "blue" }) => {
    const colors = {
        blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
        emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
        orange: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }
    };
    const theme = colors[colorClass] || colors.blue;

    return (
        <div className="flex-1 min-w-[300px] bg-[#1e293b] rounded-2xl p-6 shadow-lg border border-white/10 flex items-center gap-5 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:border-white/20">
            <div className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: theme.bg, color: theme.text }}>
                <Icon size={28} />
            </div>
            <div className="flex flex-col">
                <span className="text-[0.8rem] uppercase tracking-wider font-bold text-muted-foreground mb-1">{label}</span>
                <span className="text-[2rem] font-black text-white leading-none">{value}</span>
            </div>
        </div>
    );
};

const SectionHeader = ({ icon: Icon, title, iconColor = "text-primary" }) => (
    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', color: 'white' }}>
        <Icon size={20} className={iconColor} /> {title}
    </h3>
);

const InputGroup = ({ label, children, fullWidth = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: fullWidth ? '100% ' : 'auto', flex: fullWidth ? 'none' : 1 }}>
        <label style={{ color: 'white', opacity: 0.9, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800' }}>{label}</label>
        {children}
    </div>
);

export default function Catalog() {
    const { user } = useAuth();
    const [filamentos, setFilamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [marca, setMarca] = useState('');
    const [material, setMaterial] = useState('PLA');
    const [cor, setCor] = useState('');
    const [precoKg, setPrecoKg] = useState('');
    const [pesoAtual, setPesoAtual] = useState('1000');
    const [editId, setEditId] = useState(null);

    // Filter/Grouping
    const [expandedBrands, setExpandedBrands] = useState({});
    const [expandedMaterials, setExpandedMaterials] = useState({});

    const fetchFilamentos = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('filamentos')
                .select('*')
                .eq('user_id', user.id)
                .order('marca', { ascending: true });

            if (error) throw error;
            setFilamentos(data || []);

            setExpandedBrands({});
            setExpandedMaterials({});

        } catch (err) {
            console.error('Erro ao buscar filamentos:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilamentos();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!marca || !cor || !precoKg) {
            setMsg({ type: 'error', text: 'Preencha todos os campos obrigatórios' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                user_id: user.id,
                marca: marca.trim(),
                material,
                cor: cor.trim(),
                preco_kg: parseFloat(precoKg),
                peso_atual: parseFloat(pesoAtual) || 1000
            };

            if (editId) {
                const { error } = await supabase.from('filamentos').update(payload).eq('id', editId);
                if (error) throw error;
                setMsg({ type: 'success', text: '📦 Filamento atualizado com sucesso!' });
            } else {
                const { error } = await supabase.from('filamentos').insert(payload);
                if (error) throw error;
                setMsg({ type: 'success', text: '✨ Novo filamento adicionado ao seu catálogo!' });
            }

            resetForm();
            fetchFilamentos();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 4000);
        }
    };

    const resetForm = () => {
        setMarca('');
        setMaterial('PLA');
        setCor('');
        setPrecoKg('');
        setPesoAtual('1000');
        setEditId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (f) => {
        setEditId(f.id);
        setMarca(f.marca);
        setMaterial(f.material);
        setCor(f.cor);
        setPrecoKg(f.preco_kg);
        setPesoAtual(f.peso_atual);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteFilamento = async (id) => {
        if (!window.confirm("Deseja excluir este filamento permanentemente?")) return;
        try {
            const { error } = await supabase.from('filamentos').delete().eq('id', id);
            if (error) throw error;
            setFilamentos(filamentos.filter(f => f.id !== id));
            setMsg({ type: 'success', text: 'Filamento removido do estoque.' });
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        }
    };

    const toggleBrand = (brand) => {
        setExpandedBrands(prev => ({
            ...prev,
            [brand]: !prev[brand]
        }));
    };

    const toggleMaterial = (brandKey, materialName) => {
        const key = `${brandKey}-${materialName}`;
        setExpandedMaterials(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Estatísticas Calculadas
    const stats = useMemo(() => {
        const totalKg = filamentos.reduce((sum, f) => sum + (f.peso_atual / 1000), 0);
        const totalInvestido = filamentos.reduce((sum, f) => sum + ((f.peso_atual / 1000) * f.preco_kg), 0);
        return {
            itens: filamentos.length,
            peso: totalKg.toFixed(2) + ' Kg',
            investimento: totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        };
    }, [filamentos]);

    // Filtragem por busca
    const filteredFilamentos = useMemo(() => {
        if (!searchTerm) return filamentos;
        const s = searchTerm.toLowerCase();
        return filamentos.filter(f =>
            f.marca.toLowerCase().includes(s) ||
            f.material.toLowerCase().includes(s) ||
            f.cor.toLowerCase().includes(s)
        );
    }, [filamentos, searchTerm]);

    // Quando houver busca, expandir tudo automaticamente
    useEffect(() => {
        if (searchTerm) {
            const brands = {};
            const mats = {};
            filteredFilamentos.forEach(f => {
                const bKey = f.marca.trim().toUpperCase();
                brands[bKey] = true;
                mats[`${bKey}-${f.material}`] = true;
            });
            setExpandedBrands(brands);
            setExpandedMaterials(mats);
        }
    }, [searchTerm, filteredFilamentos]);

    // Agrupamento: Marca -> Material -> Filamentos (Case-Insensitive)
    const groupedData = useMemo(() => {
        return filteredFilamentos.reduce((acc, curr) => {
            const brandKey = curr.marca.trim().toUpperCase();
            if (!acc[brandKey]) {
                acc[brandKey] = {
                    displayName: curr.marca.trim(),
                    materials: {}
                };
            }
            const mat = curr.material;
            if (!acc[brandKey].materials[mat]) acc[brandKey].materials[mat] = [];
            acc[brandKey].materials[mat].push(curr);
            return acc;
        }, {});
    }, [filteredFilamentos]);

    // Lista de Marcas Únicas para Autocomplete
    const uniqueBrands = useMemo(() =>
        Array.from(new Set(filamentos.map(f => f.marca.trim()))).sort()
        , [filamentos]);

    return (
        <div className="max-w-[1240px] mx-auto w-full pb-16 px-4">

            {/* FEATURED STATS */}
            <div className="grid md:grid-cols-3 gap-6 ">
                <div className="bg-[#0B1120] rounded-xl border border-slate-700 overflow-hidden ">
                    <StatCard icon={TrendingUp} label="Total de Itens" value={stats.itens} colorClass="blue" />
                </div>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <StatCard icon={Scale} label="Estoque Total" value={stats.peso} colorClass="emerald" />
                </div>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <StatCard icon={ShoppingBag} label="Valor do Estoque" value={stats.investimento} colorClass="orange" />
                </div>
            </div>

            {/* CABEÇALHO COM BUSCA (Toolbar Refinada) */}
            <div className="flex flex-col gap-8 mb-16 w-full">
                <div className="space-y-4">
                    <h1 className="text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '8px', lineHeight: 1.1 }}>
                        Catálogo de <span className="text-primary">Filamentos</span>
                    </h1>
                    <p className="text-slate-400" style={{ fontSize: '1.125rem', fontWeight: 500 }}>Inspirado na sua criatividade, organizado para sua eficiência.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', alignItems: 'center', gap: '24px', width: '100%', marginBottom: '64px' }}>
                    <div style={{ position: 'relative', flex: 1, width: '100%', height: '56px' }}>
                        <Search
                            size={20}
                            style={{
                                position: 'absolute',
                                left: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#64748b',
                                pointerEvents: 'none',
                                zIndex: 2
                            }}
                        />
                        <input
                            style={{
                                width: '100%',
                                height: '56px',
                                backgroundColor: '#1e293b42',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                paddingLeft: '60px',
                                paddingRight: '48px',
                                color: 'white',
                                fontSize: '1.125rem',
                                outline: 'none',
                                display: 'block'
                            }}
                            placeholder="Buscar marca, cor ou material..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#64748b',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 2
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        style={{
                            height: '56px',
                            paddingLeft: '32px',
                            paddingRight: '32px',
                            backgroundColor: '#00e1ffc5',
                            color: 'white',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        <Plus size={22} /> Novo Cadastro
                    </button>
                </div>
            </div>

            {/* MENSAGENS */}
            {msg.text && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    <div className={`p-1.5 rounded-lg ${msg.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        <AlertCircle size={18} />
                    </div>
                    <span className="font-bold">{msg.text}</span>
                </div>
            )}

            {/* MODAL DE FORMULÁRIO - DESIGN PREMIUM FLUTUANTE */}
            {isFormOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
                >
                    {/* Backdrop com Blur */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
                        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                        onClick={resetForm}
                    />

                    <div
                        className="relative w-full bg-[#0f172a] animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
                        style={{
                            backgroundColor: '#0f172a',
                            border: '2px solid rgba(255,255,255,0.8)',
                            borderRadius: '48px',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 32px 128px rgba(0,0,0,1)',
                            maxWidth: '600px',
                            width: '95%'
                        }}
                    >
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-8 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{editId ? "Editar Filamento" : "Novo Filamento"}</h2>
                                    <p className="text-slate-400 font-medium text-sm">Preencha os dados abaixo para o inventário.</p>
                                </div>
                            </div>
                            <button
                                onClick={resetForm}
                                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Corpo do Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <InputGroup label="Marca do Filamento" fullWidth>
                                    <div className="relative">
                                        <input
                                            style={inputStyle}
                                            list="brand-suggestions"
                                            placeholder="Digite ou selecione..."
                                            value={marca}
                                            onChange={e => setMarca(e.target.value)}
                                        />
                                        <datalist id="brand-suggestions">
                                            {uniqueBrands.map(b => <option key={b} value={b} />)}
                                        </datalist>
                                        <Search size={14} className="absolute right-3 top-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </InputGroup>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label="Tipo de Material">
                                        <select style={inputStyle} value={material} onChange={e => setMaterial(e.target.value)}>
                                            {["PLA", "ABS", "PETG", "TPU", "ASA", "Nylon", "Outro"].map(m => (
                                                <option key={m} value={m} style={{ backgroundColor: '#0f172a' }}>{m}</option>
                                            ))}
                                        </select>
                                    </InputGroup>
                                    <InputGroup label="Cor / Nome">
                                        <div className="relative">
                                            <input style={inputStyle} placeholder="Ex: Vermelho Neon..." value={cor} onChange={e => setCor(e.target.value)} />
                                            <Palette size={16} className="absolute right-3 top-3 text-muted-foreground" />
                                        </div>
                                    </InputGroup>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label="Custo Unitário (R$/Kg)">
                                        <div className="relative">
                                            <input style={inputStyle} type="number" step="0.01" placeholder="Ex: 89.90" value={precoKg} onChange={e => setPrecoKg(e.target.value)} />
                                            <DollarSign size={16} className="absolute right-3 top-3 text-muted-foreground" />
                                        </div>
                                    </InputGroup>
                                    <InputGroup label="Conteúdo Atual (G)">
                                        <div className="relative group">
                                            <input style={inputStyle} type="number" placeholder="Ex: 1000" value={pesoAtual} onChange={e => setPesoAtual(e.target.value)} />
                                            <Tag size={16} className="absolute right-3 top-3 text-muted-foreground" />
                                        </div>
                                    </InputGroup>
                                </div>
                            </div>

                            {/* Footer do Modal (Ações) */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3.5 rounded-2xl font-black bg-blue-500 text-white hover:bg-blue-400 shadow-[0_8px_24px_rgba(59,130,246,0.4)] transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Box size={20} />
                                    {editId ? 'Salvar Alterações' : 'Criar Filamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LISTAGEM HIERÁRQUICA - ESTILO REFERÊNCIA */}
            <div>
                {loading && filamentos.length === 0 ? (
                    <div className="py-24 text-center">
                        <Package size={48} className="mx-auto mb-4 text-primary animate-pulse opacity-40" />
                        <p className="text-lg font-bold text-muted-foreground">Carregando catálogo...</p>
                    </div>
                ) : filteredFilamentos.length === 0 ? (
                    <div className="py-20 text-center rounded-[40px] border-2 border-dashed border-white/5 bg-white/[0.02] backdrop-blur-sm animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-[#1e293b]/50 rounded-full flex items-center justify-center mx-auto mb-6 text-white/30">
                            <Layers size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-white">Nenhum filamento encontrado</h3>
                        <p className="text-[#94a3b8] max-w-[400px] mx-auto mb-8 font-medium leading-relaxed">Sua busca não retornou resultados ou o catálogo está vazio.</p>
                        {searchTerm ? (
                            <button onClick={() => setSearchTerm('')} className="bg-white/10 px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all text-white">Limpar Busca</button>
                        ) : (
                            <button onClick={() => setIsFormOpen(true)} className="bg-blue-500 px-10 py-4 rounded-xl font-black text-white shadow-2xl hover:translate-y-[-2px] transition-all">Começar Agora</button>
                        )}
                    </div>
                ) : (
                    Object.keys(groupedData).map(brandKey => {
                        const brandInfo = groupedData[brandKey];
                        const isExpanded = expandedBrands[brandKey];

                        return (
                            <div key={brandKey} style={{ marginBottom: '24px' }}>

                                {/* ── BRAND HEADER ── */}
                                <button
                                    onClick={() => toggleBrand(brandKey)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingBottom: '12px',
                                        borderBottom: '2px solid rgba(255,255,255,0.2)',
                                        background: 'none',
                                        cursor: 'pointer',
                                        marginBottom: '24px',
                                        color: 'white',
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'white'}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px' }}>
                                        {/* Brand SVG Logo constrained to 48x48 */}
                                        <span style={{ display: 'inline-flex', width: '48px', height: '48px', flexShrink: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                                            {brandKey.toUpperCase().includes('3D PRIME') && <img src={logo3DPrime} width="48" height="48" style={{ objectFit: 'contain' }} alt="" />}
                                            {brandKey.toUpperCase().includes('3D LAB') && <img src={logo3DLab} width="48" height="48" style={{ objectFit: 'contain' }} alt="" />}
                                            {brandKey.toUpperCase().includes('VOOLT') && <img src={logoVoolt} width="48" height="48" style={{ objectFit: 'contain' }} alt="" />}
                                            {brandKey.toUpperCase().includes('CREALITY') && <img src={logoCreality} width="48" height="48" style={{ objectFit: 'contain' }} alt="" />}
                                            {brandKey.toUpperCase().includes('KREI') && <img src={logoKrei3D} width="48" height="48" style={{ objectFit: 'contain' }} alt="" />}
                                            {!['3D PRIME', '3D LAB', 'VOOLT', 'CREALITY', 'KREI'].some(b => brandKey.toUpperCase().includes(b)) && <Package size={36} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                                        </span>
                                        {brandInfo.displayName}
                                    </span>
                                    <ChevronDown
                                        size={28}
                                        style={{
                                            color: 'rgba(148,163,184,0.5)',
                                            transition: 'transform 0.3s ease',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            flexShrink: 0
                                        }}
                                    />
                                </button>

                                {/* ── BRAND CONTENT (expanded) ── */}
                                {isExpanded && (
                                    <div style={{ paddingTop: '16px', paddingBottom: '48px' }}>
                                        {Object.keys(brandInfo.materials).map(materialType => {
                                            const isMatExpanded = expandedMaterials[`${brandKey}-${materialType}`];
                                            return (
                                                <div key={materialType} style={{ marginBottom: '40px', paddingLeft: '24px' }}>

                                                    {/* ── MATERIAL HEADER ── */}
                                                    <button
                                                        onClick={() => toggleMaterial(brandKey, materialType)}
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            paddingBottom: '8px',
                                                            borderBottom: '1px solid rgba(255, 255, 255)',
                                                            background: 'none',
                                                            cursor: 'pointer',
                                                            marginBottom: '24px',
                                                            color: '#828c9bff',
                                                            textAlign: 'left',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                            <span style={{ display: 'inline-flex', width: '32px', height: '32px', flexShrink: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                                                                <img src={iconSpool} width="84" height="84" style={{ objectFit: 'contain', opacity: 0.7 }} alt="" />
                                                            </span>
                                                            {materialType}
                                                        </span>
                                                        <ChevronDown
                                                            size={20}
                                                            style={{
                                                                transition: 'transform 0.3s ease',
                                                                transform: isMatExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                    </button>

                                                    {/* ── FILAMENT CARDS GRID ── */}
                                                    {isMatExpanded && (
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                            gap: '24px'
                                                        }}>
                                                            {brandInfo.materials[materialType].map(f => {
                                                                const colorLower = f.cor.toLowerCase();
                                                                const isWhite = colorLower.includes('branco');
                                                                const isBlack = colorLower.includes('preto');
                                                                const isGray = colorLower.includes('cinza');
                                                                const isRed = colorLower.includes('vermelho');
                                                                const isBlue = colorLower.includes('azul');
                                                                const isGreen = colorLower.includes('verde');
                                                                const isYellow = colorLower.includes('amarelo');
                                                                const isOrange = colorLower.includes('laranja');
                                                                const isPink = colorLower.includes('rosa');
                                                                const isPurple = colorLower.includes('roxo');
                                                                const isTransparent = colorLower.includes('transparent');

                                                                const swatchColor = isBlack ? '#222' : isWhite ? '#f0f0f0' : isGray ? '#8a8d91' :
                                                                    isRed ? '#dc2626' : isBlue ? '#2563eb' : isGreen ? '#16a34a' :
                                                                        isYellow ? '#eab308' : isOrange ? '#ea580c' : isPink ? '#ec4899' :
                                                                            isPurple ? '#9333ea' : isTransparent ? 'rgba(200,200,200,0.3)' : '#6b7280';

                                                                const stockPercent = Math.min(100, Math.round((f.peso_atual / 1000) * 100));
                                                                const barColor = stockPercent <= 15 ? '#ef4444' : stockPercent <= 40 ? '#f59e0b' : '#3b82f6';

                                                                return (
                                                                    <div
                                                                        key={f.id}
                                                                        className="group/card"
                                                                        style={{
                                                                            backgroundColor: '#1e293b42',
                                                                            borderRadius: '20px',
                                                                            padding: '24px',
                                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                                                                            position: 'relative',
                                                                        }}
                                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                                                    >
                                                                        {/* Card Header: color swatch + name */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                                                            <div style={{
                                                                                width: '48px', height: '48px',
                                                                                borderRadius: '50%',
                                                                                backgroundColor: swatchColor,
                                                                                border: '2px solid rgba(255,255,255,0.1)',
                                                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                                                                flexShrink: 0
                                                                            }} />
                                                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.2, color: 'white' }}>{f.cor}</h3>
                                                                        </div>

                                                                        {/* Weight Section */}
                                                                        <div style={{
                                                                            marginTop: 'auto',
                                                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                                                            padding: '16px',
                                                                            borderRadius: '12px',
                                                                            border: '1px solid rgba(255,255,255,0.07)'
                                                                        }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>
                                                                                <span style={{ color: 'rgba(148,163,184,1)' }}>Restante</span>
                                                                                <span style={{ color: 'white' }}>
                                                                                    {f.peso_atual}g{' '}
                                                                                    <span style={{ fontWeight: 'normal', color: 'rgba(255,255,255,0.3)' }}>/ 1000g</span>
                                                                                </span>
                                                                            </div>
                                                                            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                                                                                <div style={{ height: '100%', width: `${stockPercent}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                                                                            </div>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(148,163,184,0.7)' }}>
                                                                                <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preço/kg</span>
                                                                                <span style={{ fontWeight: 800, color: 'white' }}>R$ {f.preco_kg}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Hover Edit/Delete */}
                                                                        <div className="opacity-0 group-hover/card:opacity-100 transition-opacity" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleEdit(f); }}
                                                                                style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', lineHeight: 0 }}
                                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                                            >
                                                                                <Edit size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); deleteFilamento(f.id); }}
                                                                                style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.8)', lineHeight: 0 }}
                                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
                                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
