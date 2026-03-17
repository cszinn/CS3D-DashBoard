import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import logo from '../assets/CS3D.svg';

export default function ConfirmEmail() {
    const navigate = useNavigate();

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh', 
            width: '100%', 
            backgroundColor: 'var(--color-bg-main)',
            background: 'radial-gradient(circle at top right, rgba(0, 224, 255, 0.05), transparent 400px), radial-gradient(circle at bottom left, rgba(0, 224, 255, 0.03), transparent 400px)'
        }}>
            <div style={{ 
                backgroundColor: '#181c22', 
                padding: '3.5rem 2.5rem', 
                borderRadius: '24px', 
                width: '100%', 
                maxWidth: '480px', 
                border: '1px solid #232830', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <style>
                    {`
                        @keyframes fadeInUp {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}
                </style>

                {/* Success Icon */}
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <img 
                            src={logo} 
                            alt="CS3D Logo" 
                            style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '16px', 
                                boxShadow: '0 8px 16px rgba(0,0,0,0.4)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                filter: 'invert(1) brightness(2)',
                                objectFit: 'contain'
                            }} 
                        />
                        <div style={{ 
                            position: 'absolute', 
                            bottom: '-10px', 
                            right: '-10px', 
                            backgroundColor: '#10b981', 
                            borderRadius: '50%', 
                            padding: '4px',
                            border: '3px solid #181c22'
                        }}>
                            <CheckCircle size={20} color="white" />
                        </div>
                    </div>
                </div>

                <h1 style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: '700', 
                    color: 'white', 
                    marginBottom: '1rem',
                    letterSpacing: '-0.02em'
                }}>
                    E-mail Confirmado!
                </h1>

                <p style={{ 
                    color: '#8b949e', 
                    fontSize: '1rem', 
                    lineHeight: '1.6',
                    marginBottom: '2.5rem'
                }}>
                    Sua conta foi verificada com sucesso. <br />
                    Agora você já pode acessar todas as funcionalidades do <strong>CS3D Manager</strong>.
                </p>

                <button
                    onClick={() => navigate('/login')}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#00e0ff',
                        background: 'linear-gradient(90deg, #00e0ff 0%, #00b8cc 100%)',
                        color: '#060b14',
                        fontWeight: '700',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 8px 15px rgba(0, 224, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    Ir para o Login <ArrowRight size={18} />
                </button>

                <p style={{ 
                    marginTop: '2rem', 
                    color: '#484f58', 
                    fontSize: '0.8rem' 
                }}>
                    Bem-vindo à nova era da gestão de impressão 3D.
                </p>
            </div>
        </div>
    );
}
