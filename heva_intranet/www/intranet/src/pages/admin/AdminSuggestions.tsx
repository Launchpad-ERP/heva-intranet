import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { type Suggestion } from '../../api/admin';
import { format, parseISO } from 'date-fns';

export default function AdminSuggestions() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    async function fetchSuggestions() {
        try {
            setIsLoading(true);
            const fetchedSuggestions = await adminApi.getAllSuggestions();
            setSuggestions(fetchedSuggestions);
        } catch (error) {
            console.error('Failed to fetch suggestions', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleUpdateStatus = async (name: string, newStatus: string) => {
        try {
            await adminApi.updateSuggestion(name, { status: newStatus });
            fetchSuggestions();
            alert('Status erfolgreich aktualisiert.');
        } catch (error) {
            console.error('Failed to update suggestion status', error);
            alert(`Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: window.innerWidth < 640 ? '1.5rem' : '1.875rem', fontWeight: 700, margin: 0 }}>Kummerbox</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Eingegangene Vorschläge und Kritik einsehen und bearbeiten</p>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {isLoading ? (
                    <div className="card" style={{ textAlign: 'center' }}>Laden...</div>
                ) : suggestions.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center' }}>Keine Einträge gefunden.</div>
                ) : suggestions.map((item) => (
                    <div key={item.name} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: window.innerWidth < 640 ? 'column-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: window.innerWidth < 640 ? 'flex-start' : 'center',
                            gap: '0.75rem'
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h3>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Am: {format(parseISO(item.creation), 'dd.MM.yyyy HH:mm')} - von {item.owner}
                                </div>
                            </div>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.875rem',
                                backgroundColor: item.status === 'Neu' ? '#fef9c3' : item.status === 'Umgesetzt' ? '#dcfce7' : '#f1f5f9',
                                color: item.status === 'Neu' ? '#854d0e' : item.status === 'Umgesetzt' ? '#166534' : '#475569',
                                alignSelf: 'flex-start'
                            }}>
                                {item.status}
                            </span>
                        </div>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>{item.description}</p>
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'flex-end',
                            borderTop: '1px solid #f1f5f9',
                            paddingTop: '1rem',
                            flexDirection: window.innerWidth < 480 ? 'column' : 'row'
                        }}>
                            {item.status !== 'Umgesetzt' && (
                                <button
                                    className="btn btn-primary"
                                    style={{ height: '40px', padding: '0 1rem', fontSize: '0.875rem', fontWeight: 600 }}
                                    onClick={() => handleUpdateStatus(item.name, 'Umgesetzt')}
                                >
                                    Erledigt
                                </button>
                            )}
                            {item.status !== 'In Prüfung' && item.status !== 'Umgesetzt' && (
                                <button
                                    className="btn"
                                    style={{ height: '40px', padding: '0 1rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 600 }}
                                    onClick={() => handleUpdateStatus(item.name, 'In Prüfung')}
                                >
                                    In Bearbeitung
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
