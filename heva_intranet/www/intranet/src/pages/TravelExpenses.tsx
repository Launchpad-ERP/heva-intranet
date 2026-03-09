import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { travelExpensesApi, type TravelExpense } from '../api/travelExpenses';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TravelExpenses() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [reports, setReports] = useState<TravelExpense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.name) {
            loadReports();
        }
    }, [user]);

    async function loadReports() {
        setLoading(true);
        try {
            const list = await travelExpensesApi.getList(user!.name); // Assumes user.name is email/ID
            setReports(list);
        } catch (e: any) {
            console.error(e);
            alert('Fehler beim Laden der Reisekosten: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Entwurf': return 'var(--text-secondary)';
            case 'Eingereicht': return '#3b82f6';
            case 'Genehmigt': return '#10b981';
            case 'Abgelehnt': return '#ef4444';
            case 'Erstattet': return '#8b5cf6';
            default: return 'var(--text-secondary)';
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;

    return (
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '6rem' }}>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                gap: '0.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn"
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', padding: '0.5rem', cursor: 'pointer' }}
                    >
                        ←
                    </button>
                    <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.25rem' : '1.5rem' }}>Reisekosten</h1>
                </div>
                <button
                    onClick={() => navigate('/travel/new')}
                    className="btn btn-primary"
                    style={{
                        padding: window.innerWidth < 640 ? '0.5rem 1rem' : '0.75rem 1.25rem',
                        fontSize: window.innerWidth < 640 ? '0.875rem' : '1rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700
                    }}
                >
                    + {window.innerWidth < 640 ? 'Neu' : 'Neuer Bericht'}
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reports.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Keine Reisekostenberichte gefunden.
                    </div>
                ) : (
                    reports.map(report => (
                        <div
                            key={report.name}
                            className="card"
                            onClick={() => navigate(`/travel/${report.name}`)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                padding: '1.25rem',
                                transition: 'transform 0.1s, box-shadow 0.1s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-color)', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                                        {report.trip_description}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        📍 {report.destination}
                                    </div>
                                </div>
                                <div style={{
                                    backgroundColor: getStatusColor(report.status),
                                    color: 'white',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {report.status}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '0.25rem',
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '0.75rem'
                            }}>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    📅 {format(new Date(report.from_date), 'dd.MM.yyyy', { locale: de })}
                                    {report.from_date !== report.to_date && ` - ${format(new Date(report.to_date), 'dd.MM.yyyy', { locale: de })}`}
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-color)' }}>
                                    {report.total_amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0,00 €'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
