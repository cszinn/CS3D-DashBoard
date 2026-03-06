import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Printer } from 'lucide-react';
import '../App.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await signIn({ email, password });
            if (error) throw error;
            navigate('/');
        } catch (err) {
            if (err.message.includes('Invalid login credentials')) {
                setError('E-mail ou senha inválidos.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg-main)' }}>
            <div style={{ backgroundColor: '#181c22', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '420px', border: '1px solid #232830', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

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
                    <div style={{ flex: 1, textAlign: 'center', backgroundColor: '#1c2128', padding: '10px 0', borderRadius: '6px', color: 'white', fontWeight: '500', fontSize: '0.9rem', cursor: 'default' }}>
                        Entrar
                    </div>
                    <Link to="/register" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '6px', color: '#8b949e', fontWeight: '500', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s ease' }}>
                        Cadastrar
                    </Link>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#8b949e', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s ease' }}
                            placeholder="seu@email.com"
                            onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                            onBlur={(e) => e.target.style.borderColor = '#30363d'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#8b949e', fontWeight: '500' }}>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s ease' }}
                            placeholder="••••••••"
                            onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                            onBlur={(e) => e.target.style.borderColor = '#30363d'}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-0.25rem' }}>
                        <input type="checkbox" id="remember" style={{ accentColor: '#00e0ff', width: '16px', height: '16px', cursor: 'pointer' }} />
                        <label htmlFor="remember" style={{ fontSize: '0.85rem', color: '#8b949e', cursor: 'pointer', userSelect: 'none' }}>Lembrar meu e-mail</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '0.5rem',
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
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#30363d' }}></div>
                    <span style={{ margin: '0 10px', fontSize: '0.8rem', color: '#8b949e' }}>ou</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#30363d' }}></div>
                </div>

                {/* Google Btn */}
                <button style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #30363d',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background-color 0.2s ease'
                }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Entrar com Google
                </button>

            </div>
        </div>
    );
}
