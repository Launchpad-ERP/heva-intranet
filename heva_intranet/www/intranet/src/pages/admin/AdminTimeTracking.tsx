import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { type TimeEntry, type User } from '../../api/admin';
import { exportToExcel } from '../../utils/exportUtils';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminTimeTracking() {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [editData, setEditData] = useState<Partial<TimeEntry>>({});

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const fetchedUsers = await adminApi.getAllUsers();
                setUsers(fetchedUsers);
                fetchEntries();
            } catch (error) {
                console.error('Failed to load initial data', error);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [selectedUser, selectedMonth]);

    async function fetchEntries() {
        try {
            setIsLoading(true);
            const filters: any[] = [];

            if (selectedUser) {
                filters.push(['owner', '=', selectedUser]);
            }

            const monthDate = parseISO(`${selectedMonth}-01`);
            filters.push(['date', '>=', format(startOfMonth(monthDate), 'yyyy-MM-dd')]);
            filters.push(['date', '<=', format(endOfMonth(monthDate), 'yyyy-MM-dd')]);

            const fetchedEntries = await adminApi.getAllTimeEntries(filters);
            setEntries(fetchedEntries);
        } catch (error) {
            console.error('Failed to fetch entries', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEntry) return;
        try {
            await adminApi.updateEntry(editingEntry.name, editData);
            setEditingEntry(null);
            fetchEntries();
            alert('Eintrag aktualisiert.');
        } catch (error) {
            console.error('Failed to update entry', error);
            alert('Fehler beim Aktualisieren.');
        }
    };

    const handleExport = () => {
        const exportData = entries.map(e => ({
            'Benutzer': e.owner,
            'Datum': e.date,
            'Status': e.status,
            'Projekt': e.project || '',
            'Kommen': e.clock_in || '',
            'Gehen': e.clock_out || '',
            'Pause (h)': e.break_duration || 0,
            'Arbeitszeit (h)': e.working_hours || 0,
            'Notizen': e.notes || ''
        }));

        const fileName = `Zeitbuchungen_${selectedMonth}${selectedUser ? `_${selectedUser}` : ''}`;
        exportToExcel(exportData, fileName, 'Zeitbuchungen');
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
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Zeitbuchungen</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Eingeloggte Zeiten aller Benutzer einsehen und verwalten</p>
                </div>
                <button className="btn btn-primary" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', height: '48px' }} onClick={handleExport} disabled={entries.length === 0}>
                    Excel Export
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Benutzer</label>
                    <select
                        className="btn"
                        style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white', textAlign: 'left' }}
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="">Alle Benutzer</option>
                        {users.map(u => <option key={u.email} value={u.email}>{u.full_name || u.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: '1 1 280px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Monat</label>
                    <input
                        type="month"
                        className="btn"
                        style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Datum</th>
                            <th style={{ padding: '1rem' }}>Benutzer</th>
                            <th style={{ padding: '1rem' }}>Projekt</th>
                            <th style={{ padding: '1rem' }}>Kommen / Gehen</th>
                            <th style={{ padding: '1rem' }}>Pause</th>
                            <th style={{ padding: '1rem' }}>Dauer</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center' }}>Laden...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center' }}>Keine Einträge gefunden.</td></tr>
                        ) : entries.map((entry) => (
                            <tr key={entry.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem' }}>{format(parseISO(entry.date), 'dd.MM.yyyy')}</td>
                                <td style={{ padding: '1rem' }}>{entry.owner}</td>
                                <td style={{ padding: '1rem' }}>{entry.project || '-'}</td>
                                <td style={{ padding: '1rem' }}>{entry.clock_in || '--'} - {entry.clock_out || '--'}</td>
                                <td style={{ padding: '1rem' }}>{(entry.break_duration || 0).toFixed(2)}h</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{(entry.working_hours || 0).toFixed(2)}h</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem',
                                        backgroundColor: entry.status === 'Abgeschlossen' ? '#dcfce7' : entry.status === 'Aktiv' ? '#dbeafe' : '#fef9c3',
                                        color: entry.status === 'Abgeschlossen' ? '#166534' : entry.status === 'Aktiv' ? '#1e40af' : '#854d0e'
                                    }}>
                                        {entry.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn"
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                            onClick={() => {
                                                setEditingEntry(entry);
                                                setEditData({
                                                    clock_in: entry.clock_in,
                                                    clock_out: entry.clock_out,
                                                    break_duration: entry.break_duration,
                                                    notes: entry.notes
                                                });
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', color: '#dc2626' }}
                                            onClick={async () => {
                                                if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
                                                    try {
                                                        await adminApi.deleteEntry(entry.name);
                                                        fetchEntries();
                                                    } catch (e) {
                                                        alert('Fehler beim Löschen.');
                                                    }
                                                }
                                            }}
                                        >
                                            Löschen
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingEntry && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100,
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>Zeitbuchung bearbeiten</h2>
                        <form onSubmit={handleUpdate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kommen</label>
                                <input type="time" step="1" className="btn" style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                    value={editData.clock_in || ''} onChange={(e) => setEditData({ ...editData, clock_in: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Gehen</label>
                                <input type="time" step="1" className="btn" style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                    value={editData.clock_out || ''} onChange={(e) => setEditData({ ...editData, clock_out: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Pause (Stunden)</label>
                                <input type="number" step="0.01" className="btn" style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                    value={editData.break_duration || 0} onChange={(e) => setEditData({ ...editData, break_duration: parseFloat(e.target.value) })} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Notizen</label>
                                <textarea className="btn" style={{ width: '100%', border: '1px solid #e2e8f0', minHeight: '80px', textAlign: 'left', backgroundColor: 'white' }}
                                    value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexDirection: window.innerWidth < 480 ? 'column-reverse' : 'row' }}>
                                <button type="button" className="btn" onClick={() => setEditingEntry(null)} style={{ border: '1px solid #e2e8f0', height: '48px' }}>Abbrechen</button>
                                <button type="submit" className="btn btn-primary" style={{ height: '48px' }}>Speichern</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
