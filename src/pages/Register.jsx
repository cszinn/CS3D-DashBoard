import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Printer } from 'lucide-react';
import '../App.css';

export default function Register() {
    const [formData, setFormData] = useState({
        nome: '', sobrenome: '', email: '', telefone: '', endereco: '', cidade: '', estado: '', cep: '', password: '', confirmPassword: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setError('As senhas não coincidem');
        }

        setLoading(true);
        setError(null);
        try {
            // In a real app, you might save the other user metadata (nome, endereço) to a 'users' table or Supabase user metadata
            const { error } = await signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.nome,
                        last_name: formData.sobrenome,
                        phone: formData.telefone,
                        address: formData.endereco,
                        city: formData.cidade,
                        state: formData.estado,
                        zip: formData.cep
                    }
                }
            });
            if (error) throw error;
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #30363d',
        backgroundColor: '#0d1117', color: 'white', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s ease'
    };

    const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#8b949e', fontWeight: '500' };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg-main)', padding: '2rem 0' }}>
            <div style={{ backgroundColor: '#181c22', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '500px', border: '1px solid #232830', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

                {/* Logo and Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: 'rgba(0, 224, 255, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(0, 224, 255, 0.2)' }}>
                        <Printer size={28} color="#00e0ff" />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '600', color: 'white', marginBottom: '0.25rem' }}>STLHub Manager</h2>
                    <p style={{ color: '#8b949e', fontSize: '0.9rem' }}>Acesse seu painel exclusivo</p>
                </div>

                {/* Segmented Control */}
                <div style={{ display: 'flex', backgroundColor: '#111418', borderRadius: '8px', padding: '4px', marginBottom: '2rem', border: '1px solid #232830' }}>
                    <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '6px', color: '#8b949e', fontWeight: '500', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s ease' }}>
                        Entrar
                    </Link>
                    <div style={{ flex: 1, textAlign: 'center', backgroundColor: '#1c2128', padding: '10px 0', borderRadius: '6px', color: 'white', fontWeight: '500', fontSize: '0.9rem', cursor: 'default' }}>
                        Cadastrar
                    </div>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Nome</label>
                            <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Sobrenome</label>
                            <input type="text" name="sobrenome" placeholder="Sobrenome" value={formData.sobrenome} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input type="email" name="email" placeholder="seu@email.com" value={formData.email} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Telefone</label>
                            <input type="tel" name="telefone" placeholder="(00) 00000-0000" value={formData.telefone} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Endereço</label>
                        <input type="text" name="endereco" placeholder="Rua, Número, Bairro" value={formData.endereco} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Cidade</label>
                            <input type="text" name="cidade" placeholder="Cidade" value={formData.cidade} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <input type="text" name="estado" placeholder="UF" value={formData.estado} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                        <div>
                            <label style={labelStyle}>CEP</label>
                            <input type="text" name="cep" placeholder="00000-000" value={formData.cep} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Senha</label>
                            <input type="password" name="password" placeholder="••••••••" minLength={6} value={formData.password} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirmar</label>
                            <input type="password" name="confirmPassword" placeholder="••••••••" minLength={6} value={formData.confirmPassword} onChange={handleChange} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#00e0ff'} onBlur={(e) => e.target.style.borderColor = '#30363d'} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#00e0ff',
                            background: 'linear-gradient(90deg, #00e0ff 0%, #00b8cc 100%)',
                            color: '#060b14',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.8 : 1,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px rgba(0, 224, 255, 0.3)'
                        }}
                    >
                        {loading ? 'Cadastrando...' : 'Continuar e verificar e-mail'}
                    </button>
                </form>

            </div>
        </div>
    );
}
