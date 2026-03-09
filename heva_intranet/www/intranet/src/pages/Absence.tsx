import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { absenceApi, type AbsenceRequest, type AbsenceType } from '../api/absence';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import TouchRangeCalendar from '../components/common/TouchRangeCalendar';

export default function Absence() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState<AbsenceRequest[]>([]);
    const [types, setTypes] = useState<AbsenceType[]>([]);
    const [users, setUsers] = useState<{ name: string; full_name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        absence_type: '',
        from_date: '',
        to_date: '',
        reason: '',
        half_day: 0,
        substitute: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [reqs, typeList, userList] = await Promise.all([
                absenceApi.getMyRequests(user?.name),
                absenceApi.getAbsenceTypes(),
                absenceApi.getUsers()
            ]);
            setRequests(reqs);
            setTypes(typeList);
            setUsers(userList);
            if (typeList.length > 0 && !formData.absence_type) {
                setFormData(prev => ({ ...prev, absence_type: typeList[0].name }));
            }
        } catch (e) {
            console.error('Failed to load absence data', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user?.name) {
                alert('Benutzername konnte nicht ermittelt werden.');
                setLoading(false);
                return;
            }

            if (editingId) {
                await absenceApi.updateRequest(editingId, formData);
            } else {
                await absenceApi.createRequest({
                    ...formData,
                    user: user.name,
                    status: 'Entwurf' // Default status
                });
            }
            setShowForm(false);
            setShowCalendar(false);
            setEditingId(null);
            setFormData({
                absence_type: types[0]?.name || '',
                from_date: '',
                to_date: '',
                reason: '',
                half_day: 0,
                substitute: ''
            });
            await loadData();
        } catch (e: any) {
            console.error(e);
            alert('Fehler beim Erstellen: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(name: string) {
        if (!confirm('Antrag wirklich löschen?')) return;
        setLoading(true);
        try {
            await absenceApi.deleteRequest(name);
            await loadData();
        } catch (e: any) {
            console.error(e);
            alert('Fehler beim Löschen: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(req: AbsenceRequest) {
        setFormData({
            absence_type: req.absence_type,
            from_date: req.from_date,
            to_date: req.to_date,
            reason: req.reason || '',
            half_day: req.half_day || 0,
            substitute: req.substitute || ''
        });
        setEditingId(req.name);
        setShowForm(true);
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Genehmigt':
            case 'Approved': return 'var(--success-color)';
            case 'Abgelehnt':
            case 'Rejected': return 'var(--error-color)';
            case 'Entwurf':
            case 'Eingereicht':
            case 'Open': return 'var(--primary-color)';
            default: return 'var(--text-secondary)';
        }
    };



    async function initializeDefaults() {
        if (!confirm('Sollen Standard-Abwesenheitstypen (Urlaub, Krankheit, Home Office) angelegt werden?')) return;
        setLoading(true);
        try {
            // Ensure Module Exists
            try {
                await api('frappe.client.insert', {
                    method: 'POST',
                    data: {
                        doc: {
                            doctype: 'Module Def',
                            module_name: 'Heva Intranet',
                            app_name: 'heva_intranet',
                            custom: 1
                        }
                    }
                });
            } catch (e) {
                console.log('Module might already exist or permission denied', e);
            }

            const defaults = [
                { name: 'Urlaub', color: '#3b82f6', requires_approval: 1, max_days_per_year: 30 },
                { name: 'Krankheit', color: '#ef4444', requires_approval: 0, max_days_per_year: 0 },
                { name: 'Home Office', color: '#10b981', requires_approval: 0, max_days_per_year: 0 },
                { name: 'Überstundenabbau', color: '#f59e0b', requires_approval: 1, max_days_per_year: 0 }
            ];

            for (const d of defaults) {
                try {
                    // Mapping local interface keys to DocType fields (name -> type_name)
                    // Wait, createAbsenceType uses Partial<AbsenceType>. 
                    // AbsenceType interface has 'name', but DocType has 'type_name'. 
                    // API implementation wraps data into `doc`. 
                    // We need to send `type_name` because that's the field name in JSON.
                    await absenceApi.createAbsenceType({
                        // @ts-ignore
                        type_name: d.name,
                        color: d.color,
                        requires_approval: d.requires_approval,
                        max_days_per_year: d.max_days_per_year
                    });
                } catch (e) {
                    console.warn('Type might already exist', d.name);
                }
            }
            await loadData();
            alert('Typen erfolgreich angelegt!');
        } catch (e: any) {
            console.error(e);
            alert('Fehler: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading && !requests.length) return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;

    return (
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '6rem' }}>
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
                <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.25rem' : '1.5rem', fontWeight: 800 }}>Abwesenheiten</h1>
            </header>

            {/* Empty State / Seeding */}
            {!loading && types.length === 0 && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #bfdbfe',
                    textAlign: 'center'
                }}>
                    <p style={{ marginTop: 0 }}>Es wurden noch keine Abwesenheitsarten gefunden.</p>
                    <button
                        onClick={initializeDefaults}
                        className="btn btn-primary"
                    >
                        Standard-Typen anlegen
                    </button>
                </div>
            )}

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Keine Einträge gefunden.</p>
                ) : (
                    requests.map(req => (
                        <div
                            key={req.name}
                            className="card"
                            style={{
                                display: 'flex',
                                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                                justifyContent: 'space-between',
                                alignItems: window.innerWidth < 480 ? 'stretch' : 'center',
                                gap: '1rem',
                                padding: '1rem'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '1rem', color: 'var(--text-color)' }}>
                                    {req.absence_type}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    {format(new Date(req.from_date), 'dd. MMM yyyy', { locale: de })}
                                    {req.from_date !== req.to_date && ` - ${format(new Date(req.to_date), 'dd. MMM yyyy', { locale: de })}`}
                                </div>
                                {req.reason && (
                                    <div style={{
                                        fontSize: '0.875rem',
                                        marginTop: '0.5rem',
                                        padding: '0.5rem',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '4px',
                                        borderLeft: '3px solid #e2e8f0'
                                    }}>
                                        {req.reason}
                                    </div>
                                )}
                                {req.substitute && (
                                    <div style={{ fontSize: '0.8125rem', marginTop: '0.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        👤 Vertretung: <span style={{ fontWeight: 600 }}>{users.find(u => u.name === req.substitute)?.full_name || req.substitute}</span>
                                    </div>
                                )}
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: window.innerWidth < 480 ? 'row' : 'column',
                                alignItems: window.innerWidth < 480 ? 'center' : 'flex-end',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                borderTop: window.innerWidth < 480 ? '1px solid #f1f5f9' : 'none',
                                paddingTop: window.innerWidth < 480 ? '0.75rem' : 0
                            }}>
                                <div style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: getStatusColor(req.status),
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em'
                                }}>
                                    {req.status}
                                </div>
                                {req.status === 'Entwurf' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEdit(req)}
                                            className="btn"
                                            style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                width: '40px',
                                                height: '40px',
                                                padding: 0,
                                                fontSize: '1rem',
                                                cursor: 'pointer'
                                            }}
                                        >✏️</button>
                                        <button
                                            onClick={() => handleDelete(req.name)}
                                            className="btn"
                                            style={{
                                                background: '#fee2e2',
                                                border: '1px solid #fecaca',
                                                color: '#ef4444',
                                                width: '40px',
                                                height: '40px',
                                                padding: 0,
                                                fontSize: '1rem',
                                                cursor: 'pointer'
                                            }}
                                        >🗑️</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>


            {/* FAB */}
            <button
                onClick={() => {
                    setFormData({
                        absence_type: types[0]?.name || '',
                        from_date: '',
                        to_date: '',
                        reason: '',
                        half_day: 0,
                        substitute: ''
                    });
                    setEditingId(null);
                    setShowCalendar(false);
                    setShowForm(true);
                }}
                style={{
                    position: 'fixed',
                    bottom: '2.5rem',
                    right: '1.5rem',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    fontSize: '2rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 900,
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                }}
            >
                +
            </button>

            {/* Modal / Form Overlay */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    zIndex: 1000
                }}>
                    <div className="card" style={{
                        backgroundColor: 'var(--surface-color)',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '95vh',
                        overflowY: 'auto',
                        borderTopLeftRadius: 'var(--radius-lg)',
                        borderTopRightRadius: 'var(--radius-lg)',
                        padding: window.innerWidth < 640 ? '1.25rem' : '2rem',
                        animation: 'slideUp 0.3s ease-out',
                        boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>{editingId ? 'Antrag bearbeiten' : 'Neuer Antrag'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Typ</label>
                                <select
                                    className="btn"
                                    value={formData.absence_type}
                                    onChange={e => setFormData({ ...formData, absence_type: e.target.value })}
                                    style={{ width: '100%', height: '48px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left' }}
                                >
                                    {types.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.25rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ZEITRAUM</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="btn"
                                        style={{
                                            backgroundColor: 'white',
                                            border: '1px solid #cbd5e1',
                                            padding: '0.4rem 0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {showCalendar ? '🔽 Schließen' : '📅 Kalender'}
                                    </button>
                                </div>

                                {showCalendar && (
                                    <div style={{ marginBottom: '1rem', backgroundColor: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                                        <TouchRangeCalendar
                                            startDate={formData.from_date}
                                            endDate={formData.to_date}
                                            onChange={(start, end) => setFormData({ ...formData, from_date: start, to_date: end })}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', flexDirection: window.innerWidth < 400 ? 'column' : 'row' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>VON</label>
                                        <div style={{ padding: '0.75rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500 }}>
                                            {formData.from_date ? format(new Date(formData.from_date), 'dd.MM.yyyy', { locale: de }) : '---'}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>BIS</label>
                                        <div style={{ padding: '0.75rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500 }}>
                                            {formData.to_date ? format(new Date(formData.to_date), 'dd.MM.yyyy', { locale: de }) : '---'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Vertretung (Optional)</label>
                                <input
                                    list="user-list"
                                    type="text"
                                    className="btn"
                                    placeholder="Name suchen..."
                                    value={formData.substitute ? (users.find(u => u.name === formData.substitute)?.full_name || formData.substitute) : ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const foundUser = users.find(u => u.full_name === val);
                                        setFormData({ ...formData, substitute: foundUser ? foundUser.name : val });
                                    }}
                                    style={{ width: '100%', height: '48px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left' }}
                                />
                                <datalist id="user-list">
                                    {users.map(u => (
                                        <option key={u.name} value={u.full_name} />
                                    ))}
                                </datalist>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Begründung</label>
                                <textarea
                                    className="btn"
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', height: 'auto', minHeight: '80px', border: '1px solid #cbd5e1', backgroundColor: 'white', textAlign: 'left', lineHeight: '1.4' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexDirection: window.innerWidth < 480 ? 'column-reverse' : 'row' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}
                                    className="btn"
                                    style={{ flex: 1, height: '48px', backgroundColor: '#f1f5f9', color: 'var(--text-color)', fontWeight: 600, border: '1px solid #e2e8f0' }}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, height: '48px', fontWeight: 700 }}
                                    disabled={loading}
                                >
                                    {loading ? '...' : (editingId ? 'Speichern' : 'Einreichen')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
