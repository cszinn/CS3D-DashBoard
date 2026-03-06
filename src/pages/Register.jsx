import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('As senhas não coincidem');
        }

        setLoading(true);
        setError(null);
        try {
            const { error } = await signUp({ email, password });
            if (error) throw error;

            // O Supabase às vezes exige confirmação de email dependendo das confs.
            // Se tiver desativado, o user faz login direto e redirecinamos para home.
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
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Criar Conta</h2>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                            placeholder="Mínimo de 6 caracteres"
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', boxSizing: 'border-box' }}
                            placeholder="Digite a senha novamente"
                            minLength={6}
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
                        {loading ? 'Criando Conta...' : 'Criar minha conta'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    Já possui conta? <Link to="/login" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: '500' }}>Fazer Login</Link>
                </p>
            </div>
        </div>
    );
}
