import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { type Training, type TrainingParticipant } from '../../api/admin';
import { format, parseISO } from 'date-fns';

export default function AdminTrainings() {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
    const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

    useEffect(() => {
        fetchTrainings();
    }, []);

    async function fetchTrainings() {
        try {
            setIsLoading(true);
            const fetchedTrainings = await adminApi.getAllTrainings();
            setTrainings(fetchedTrainings);
        } catch (error) {
            console.error('Failed to fetch trainings', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSync = async () => {
        try {
            setIsLoading(true);
            await adminApi.syncTrainings();
            fetchTrainings();
            alert('Trainings erfolgreich synchronisiert.');
        } catch (error) {
            console.error('Failed to sync trainings', error);
            alert(`Fehler beim Synchronisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewParticipants = async (training: Training) => {
        try {
            setSelectedTraining(training);
            setIsLoadingParticipants(true);
            const fetchedParticipants = await adminApi.getTrainingParticipants(training.name);
            setParticipants(fetchedParticipants);
        } catch (error) {
            console.error('Failed to fetch participants', error);
        } finally {
            setIsLoadingParticipants(false);
        }
    };

    return (
        <div>
            <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 640 ? 'flex-start' : 'center',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Trainings & Schulungen</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Schulungen verwalten und Teilnehmerlisten einsehen</p>
                </div>
                <button className="btn btn-primary" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', height: '48px' }} onClick={handleSync}>
                    🔄 Synchronisieren
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: (selectedTraining && window.innerWidth >= 1024) ? '1fr 1fr' : '1fr',
                gap: '1.5rem'
            }}>
                <div className="card" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Schulung</th>
                                <th style={{ padding: '1rem' }}>Datum</th>
                                <th style={{ padding: '1rem' }}>Leiter</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Laden...</td></tr>
                            ) : trainings.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Keine Schulungen gefunden.</td></tr>
                            ) : trainings.map((t) => (
                                <tr key={t.name} style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor: selectedTraining?.name === t.name ? '#f8fafc' : 'transparent'
                                }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ID: {t.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{format(parseISO(t.date), 'dd.MM.yyyy')}</td>
                                    <td style={{ padding: '1rem' }}>{t.instructor || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            className="btn"
                                            style={{ height: '40px', padding: '0 1rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 600 }}
                                            onClick={() => handleViewParticipants(t)}
                                        >
                                            Teilnehmer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedTraining && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Teilnehmer: {selectedTraining.title}</h3>
                            <button onClick={() => setSelectedTraining(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {isLoadingParticipants ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Laden...</div>
                        ) : participants.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Noch keine Teilnehmer eingetragen.</div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {participants.map((p) => (
                                    <li key={p.name} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: 'var(--radius-full)',
                                            backgroundColor: '#e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem'
                                        }}>
                                            {p.user_full_name?.charAt(0) || p.user.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{p.user_full_name || p.user}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.user}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Max. Teilnehmer:</span>
                                <span>{selectedTraining.max_participants || '∞'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Belegte Plätze:</span>
                                <span style={{ fontWeight: 600 }}>{participants.length}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
