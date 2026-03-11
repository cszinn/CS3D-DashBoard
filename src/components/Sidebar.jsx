import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Calculator as CalcIcon,
    Layers,
    Box,
    DollarSign,
    Settings,
    Zap,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, signOut } = useAuth();

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Calculadora', path: '/calculadora', icon: CalcIcon },
        { name: 'Catálogo', path: '/catalogo', icon: Layers },
        { name: 'Produtos', path: '/produtos', icon: Box },
        { name: 'Financeiro', path: '/financeiro', icon: DollarSign },
        { name: 'Configurações', path: '/configuracoes', icon: Settings }
    ];

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Erro ao sair:', error.message);
        }
    };

    return (
        <aside className="sidebar-container" style={{
            width: '260px',
            backgroundColor: 'var(--color-bg-sidebar)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>
            {/* Logo */}
            <div className="sidebar-header" style={{ padding: '0 1rem 1rem 1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                }}>
                    <Zap size={18} color="white" strokeWidth={2.5} />
                </div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>STL<span style={{ color: '#ea580c' }}>Hub</span></h1>
            </div>

            {/* User Info - NOW AT TOP */}
            <div className="sidebar-user" style={{ padding: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--color-bg-main)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--color-border)', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-accent)'
                    }}>
                        {user?.email?.substring(0, 2).toUpperCase() || 'CS'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.user_metadata?.first_name || 'Carlos Santos'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: '700' }}>Plano Free</div>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {menuItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className="sidebar-link"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                            color: isActive ? 'var(--color-accent)' : '#8b949e',
                            backgroundColor: isActive ? 'rgba(0, 224, 255, 0.08)' : 'transparent',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontWeight: isActive ? '600' : '500',
                            textDecoration: 'none',
                            border: isActive ? '1px solid rgba(0, 224, 255, 0.1)' : '1px solid transparent'
                        })}
                    >
                        <item.icon size={20} strokeWidth={index === 0 ? 2.5 : 2} />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Logout */}
            <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={handleSignOut}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                        color: 'var(--color-error)', backgroundColor: 'transparent', transition: 'all 0.2s ease',
                        fontWeight: '600', border: '1px solid transparent', cursor: 'pointer', fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                        e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.border = '1px solid transparent';
                    }}
                >
                    <LogOut size={20} />
                    Sair da Conta
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
