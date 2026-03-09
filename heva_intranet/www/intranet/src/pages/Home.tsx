import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const modules = [
    { title: 'Zeiterfassung', icon: '⏱️', path: '/time-tracking', color: '#3b82f6' },
    { title: 'Abwesenheit', icon: '🌴', path: '/absence', color: '#10b981' },
    { title: 'Reisekosten', icon: '🚆', path: '/travel', color: '#f59e0b' },
    { title: 'Schulungen', icon: '🎓', path: '/training', color: '#8b5cf6' },
    { title: 'Lager & QR', icon: '📦', path: '/inventory', color: '#ec4899' },
    { title: 'Neuigkeiten', icon: '📰', path: '/news', color: '#6366f1' },
    { title: 'Events', icon: '📅', path: '/events', color: '#f43f5e' },
    { title: 'Kummerbox', icon: '💡', path: '/suggestions', color: '#14b8a6' },
    { title: 'Wiki', icon: '📚', path: '/wiki', color: '#0ea5e9' },
    { title: 'Lohnabrechnung', icon: '💰', path: '/payslip', color: '#84cc16' },
    { title: 'Admin', icon: '⚙️', path: '/admin', color: '#64748b' }
];

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isAdmin = user?.roles?.some(r => r.role === 'Intranet Admin' || r.role === 'Administrator') || user?.name === 'Administrator';

    const visibleModules = modules.filter(mod => {
        if (mod.path === '/admin') return isAdmin;
        return true;
    });

    return (
        <div style={{
            padding: window.innerWidth < 640 ? '1rem' : '1.5rem',
            maxWidth: '1000px',
            margin: '0 auto'
        }}>
            <header style={{
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                margin: '0 -1rem 2rem -1rem',
                padding: '1.5rem 1rem 1rem 1rem',
                borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                }}>
                    <img
                        src={`${import.meta.env.BASE_URL}logo.png`}
                        alt="Heva Logo"
                        style={{ height: window.innerWidth < 640 ? '44px' : '56px', width: 'auto', objectFit: 'contain' }}
                    />
                    <button
                        onClick={() => logout()}
                        className="btn"
                        style={{
                            border: '1px solid #cbd5e1',
                            padding: '0.4rem 1.25rem',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            backgroundColor: 'white',
                            height: '40px',
                            borderRadius: '20px'
                        }}
                    >
                        Abmelden
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: window.innerWidth < 640 ? '1.5rem' : '1.875rem',
                            fontWeight: 800,
                            margin: 0,
                            color: 'var(--text-primary)'
                        }}>
                            Hallo, {user?.full_name?.split(' ')[0] || user?.name || 'Benutzer'}!
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                            Willkommen im Intranet
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/admin')}
                            style={{
                                height: '40px',
                                padding: '0 1rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 800
                            }}
                        >
                            Admin
                        </button>
                    )}
                </div>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(140px, 45%, 180px), 1fr))',
                gap: '1rem'
            }}>
                {visibleModules.map((mod) => (
                    <div
                        key={mod.path}
                        onClick={() => navigate(mod.path)}
                        className="card"
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            borderTop: `4px solid ${mod.color}`
                        }}
                    >
                        <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{mod.icon}</span>
                        <span style={{ fontWeight: 500 }}>{mod.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
