import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../api/admin';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { title: 'Dashboard', path: '/admin', icon: '📊' },
    { title: 'Zeiterfassung', path: '/admin/time', icon: '⏱️' },
    { title: 'Abwesenheit', path: '/admin/absence', icon: '🌴' },
    { title: 'Reisekosten', path: '/admin/travel', icon: '🚆' },
    { title: 'Benutzer', path: '/admin/users', icon: '👥' },
    { title: 'News', path: '/admin/news', icon: '📰' },
    { title: 'Kummerbox', path: '/admin/suggestions', icon: '💡' },
    { title: 'Trainings', path: '/admin/trainings', icon: '🎓' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

    useEffect(() => {
        adminApi.ensureIntranetAdminRole();

        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(false);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on navigation (mobile)
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [navigate, isMobile]);

    const sidebarWidth = '260px';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
            {/* Mobile Header */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    backgroundColor: 'var(--surface-color)',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1rem',
                    zIndex: 20
                }}>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex'
                        }}
                    >
                        ☰
                    </button>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ height: '24px' }} />
                        <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Admin</span>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {isMobile && isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 30
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: sidebarWidth,
                backgroundColor: 'var(--surface-color)',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 40,
                transition: 'transform 0.3s ease-in-out',
                transform: isMobile && !isSidebarOpen ? `translateX(-${sidebarWidth})` : 'translateX(0)'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ height: '32px' }} />
                        <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Admin</span>
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/admin'}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        textDecoration: 'none',
                                        color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                        fontWeight: isActive ? 600 : 500,
                                        transition: 'all 0.2s'
                                    })}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                                    {item.title}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            marginBottom: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <span>🏠</span> Zurück zum Intranet
                    </button>
                    <button
                        onClick={() => logout()}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        <span>🚪</span> Abmelden
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: isMobile ? 0 : sidebarWidth,
                padding: isMobile ? '5rem 1rem 2rem' : '2rem',
                transition: 'margin-left 0.3s ease-in-out'
            }}>
                <div style={{ maxWidth: 'calc(100vw - 30px)', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
