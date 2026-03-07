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
    { title: 'Lohnabrechnung', icon: '💰', path: '/payslip', color: '#84cc16' }
];

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <img
                        src={`${import.meta.env.BASE_URL}logo.png`}
                        alt="Heva Logo"
                        style={{ height: '100%', width: '100%', margin: '0.25rem' }}
                    />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Hallo, {user?.full_name || user?.name || 'Mitarbeiter'}!</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Willkommen im Intranet</p>
                        <button
                            onClick={() => logout()}
                            style={{
                                background: 'none',
                                border: '1px solid #cbd5e1',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            Abmelden
                        </button>
                    </div>
                </div>

            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem'
            }}>
                {modules.map((mod) => (
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
