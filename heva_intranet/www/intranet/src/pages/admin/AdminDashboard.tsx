import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        employees: 0,
        pendingAbsences: 0,
        recentTimeLogs: 0,
        openSuggestions: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            setIsLoading(true);

            const [usersRes, absencesRes, timeLogsRes, suggestionsRes] = await Promise.allSettled([
                adminApi.getAllUsers(),
                adminApi.getAllAbsenceRequests([['status', '=', 'Eingereicht']]),
                adminApi.getAllTimeEntries([['date', '=', new Date().toISOString().split('T')[0]]]),
                adminApi.getAllSuggestions()
            ]);

            setStats({
                employees: usersRes.status === 'fulfilled' ? usersRes.value.length : 0,
                pendingAbsences: absencesRes.status === 'fulfilled' ? absencesRes.value.length : 0,
                recentTimeLogs: timeLogsRes.status === 'fulfilled' ? timeLogsRes.value.length : 0,
                openSuggestions: suggestionsRes.status === 'fulfilled'
                    ? suggestionsRes.value.filter(s => s.status === 'Neu').length
                    : 0
            });

            // Log errors for failed requests
            [usersRes, absencesRes, timeLogsRes, suggestionsRes].forEach((res, i) => {
                if (res.status === 'rejected') {
                    console.error(`Dashboard stat error (index ${i}):`, res.reason);
                }
            });

        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setIsLoading(false);
        }
    }

    const cards = [
        { title: 'Benutzer', value: stats.employees, icon: '👥', path: '/admin/users', color: '#3b82f6' },
        { title: 'Offene Urlaubsanträge', value: stats.pendingAbsences, icon: '🌴', path: '/admin/absence', color: '#10b981' },
        { title: 'Zeitbuchungen heute', value: stats.recentTimeLogs, icon: '⏱️', path: '/admin/time', color: '#f59e0b' },
        { title: 'Neue Kummerbox Einträge', value: stats.openSuggestions, icon: '💡', path: '/admin/suggestions', color: '#ec4899' },
    ];

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Echtzeit-Überblick über das Intranet</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 280px), 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {cards.map((card) => (
                    <div
                        key={card.title}
                        onClick={() => navigate(card.path)}
                        className="card"
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            borderLeft: `4px solid ${card.color}`,
                            transition: 'transform 0.2s',
                            padding: '1.25rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>{card.title}</span>
                            <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {isLoading ? '...' : card.value}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
                gap: '1.5rem'
            }}>
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            className="btn btn-primary"
                            style={{ height: '48px' }}
                            onClick={() => navigate('/admin/news')}
                        >
                            Neue News erstellen
                        </button>
                        <button
                            className="btn"
                            style={{ border: '1px solid #e2e8f0', height: '48px' }}
                            onClick={() => navigate('/admin/users')}
                        >
                            Neuen Benutzer anlegen
                        </button>
                        <button
                            className="btn"
                            style={{ border: '1px solid #e2e8f0', height: '48px' }}
                            onClick={() => adminApi.syncTrainings().then(() => fetchStats())}
                        >
                            Trainings synchronisieren
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1.25rem' }}>System Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>API Status</span>
                            <span style={{
                                color: 'var(--success-color)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></span>
                                Verbunden
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Letzter Sync</span>
                            <span style={{ fontWeight: 500 }}>{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
