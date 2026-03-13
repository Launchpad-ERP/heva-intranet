import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeTrackingApi, type TimeEntry, type Project } from '../api/timeTracking';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AuthContext } from '../context/AuthContext';

declare global {
    interface Window {
        L: any;
    }
}

// TimeTracking Page

export default function TimeTracking() {
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);
    const [todayEntry, setTodayEntry] = useState<TimeEntry | null>(null);
    const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);

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
        if (authContext?.user?.name) {
            loadData();
        }
    }, [authContext?.user?.name]);

    async function getCoordinates(): Promise<{ lat?: number; long?: number }> {
        setIsGpsLoading(true);
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser.');
                setIsGpsLoading(false);
                resolve({});
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setIsGpsLoading(false);
                    resolve({
                        lat: position.coords.latitude,
                        long: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    setIsGpsLoading(false);
                    resolve({});
                },
                { timeout: 7000, enableHighAccuracy: true }
            );
        });
    }

    async function loadData() {
        if (!authContext?.user?.name) {
            console.warn('TimeTracking: loadData called without user name');
            return;
        }
        setLoading(true);
        try {
            console.log('TimeTracking: Fetching entries with filters...');
            const [todayList, recent, projectList] = await Promise.all([
                timeTrackingApi.getTodayEntry(authContext.user.name),
                timeTrackingApi.getRecentEntries(7, authContext.user.name),
                timeTrackingApi.getProjects()
            ]);
            console.log('TimeTracking: Data loaded. Recent entries count:', recent.length);
            setTodayEntry(todayList.length > 0 ? todayList[0] : null);
            setRecentEntries(recent);
            setProjects(projectList);
        } catch (e) {
            console.error('Failed to load time tracking data:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleClockIn(isOnSite: boolean = false) {
        if (!authContext?.user?.name) {
            alert('Benutzer nicht gefunden. Bitte erneut einloggen.');
            return;
        }
        setActionLoading(true);
        try {
            let coords: { lat?: number; long?: number } = {};
            if (isOnSite) {
                coords = await getCoordinates();
            }

            await timeTrackingApi.clockIn({
                user: authContext.user.name,
                project: selectedProject,
                is_onsite: isOnSite ? 1 : 0,
                lat: coords.lat,
                long: coords.long
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
            let coords: { lat?: number; long?: number } = {};
            if (todayEntry.is_onsite) {
                coords = await getCoordinates();
            }

            await timeTrackingApi.clockOut(todayEntry.name, coords.lat, coords.long);
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
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '3rem' }}>
            {/* GPS Loading Overlay */}
            {isGpsLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{
                        padding: '2rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        maxWidth: '280px'
                    }}>
                        <div style={{
                            fontSize: '3rem',
                            animation: 'pulse 1.5s infinite'
                        }}>📍</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Standort wird ermittelt...</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Bitte habe einen Moment Geduld, während wir deine Position erfassen.
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
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
                <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.25rem' : '1.5rem', fontWeight: 800 }}>Zeiterfassung</h1>
            </header>

            {/* Today's Status Card */}
            <div className="card" style={{
                marginBottom: '1.5rem',
                background: isWorking
                    ? (isOnBreak ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)')
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                padding: window.innerWidth < 640 ? '1rem' : '1.5rem'
            }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
                </div>
                <div style={{ fontSize: window.innerWidth < 640 ? '1.5rem' : '2rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {isOnBreak ? '☕ Pause' : isWorking ? (todayEntry?.is_onsite ? '📍 Vor Ort' : '🏠 Office') : '⏸️ Nicht eingestempelt'}
                </div>

                {todayEntry?.clock_in && (
                    <div style={{
                        display: 'flex',
                        gap: window.innerWidth < 640 ? '1rem' : '2rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: '1 1 100px' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Beginn</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{todayEntry.clock_in?.slice(0, 5)}</div>
                        </div>
                        {todayEntry.clock_out && (
                            <div style={{ flex: '1 1 100px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Ende</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{todayEntry.clock_out?.slice(0, 5)}</div>
                            </div>
                        )}
                        {todayEntry.working_hours != null && (
                            <div style={{ flex: '1 1 100px' }}>
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
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
                    {!isWorking && (
                        <>
                            {projects.length > 0 && (
                                <select
                                    className="btn"
                                    value={selectedProject}
                                    onChange={e => setSelectedProject(e.target.value)}
                                    style={{
                                        height: '48px',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        flex: '1 1 100%',
                                        backgroundColor: 'white',
                                        color: 'var(--text-color)',
                                        textAlign: 'left'
                                    }}
                                >
                                    <option value="">Kein Projekt</option>
                                    {projects.map(p => (
                                        <option key={p.name} value={p.name}>{p.project_name || p.name}</option>
                                    ))}
                                </select>
                            )}
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexDirection: window.innerWidth < 480 ? 'column' : 'row' }}>
                                <button
                                    onClick={() => handleClockIn(false)}
                                    disabled={actionLoading}
                                    style={{
                                        height: '48px',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        backgroundColor: 'white',
                                        color: '#6366f1',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        flex: 1
                                    }}
                                >
                                    🏠 Office
                                </button>
                                <button
                                    onClick={() => handleClockIn(true)}
                                    disabled={actionLoading}
                                    style={{
                                        height: '48px',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        backgroundColor: 'white',
                                        color: '#10b981',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        flex: 1
                                    }}
                                >
                                    📍 Vor Ort
                                </button>
                            </div>
                        </>
                    )}

                    {isWorking && !isOnBreak && (
                        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexDirection: window.innerWidth < 480 ? 'column' : 'row' }}>
                            <button
                                onClick={handleBreakStart}
                                disabled={actionLoading}
                                style={{
                                    height: '48px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '2px solid white',
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                ☕ Pause
                            </button>
                            <button
                                onClick={handleClockOut}
                                disabled={actionLoading}
                                style={{
                                    height: '48px',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    backgroundColor: 'white',
                                    color: '#ef4444',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                ⏹ Ausstempeln
                            </button>
                        </div>
                    )}

                    {isOnBreak && (
                        <button
                            onClick={handleBreakEnd}
                            disabled={actionLoading}
                            style={{
                                height: '48px',
                                width: '100%',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: 'white',
                                color: '#10b981',
                                fontWeight: 700,
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
                        <div key={entry.name}>
                            <div
                                className="card"
                                style={{
                                    display: 'flex',
                                    flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: window.innerWidth < 480 ? 'stretch' : 'center',
                                    padding: '0.75rem 1rem',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                        {format(new Date(entry.date), 'EEE, dd.MM.', { locale: de })}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                        <span style={{ backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                                            {entry.is_onsite ? '📍 Vor Ort' : '🏠 Office'}
                                        </span>
                                        {entry.project && <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>• {entry.project}</span>}
                                        {entry.break_duration != null && entry.break_duration > 0 && (
                                            <span>
                                                • ☕ {(entry.break_duration * 60).toFixed(0)}min
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    borderTop: window.innerWidth < 480 ? '1px solid #f1f5f9' : 'none',
                                    paddingTop: window.innerWidth < 480 ? '0.75rem' : 0
                                }}>
                                    <div style={{ textAlign: window.innerWidth < 480 ? 'left' : 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-color)' }}>
                                            {entry.working_hours?.toFixed(1) || '–'}h
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {entry.clock_in?.slice(0, 5)} - {entry.clock_out?.slice(0, 5) || '...'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openEditModal(entry)}
                                        className="btn"
                                        style={{
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            width: '40px',
                                            height: '40px',
                                            padding: 0,
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                        title="Bearbeiten"
                                    >
                                        ✏️
                                    </button>
                                </div>
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
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '450px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: window.innerWidth < 640 ? '1.25rem' : '2rem',
                        position: 'relative'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            ✏️ Eintrag bearbeiten
                        </h2>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexDirection: window.innerWidth < 400 ? 'column' : 'row' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Beginn</label>
                                <input
                                    type="time"
                                    className="btn"
                                    value={editForm.clock_in}
                                    onChange={e => setEditForm({ ...editForm, clock_in: e.target.value })}
                                    style={{ width: '100%', height: '44px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Ende</label>
                                <input
                                    type="time"
                                    className="btn"
                                    value={editForm.clock_out}
                                    onChange={e => setEditForm({ ...editForm, clock_out: e.target.value })}
                                    style={{ width: '100%', height: '44px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Pause (Minuten)</label>
                            <input
                                type="number"
                                min="0"
                                className="btn"
                                value={editForm.break_duration}
                                onChange={e => setEditForm({ ...editForm, break_duration: parseInt(e.target.value) || 0 })}
                                style={{ width: '100%', height: '44px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Projekt</label>
                            <select
                                className="btn"
                                value={editForm.project}
                                onChange={e => setEditForm({ ...editForm, project: e.target.value })}
                                style={{ width: '100%', height: '44px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left' }}
                            >
                                <option value="">Kein Projekt</option>
                                {projects.map(p => (
                                    <option key={p.name} value={p.name}>{p.project_name || p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Notizen</label>
                            <textarea
                                className="btn"
                                value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={3}
                                style={{ width: '100%', height: 'auto', minHeight: '80px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left', lineHeight: '1.4' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', flexDirection: window.innerWidth < 480 ? 'column-reverse' : 'row' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="btn"
                                    style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#ef4444',
                                        width: '48px',
                                        height: '48px',
                                        padding: 0,
                                        border: '1px solid #fecaca',
                                        flexShrink: 0
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
                                    style={{ flex: 1, backgroundColor: '#f1f5f9', color: 'var(--text-color)', height: '48px', border: '1px solid #e2e8f0' }}
                                >
                                    Abbruch
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleEditSave}
                                className="btn btn-primary"
                                style={{ flex: 1, height: '48px', fontWeight: 700 }}
                                disabled={actionLoading}
                            >
                                {actionLoading ? '...' : 'Speichern'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
