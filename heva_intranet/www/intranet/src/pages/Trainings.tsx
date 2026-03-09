import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingsApi, type Training } from '../api/trainings';
import { useAuth } from '../hooks/useAuth';

export default function Trainings() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterProvider, setFilterProvider] = useState('');

    useEffect(() => {
        console.log('Trainings Page Mounted');
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await trainingsApi.getAll();
            setTrainings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleRequest(t: Training) {
        if (!user) {
            alert('Bitte melden Sie sich an.');
            return;
        }

        const notes = prompt(`Möchten Sie ein Angebot für "${t.subject}" anfordern?\n\nOptionale Notiz an HR:`);
        if (notes === null) return;

        try {
            await trainingsApi.requestQuote({
                training: t.name,
                user: user.name, // Use user email/name
                notes: notes
            });
            alert('Anfrage erfolgreich gesendet! Der Status ist nun "Pending".');
        } catch (e: any) {
            console.error(e);
            alert('Fehler: ' + e.message);
        }
    }

    const filtered = filterProvider
        ? trainings.filter(t => t.provider === filterProvider)
        : trainings;

    const providers = Array.from(new Set(trainings.map(t => t.provider)));

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;

    return (
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem',
                gap: '0.25rem',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                padding: '0.5rem 0',
                margin: '0 -0.75rem 1.5rem -0.75rem',
                paddingLeft: '0.75rem'
            }}>
                <button
                    onClick={() => navigate('/')}
                    className="btn"
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', padding: '0.5rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.25rem' : '1.5rem', fontWeight: 800 }}>Schulungen</h1>
            </header>

            {/* Filter */}
            {providers.length > 0 && (
                <div style={{
                    marginBottom: '1.5rem',
                    overflowX: 'auto',
                    display: 'flex',
                    gap: '0.625rem',
                    padding: '0.25rem 0.25rem 0.75rem 0.25rem',
                    margin: '0 -0.25rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    <button
                        onClick={() => setFilterProvider('')}
                        className="btn"
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '20px',
                            border: '1px solid ' + (!filterProvider ? 'var(--primary-color)' : '#cbd5e1'),
                            background: !filterProvider ? 'var(--primary-color)' : 'white',
                            color: !filterProvider ? 'white' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            boxShadow: !filterProvider ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                        }}
                    >
                        Alle
                    </button>
                    {providers.map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterProvider(p)}
                            className="btn"
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '20px',
                                border: '1px solid ' + (filterProvider === p ? 'var(--primary-color)' : '#cbd5e1'),
                                background: filterProvider === p ? 'var(--primary-color)' : 'white',
                                color: filterProvider === p ? 'white' : 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                boxShadow: filterProvider === p ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Keine Schulungen gefunden.</p>
                ) : (
                    filtered.map(t => (
                        <div key={t.name} className="card" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            padding: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.3 }}>{t.subject}</h3>
                                <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: '#eff6ff',
                                    color: 'var(--primary-color)',
                                    border: '1px solid #dbeafe',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {t.provider}
                                </span>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth < 480 ? '1fr' : '1fr 1fr',
                                gap: '0.5rem',
                                fontSize: '0.8125rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500
                            }}>
                                {t.date_text && <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>📅 {t.date_text}</div>}
                                {t.location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>📍 {t.location}</div>}
                                {t.price && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>💰 {t.price}</div>}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <a
                                    href={t.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '44px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: 'var(--radius-md)',
                                        textDecoration: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.875rem',
                                        fontWeight: 700
                                    }}
                                >
                                    Details
                                </a>
                                <button
                                    onClick={() => handleRequest(t)}
                                    className="btn btn-primary"
                                    style={{
                                        flex: 1.5,
                                        height: '44px',
                                        fontSize: '0.875rem',
                                        fontWeight: 800
                                    }}
                                >
                                    Angebot anfragen
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
