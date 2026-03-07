import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeTrackingApi, type TimeEntry, type Project } from '../api/timeTracking';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AuthContext } from '../context/AuthContext';

export default function TimeTracking() {
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);
    const [todayEntry, setTodayEntry] = useState<TimeEntry | null>(null);
    const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit modal state
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [editForm, setEditForm] = useState({
        clock_in: '',
        clock_out: '',
        break_duration: 0,
        project: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [authContext?.user]);

    async function loadData() {
        setLoading(true);
        try {
            const [todayList, recent, projectList] = await Promise.all([
                timeTrackingApi.getTodayEntry(authContext?.user?.name), // Pass user name
                timeTrackingApi.getRecentEntries(7),
                timeTrackingApi.getProjects()
            ]);
            setTodayEntry(todayList.length > 0 ? todayList[0] : null);
            setRecentEntries(recent);
            setProjects(projectList);
        } catch (e) {
            console.error('Failed to load time tracking data:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleClockIn() {
        if (!authContext?.user?.name) {
            alert('Benutzer nicht gefunden. Bitte erneut einloggen.');
            return;
        }
        setActionLoading(true);
        try {
            await timeTrackingApi.clockIn({
                user: authContext.user.name,
                project: selectedProject
            });
            await loadData();
        } catch (e: any) {
            alert('Fehler: ' + e.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleClockOut() {
        if (!todayEntry) return;
        setActionLoading(true);
        try {
            await timeTrackingApi.clockOut(todayEntry.name);
            await loadData();
        } catch (e: any) {
            alert('Fehler: ' + e.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleBreakStart() {
        if (!todayEntry) return;
        setActionLoading(true);
        try {
            await timeTrackingApi.startBreak(todayEntry.name);
            await loadData();
        } catch (e: any) {
            alert('Fehler: ' + e.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleBreakEnd() {
        if (!todayEntry || !todayEntry.break_start) return;
        setActionLoading(true);
        try {
            // End break and accumulate duration
            await timeTrackingApi.endBreak(
                todayEntry.name,
                todayEntry.break_start,
                todayEntry.break_duration || 0
            );
            // Reset break fields to allow another break
            await timeTrackingApi.resetBreakFields(todayEntry.name);
            await loadData();
        } catch (e: any) {
            alert('Fehler: ' + e.message);
        } finally {
            setActionLoading(false);
        }
    }

    function openEditModal(entry: TimeEntry) {
        console.log('Opening edit for entry:', entry); // Debug log
        setEditingEntry(entry);

        // Parse time - handles "H:MM:SS", "HH:MM:SS", "H:MM", "HH:MM" formats
        // Returns "HH:MM" format required by HTML time input
        const parseTime = (time: string | undefined) => {
            if (!time) return '';
            const parts = time.split(':');
            if (parts.length < 2) return '';
            const hours = parts[0].padStart(2, '0');
            const minutes = parts[1].padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        setEditForm({
            clock_in: parseTime(entry.clock_in),
            clock_out: parseTime(entry.clock_out),
            break_duration: Math.round((entry.break_duration || 0) * 60), // Convert to minutes
            project: entry.project || '',
            notes: entry.notes || ''
        });
    }

    async function handleDelete() {
        if (!editingEntry) return;
        if (!confirm('Eintrag wirklich löschen?')) return;

        setActionLoading(true);
        try {
            await timeTrackingApi.deleteEntry(editingEntry.name);
            setEditingEntry(null);
            await loadData();
        } catch (e: any) {
            alert('Fehler: ' + e.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleEditSave() {
        if (!editingEntry) return;
        setActionLoading(true);
        try {
            await timeTrackingApi.updateEntry(editingEntry.name, {
                clock_in: editForm.clock_in ? editForm.clock_in + ':00' : undefined,
                clock_out: editForm.clock_out ? editForm.clock_out + ':00' : undefined,
                break_duration: editForm.break_duration / 60, // Convert back to hours
                project: editForm.project || undefined,
                notes: editForm.notes || undefined
            });
            setEditingEntry(null);
            await loadData();
        } catch (e: any) {
            alert('Fehler: ' + e.message);
        } finally {
            setActionLoading(false);
        }
    }

    const isWorking = todayEntry?.status === 'Aktiv' && todayEntry?.clock_in && !todayEntry?.clock_out;
    const isOnBreak = isWorking && todayEntry?.break_start && !todayEntry?.break_end;

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;
    }

    return (
        <div style={{ padding: '1rem', paddingBottom: '2rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Zeiterfassung</h1>
            </header>

            {/* Today's Status Card */}
            <div className="card" style={{
                marginBottom: '1.5rem',
                background: isWorking
                    ? (isOnBreak ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)')
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white'
            }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {isOnBreak ? '☕ Pause' : isWorking ? '🟢 Arbeite' : '⏸️ Nicht eingestempelt'}
                </div>

                {todayEntry?.clock_in && (
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Beginn</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{todayEntry.clock_in?.slice(0, 5)}</div>
                        </div>
                        {todayEntry.clock_out && (
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Ende</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{todayEntry.clock_out?.slice(0, 5)}</div>
                            </div>
                        )}
                        {todayEntry.working_hours != null && (
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Stunden</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{todayEntry.working_hours.toFixed(1)}h</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Break Times */}
                {(todayEntry?.break_start || todayEntry?.break_duration != null) && (
                    <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 'var(--radius-md)',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>☕</span>
                            <span style={{ fontWeight: 600 }}>Pause</span>
                        </div>
                        {todayEntry?.break_start && (
                            <div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Start</div>
                                <div style={{ fontWeight: 500 }}>{todayEntry.break_start?.slice(0, 5)}</div>
                            </div>
                        )}
                        {todayEntry?.break_end && (
                            <div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Ende</div>
                                <div style={{ fontWeight: 500 }}>{todayEntry.break_end?.slice(0, 5)}</div>
                            </div>
                        )}
                        {todayEntry?.break_duration != null && todayEntry.break_duration > 0 && (
                            <div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Dauer</div>
                                <div style={{ fontWeight: 500 }}>{(todayEntry.break_duration * 60).toFixed(0)} min</div>
                            </div>
                        )}
                        {isOnBreak && (
                            <div style={{
                                marginLeft: 'auto',
                                backgroundColor: 'rgba(255,255,255,0.25)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                🔄 Läuft...
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!isWorking && !todayEntry?.clock_out && (
                        <>
                            {projects.length > 0 && (
                                <select
                                    value={selectedProject}
                                    onChange={e => setSelectedProject(e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        flex: 1
                                    }}
                                >
                                    <option value="">Kein Projekt</option>
                                    {projects.map(p => (
                                        <option key={p.name} value={p.name}>{p.project_name || p.name}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={handleClockIn}
                                disabled={actionLoading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    backgroundColor: 'white',
                                    color: '#10b981',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                ▶ Einstempeln
                            </button>
                        </>
                    )}

                    {isWorking && !isOnBreak && (
                        <>
                            <button
                                onClick={handleBreakStart}
                                disabled={actionLoading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '2px solid white',
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                ☕ Pause
                            </button>
                            <button
                                onClick={handleClockOut}
                                disabled={actionLoading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    backgroundColor: 'white',
                                    color: '#ef4444',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                ⏹ Ausstempeln
                            </button>
                        </>
                    )}

                    {isOnBreak && (
                        <button
                            onClick={handleBreakEnd}
                            disabled={actionLoading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: 'white',
                                color: '#10b981',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            ▶ Pause beenden
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Entries */}
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Letzte 7 Tage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentEntries.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Keine Einträge gefunden.</p>
                ) : (
                    recentEntries.map(entry => (
                        <div
                            key={entry.name}
                            className="card"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem 1rem'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 500 }}>
                                    {format(new Date(entry.date), 'EEE, dd.MM.', { locale: de })}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {entry.project && <span>{entry.project}</span>}
                                    {entry.break_duration != null && entry.break_duration > 0 && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            ☕ {(entry.break_duration * 60).toFixed(0)}min
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {entry.working_hours?.toFixed(1) || '–'}h
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {entry.clock_in?.slice(0, 5)} - {entry.clock_out?.slice(0, 5) || '...'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEditModal(entry)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.25rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem'
                                    }}
                                    title="Bearbeiten"
                                >
                                    ✏️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingEntry && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                            ✏️ Eintrag bearbeiten
                        </h2>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Beginn</label>
                                <input
                                    type="time"
                                    value={editForm.clock_in}
                                    onChange={e => setEditForm({ ...editForm, clock_in: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Ende</label>
                                <input
                                    type="time"
                                    value={editForm.clock_out}
                                    onChange={e => setEditForm({ ...editForm, clock_out: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Pause (Minuten)</label>
                            <input
                                type="number"
                                min="0"
                                value={editForm.break_duration}
                                onChange={e => setEditForm({ ...editForm, break_duration: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Projekt</label>
                            <select
                                value={editForm.project}
                                onChange={e => setEditForm({ ...editForm, project: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                            >
                                <option value="">Kein Projekt</option>
                                {projects.map(p => (
                                    <option key={p.name} value={p.name}>{p.project_name || p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Notizen</label>
                            <textarea
                                value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={2}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    padding: '0.75rem',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                                disabled={actionLoading}
                                title="Löschen"
                            >
                                🗑️
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingEntry(null)}
                                className="btn"
                                style={{ flex: 1, backgroundColor: '#e2e8f0', color: 'black', padding: '0.75rem', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={handleEditSave}
                                className="btn btn-primary"
                                style={{ flex: 1, backgroundColor: '#10b981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Speichern...' : 'Speichern'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
