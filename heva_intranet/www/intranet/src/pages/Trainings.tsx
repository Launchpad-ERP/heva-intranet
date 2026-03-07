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
        <div style={{ padding: '1rem', paddingBottom: '5rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem' }}>
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Schulungen</h1>
            </header>

            {/* Filter */}
            {providers.length > 0 && (
                <div style={{ marginBottom: '1rem', overflowX: 'auto', display: 'flex', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                    <button
                        onClick={() => setFilterProvider('')}
                        className={`chip ${!filterProvider ? 'active' : ''}`}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid #cbd5e1',
                            background: !filterProvider ? 'var(--primary-color)' : 'white',
                            color: !filterProvider ? 'white' : 'black',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Alle
                    </button>
                    {providers.map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterProvider(p)}
                            className={`chip ${filterProvider === p ? 'active' : ''}`}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: '1px solid #cbd5e1',
                                background: filterProvider === p ? 'var(--primary-color)' : 'white',
                                color: filterProvider === p ? 'white' : 'black',
                                whiteSpace: 'nowrap'
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
                        <div key={t.name} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t.subject}</h3>
                                <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3' }}>
                                    {t.provider}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {t.date_text && <div>📅 {t.date_text}</div>}
                                {t.location && <div>📍 {t.location}</div>}
                                {t.price && <div>💰 {t.price}</div>}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <a
                                    href={t.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ flex: 1, textAlign: 'center', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)' }}
                                >
                                    Details
                                </a>
                                <button
                                    onClick={() => handleRequest(t)}
                                    style={{ flex: 1, padding: '0.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)' }}
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
