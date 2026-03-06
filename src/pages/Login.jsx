import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // Optional: Use existing or new CSS

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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Acesso ao Dashboard</h2>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', boxSizing: 'border-box' }}
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', boxSizing: 'border-box' }}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--color-accent)',
                            color: '#000',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    Ainda não tem conta? <Link to="/register" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: '500' }}>Criar Conta</Link>
                </p>
            </div>
        </div>
    );
}
