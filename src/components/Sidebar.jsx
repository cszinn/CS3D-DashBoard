import React from 'react';

const Sidebar = () => {
    const menuItems = [
        { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Calculadora', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
        { name: 'Catálogo', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { name: 'Produtos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { name: 'Financeiro', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
    ];

    return (
        <aside style={{
            width: '260px',
            backgroundColor: 'var(--color-bg-sidebar)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem'
        }}>
            <div style={{ padding: '0 1rem 2rem 1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px', color: '#fff', strokeWidth: 2 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>Company</h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItems.map((item, index) => (
                    <a key={index} href="#" style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: 'var(--border-radius-md)',
                        color: index === 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        backgroundColor: index === 0 ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                        transition: 'var(--transition-fast)',
                        fontWeight: index === 0 ? '600' : '500',
                        textDecoration: 'none'
                    }}
                        onMouseEnter={(e) => {
                            if (index !== 0) {
                                e.currentTarget.style.color = 'var(--color-text-primary)';
                                e.currentTarget.style.backgroundColor = 'var(--color-bg-card-hover)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (index !== 0) {
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px', strokeWidth: 2 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            {item.name === 'Configurações' && <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
                        </svg>
                        {item.name}
                    </a>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    CS
                </div>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Carlos Santos</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Admin</div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
