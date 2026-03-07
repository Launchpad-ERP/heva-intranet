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
        half_day: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [reqs, typeList] = await Promise.all([
                absenceApi.getMyRequests(user?.name),
                absenceApi.getAbsenceTypes()
            ]);
            setRequests(reqs);
            setTypes(typeList);
            if (typeList.length > 0) {
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
                half_day: 0
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
            half_day: req.half_day || 0
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
        <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem' }}>
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Abwesenheiten</h1>
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
                        <div key={req.name} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{req.absence_type}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {format(new Date(req.from_date), 'dd. MMM yyyy', { locale: de })}
                                    {req.from_date !== req.to_date && ` - ${format(new Date(req.to_date), 'dd. MMM yyyy', { locale: de })}`}
                                </div>
                                {req.reason && <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', fontStyle: 'italic' }}>{req.reason}</div>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <div style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: getStatusColor(req.status),
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {req.status}
                                </div>
                                {req.status === 'Entwurf' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(req)} style={{
                                            background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem 0.75rem', fontSize: '1rem', cursor: 'pointer'
                                        }}>✏️</button>
                                        <button onClick={() => handleDelete(req.name)} style={{
                                            background: 'none', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '4px', padding: '0.5rem 0.75rem', fontSize: '1rem', cursor: 'pointer'
                                        }}>🗑️</button>
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
                        half_day: 0
                    });
                    setEditingId(null);
                    setShowCalendar(false);
                    setShowForm(true);
                }}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    fontSize: '2rem',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        width: '100%',
                        maxWidth: '600px',
                        borderTopLeftRadius: 'var(--radius-lg)',
                        borderTopRightRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <h2 style={{ marginTop: 0 }}>{editingId ? 'Antrag bearbeiten' : 'Neuer Antrag'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Typ</label>
                                <select
                                    value={formData.absence_type}
                                    onChange={e => setFormData({ ...formData, absence_type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                                >
                                    {types.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Zeitraum</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #cbd5e1',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {showCalendar ? '🔽 Schließen' : '📅 Kalender öffnen'}
                                    </button>
                                </div>

                                {showCalendar && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <TouchRangeCalendar
                                            startDate={formData.from_date}
                                            endDate={formData.to_date}
                                            onChange={(start, end) => setFormData({ ...formData, from_date: start, to_date: end })}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Von</label>
                                        <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                                            {formData.from_date ? format(new Date(formData.from_date), 'dd.MM.yyyy', { locale: de }) : 'Bitte wählen'}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Bis</label>
                                        <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                                            {formData.to_date ? format(new Date(formData.to_date), 'dd.MM.yyyy', { locale: de }) : 'Bitte wählen'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Begründung</label>
                                <input
                                    type="text"
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}
                                    className="btn"
                                    style={{ flex: 1, backgroundColor: '#e2e8f0', color: 'black' }}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    disabled={loading}
                                >
                                    {loading ? 'Speichern...' : 'Einreichen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
