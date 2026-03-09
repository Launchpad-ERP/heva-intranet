import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { type AbsenceRequest } from '../../api/admin';
import { exportToExcel } from '../../utils/exportUtils';
import { format, parseISO } from 'date-fns';

export default function AdminAbsence() {
    const [requests, setRequests] = useState<AbsenceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    async function fetchRequests() {
        try {
            setIsLoading(true);
            const filters: any[] = [];
            if (filterStatus) {
                filters.push(['status', '=', filterStatus]);
            }
            const fetchedRequests = await adminApi.getAllAbsenceRequests(filters);
            setRequests(fetchedRequests);
        } catch (error) {
            console.error('Failed to fetch absence requests', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleUpdateStatus = async (name: string, newStatus: string) => {
        try {
            await adminApi.updateAbsenceStatus(name, newStatus);
            fetchRequests();
        } catch (error) {
            console.error(`Failed to update status to ${newStatus}`, error);
            alert(`Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
        }
    };

    const handleExport = () => {
        const exportData = requests.map(r => ({
            'Antrag ID': r.name,
            'Benutzer': r.owner,
            'Name': r.user || '',
            'Typ': r.absence_type || '',
            'Von': r.from_date || '',
            'Bis': r.to_date || '',
            'Tage': r.total_days || 0,
            'Status': r.status,
            'Grund': r.reason || '',
            'Vertretung': r.substitute || ''
        }));

        exportToExcel(exportData, `Abwesenheiten_${format(new Date(), 'yyyy-MM-dd')}`, 'Urlaubsanträge');
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Genehmigt':
            case 'Approved': return { backgroundColor: '#dcfce7', color: '#166534' };
            case 'Abgelehnt':
            case 'Rejected': return { backgroundColor: '#fee2e2', color: '#b91c1c' };
            case 'Eingereicht':
            case 'Pending': return { backgroundColor: '#fef9c3', color: '#854d0e' };
            default: return { backgroundColor: '#f1f5f9', color: '#475569' };
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
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Urlaubsanträge</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Management aller Abwesenheitsanfragen</p>
                </div>
                <button className="btn btn-primary" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', height: '48px' }} onClick={handleExport} disabled={requests.length === 0}>
                    Excel Export
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status-Filter</label>
                <select
                    className="btn"
                    style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white', textAlign: 'left' }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Alle Anträge</option>
                    <option value="Eingereicht">Ausstehend (Eingereicht)</option>
                    <option value="Genehmigt">Genehmigt</option>
                    <option value="Abgelehnt">Abgelehnt</option>
                </select>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Benutzer</th>
                            <th style={{ padding: '1rem' }}>Zeitraum</th>
                            <th style={{ padding: '1rem' }}>Typ</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Laden...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Keine Anträge gefunden.</td></tr>
                        ) : requests.map((req) => (
                            <tr key={req.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{req.user || req.owner}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{req.owner}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {format(parseISO(req.from_date || ''), 'dd.MM')} - {format(parseISO(req.to_date || ''), 'dd.MM.yyyy')}
                                </td>
                                <td style={{ padding: '1rem' }}>{req.absence_type}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem',
                                        ...getStatusStyle(req.status)
                                    }}>
                                        {req.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {(req.status === 'Eingereicht') && (
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn"
                                                style={{ height: '40px', padding: '0 1rem', fontSize: '0.875rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }}
                                                onClick={() => handleUpdateStatus(req.name, 'Genehmigt')}
                                            >
                                                Freigeben
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ height: '40px', padding: '0 1rem', fontSize: '0.875rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                                                onClick={() => handleUpdateStatus(req.name, 'Abgelehnt')}
                                            >
                                                Ablehnen
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
