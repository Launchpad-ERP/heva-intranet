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
        <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem', cursor: 'pointer' }}
                    >
                        ←
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Reisekosten</h1>
                </div>
                <button
                    onClick={() => navigate('/travel/new')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    + Neu
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
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{report.trip_description}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {report.destination}
                                    </div>
                                </div>
                                <div style={{
                                    backgroundColor: getStatusColor(report.status) + '20',
                                    color: getStatusColor(report.status),
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {report.status}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.875rem' }}>
                                    {format(new Date(report.from_date), 'dd.MM.yyyy', { locale: de })}
                                    {report.from_date !== report.to_date && ` - ${format(new Date(report.to_date), 'dd.MM.yyyy', { locale: de })}`}
                                </div>
                                <div style={{ fontWeight: 600 }}>
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
