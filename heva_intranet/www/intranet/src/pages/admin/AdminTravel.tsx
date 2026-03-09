import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { type TravelExpense } from '../../api/admin';
import { exportToExcel, exportToZip } from '../../utils/exportUtils';
import { format, parseISO } from 'date-fns';

export default function AdminTravel() {
    const [expenses, setExpenses] = useState<TravelExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    async function fetchExpenses() {
        try {
            setIsLoading(true);
            const fetchedExpenses = await adminApi.getAllTravelExpenses();
            setExpenses(fetchedExpenses);
        } catch (error) {
            console.error('Failed to fetch travel expenses', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleExportExcel = () => {
        const exportData = expenses.map(e => ({
            'Beleg ID': e.name,
            'Benutzer': e.owner,
            'Name': e.user || '',
            'Zweck': e.purpose,
            'Von': e.from_date || '',
            'Bis': e.to_date || '',
            'Betrag': e.total_amount || 0,
            'Status': e.status
        }));

        exportToExcel(exportData, `Reisekosten_${format(new Date(), 'yyyy-MM-dd')}`, 'Reisekosten');
    };

    const handleDownloadAttachments = async (expenseId: string) => {
        try {
            setIsDownloading(expenseId);
            const attachments = await adminApi.getTravelExpenseAttachments(expenseId);

            if (attachments.length === 0) {
                alert('Keine Anhänge für diese Reisekostenabrechnung gefunden.');
                return;
            }

            const files = attachments.map(a => ({
                name: a.file_name,
                url: a.file_url.startsWith('http') ? a.file_url : window.location.origin + a.file_url
            }));

            await exportToZip(files, `Anhänge_${expenseId}`);
        } catch (error) {
            console.error('Failed to download attachments', error);
            alert('Fehler beim Herunterladen der Anhänge.');
        } finally {
            setIsDownloading(null);
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
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Reisekosten</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Übersicht und Export von Reisekostenabrechnungen</p>
                </div>
                <button className="btn btn-primary" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', height: '48px' }} onClick={handleExportExcel} disabled={expenses.length === 0}>
                    Excel Export (Alle)
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Benutzer</th>
                            <th style={{ padding: '1rem' }}>Zweck</th>
                            <th style={{ padding: '1rem' }}>Zeitraum</th>
                            <th style={{ padding: '1rem' }}>Betrag</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Anhänge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Laden...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Keine Einträge gefunden.</td></tr>
                        ) : expenses.map((exp) => (
                            <tr key={exp.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{exp.user || exp.owner}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{exp.owner}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>{exp.purpose}</td>
                                <td style={{ padding: '1rem' }}>
                                    {format(parseISO(exp.from_date || ''), 'dd.MM')} - {format(parseISO(exp.to_date || ''), 'dd.MM.yyyy')}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{exp.total_amount?.toFixed(2)} €</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem',
                                        backgroundColor: exp.status === 'Genehmigt' ? '#dcfce7' : exp.status === 'Abgelehnt' ? '#fee2e2' : '#fef9c3',
                                        color: exp.status === 'Genehmigt' ? '#166534' : exp.status === 'Abgelehnt' ? '#b91c1c' : '#854d0e'
                                    }}>
                                        {exp.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        className="btn"
                                        style={{ height: '40px', padding: '0 1rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 600 }}
                                        onClick={() => handleDownloadAttachments(exp.name)}
                                        disabled={isDownloading === exp.name}
                                    >
                                        {isDownloading === exp.name ? 'Lädt...' : '📦 ZIP'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
