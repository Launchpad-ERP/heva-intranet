import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { travelExpensesApi, type TravelExpense, type TravelMeal, type ExpenseItem } from '../api/travelExpenses';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import TouchRangeCalendar from '../components/common/TouchRangeCalendar';
import TouchSingleCalendar from '../components/common/TouchSingleCalendar';

export default function TravelExpenseForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();

    // Form State
    const [formData, setFormData] = useState<Partial<TravelExpense>>({
        trip_description: '',
        status: 'Entwurf',
        destination: '',
        purpose: 'Sonstiges',
        from_date: '',
        to_date: '',
        project: '', // Free text
        customer: '', // Free text
        meals_provided: [],
        expense_items: []
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [openExpenseCalendar, setOpenExpenseCalendar] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            loadEntry(id);
        }
    }, [id]);

    useEffect(() => {
        if (formData.from_date && formData.to_date) {
            updateMealsList(formData.from_date, formData.to_date);
        }
    }, [formData.from_date, formData.to_date]);

    async function loadEntry(name: string) {
        setLoading(true);
        try {
            const entry = await travelExpensesApi.getDetail(name);
            // Ensure child tables are arrays
            setFormData({
                ...entry,
                meals_provided: entry.meals_provided || [],
                expense_items: entry.expense_items || []
            });
        } catch (e: any) {
            alert('Fehler: ' + e.message);
            navigate('/travel');
        } finally {
            setLoading(false);
        }
    }

    function updateMealsList(start: string, end: string) {
        try {
            const startDate = parseISO(start);
            const endDate = parseISO(end);

            if (startDate > endDate) return;

            const days = eachDayOfInterval({ start: startDate, end: endDate });

            const newMeals: TravelMeal[] = days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const existing = formData.meals_provided?.find(m => m.date === dateStr);
                return existing || {
                    date: dateStr,
                    breakfast_provided: 0,
                    lunch_provided: 0,
                    dinner_provided: 0
                };
            });

            setFormData(prev => ({ ...prev, meals_provided: newMeals }));
        } catch (e) { }
    }

    async function handleSave() {
        if (!user?.name) return;
        if (!formData.trip_description || !formData.destination || !formData.from_date || !formData.to_date) {
            alert('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }

        setSaving(true);
        try {
            if (id) {
                await travelExpensesApi.update(id, formData);
            } else {
                await travelExpensesApi.create({
                    ...formData,
                    user: user.name
                } as any);
            }
            navigate('/travel');
        } catch (e: any) {
            alert('Speichern fehlgeschlagen: ' + e.message);
        } finally {
            setSaving(false);
        }
    }

    // --- Helper for Expense Items ---
    function addExpenseItem() {
        const newItem: ExpenseItem = {
            expense_type: 'Sonstiges',
            description: '',
            date: formData.from_date || format(new Date(), 'yyyy-MM-dd'),
            amount: 0
        };
        setFormData(prev => ({
            ...prev,
            expense_items: [...(prev.expense_items || []), newItem]
        }));
    }

    function removeExpenseItem(index: number) {
        if (confirm('Möchten Sie diese Position wirklich löschen?')) {
            setFormData(prev => ({
                ...prev,
                expense_items: prev.expense_items?.filter((_, i) => i !== index)
            }));
        }
    }

    function updateExpenseItem(index: number, field: keyof ExpenseItem, value: any) {
        const newItems = [...(formData.expense_items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, expense_items: newItems }));
    }

    async function handleFileUpload(index: number, file: File) {
        try {
            const result = await travelExpensesApi.uploadFile(file);
            if (result.message && result.message.file_url) {
                updateExpenseItem(index, 'receipt', result.message.file_url);
            }
        } catch (e) {
            alert('Upload fehlgeschlagen');
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #e2e8f0',
        fontSize: '1rem',
        backgroundColor: '#fff',
        boxSizing: 'border-box' as const
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.9rem',
        fontWeight: 500,
        marginBottom: '0.25rem',
        color: 'var(--text-secondary)'
    };

    const cardStyle = {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    };

    return (
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '7rem', maxWidth: '700px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                padding: '0.75rem 0',
                margin: window.innerWidth < 640 ? '0 -0.75rem 1.5rem -0.75rem' : '0 0 1.5rem 0',
                paddingLeft: window.innerWidth < 640 ? '0.75rem' : 0,
                borderBottom: '1px solid #f1f5f9'
            }}>
                <button
                    onClick={() => navigate('/travel')}
                    className="btn"
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', padding: '0.5rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.1rem' : '1.25rem', fontWeight: 700 }}>
                    {id ? 'Bericht bearbeiten' : 'Neuer Bericht'}
                </h1>
            </header>

            {/* General Section */}
            <div className="card" style={{ padding: window.innerWidth < 640 ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.05rem', margin: '0 0 1.25rem 0', fontWeight: 700, color: 'var(--primary-color)' }}>Allgemeine Angaben</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={labelStyle}>Reisebeschreibung *</label>
                        <input className="btn" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.trip_description} onChange={e => setFormData({ ...formData, trip_description: e.target.value })} placeholder="z.B. Kundenbesuch Berlin" />
                    </div>
                    <div>
                        <label style={labelStyle}>Reiseziel *</label>
                        <input className="btn" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="Ort / Stadt" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 480 ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
                        <div>
                            <label style={labelStyle}>Zweck</label>
                            <select className="btn" style={{ ...inputStyle, height: '48px', backgroundColor: 'white' }} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value as any })}>
                                <option>Kundenbesuch</option>
                                <option>Schulung</option>
                                <option>Messe</option>
                                <option>Sonstiges</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Status</label>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e2e8f0',
                                fontWeight: 700,
                                color: 'var(--primary-color)',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {formData.status}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Kunde (Freitext)</label>
                        <input className="btn" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.customer || ''} onChange={e => setFormData({ ...formData, customer: e.target.value })} placeholder="Name des Kunden" />
                    </div>
                    <div>
                        <label style={labelStyle}>Projekt (Freitext)</label>
                        <input className="btn" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.project || ''} onChange={e => setFormData({ ...formData, project: e.target.value })} placeholder="Projektbezeichnung" />
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div className="card" style={{ padding: window.innerWidth < 640 ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.05rem', margin: '0', fontWeight: 700, color: 'var(--primary-color)' }}>Reisezeitraum</h2>
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="btn"
                        style={{
                            fontSize: '0.8125rem',
                            backgroundColor: showCalendar ? '#f1f5f9' : '#eff6ff',
                            color: showCalendar ? '#475569' : '#2563eb',
                            border: showCalendar ? '1px solid #cbd5e1' : '1px solid #bfdbfe',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {showCalendar ? '🔽 Zu' : '📅 Kalender'}
                    </button>
                </div>

                {showCalendar && (
                    <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.5rem', backgroundColor: '#fff' }}>
                        <TouchRangeCalendar
                            startDate={formData.from_date || ''}
                            endDate={formData.to_date || ''}
                            onChange={(start, end) => setFormData(prev => ({ ...prev, from_date: start, to_date: end }))}
                        />
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 480 ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                        <label style={labelStyle}>Beginn *</label>
                        <input className="btn" type="date" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} />
                    </div>
                    <div>
                        <label style={labelStyle}>Ende *</label>
                        <input className="btn" type="date" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} />
                    </div>
                    <div>
                        <label style={labelStyle}>Startzeit</label>
                        <input className="btn" type="time" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.departure_time || ''} onChange={e => setFormData({ ...formData, departure_time: e.target.value })} />
                    </div>
                    <div>
                        <label style={labelStyle}>Rückkehr</label>
                        <input className="btn" type="time" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={formData.return_time || ''} onChange={e => setFormData({ ...formData, return_time: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Meals */}
            {formData.meals_provided && formData.meals_provided.length > 0 && (
                <div className="card" style={{ padding: window.innerWidth < 640 ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--primary-color)' }}>Verpflegung</h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                        Wurden Mahlzeiten vom Arbeitgeber oder Kunden gestellt? (kostenlos)
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {formData.meals_provided!.map((meal, idx) => (
                            <div key={meal.date} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.875rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ fontWeight: 700, minWidth: '80px', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                                    {format(new Date(meal.date), 'dd.MM.')}
                                </div>
                                <div style={{ display: 'flex', gap: '1.25rem' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem', gap: '0.35rem', cursor: 'pointer' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>F</span>
                                        <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={!!meal.breakfast_provided} onChange={e => {
                                            const newMeals = [...formData.meals_provided!];
                                            newMeals[idx].breakfast_provided = e.target.checked ? 1 : 0;
                                            setFormData({ ...formData, meals_provided: newMeals });
                                        }} />
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem', gap: '0.35rem', cursor: 'pointer' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>M</span>
                                        <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={!!meal.lunch_provided} onChange={e => {
                                            const newMeals = [...formData.meals_provided!];
                                            newMeals[idx].lunch_provided = e.target.checked ? 1 : 0;
                                            setFormData({ ...formData, meals_provided: newMeals });
                                        }} />
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem', gap: '0.35rem', cursor: 'pointer' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>A</span>
                                        <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={!!meal.dinner_provided} onChange={e => {
                                            const newMeals = [...formData.meals_provided!];
                                            newMeals[idx].dinner_provided = e.target.checked ? 1 : 0;
                                            setFormData({ ...formData, meals_provided: newMeals });
                                        }} />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expenses */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>Belege / Kosten</h2>
                    <button onClick={addExpenseItem} style={{
                        padding: '0.6rem 1rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                    }}>
                        + Position
                    </button>
                </div>

                {formData.expense_items?.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-lg)' }}>
                        Noch keine Ausgaben erfasst.
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {formData.expense_items?.map((item, idx) => (
                        <div key={idx} className="card" style={{
                            padding: window.innerWidth < 640 ? '1.25rem' : '1.5rem',
                            position: 'relative',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white'
                        }}>
                            <button
                                onClick={() => removeExpenseItem(idx)}
                                className="btn"
                                style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    color: '#ef4444', background: '#fee2e2', border: 'none',
                                    fontSize: '1.25rem', width: '32px', height: '32px',
                                    padding: 0, borderRadius: '50%', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>

                            <div style={{ marginBottom: '1.25rem', paddingRight: '2.5rem' }}>
                                <label style={labelStyle}>Art der Ausgabe</label>
                                <select
                                    className="btn"
                                    style={{ ...inputStyle, fontWeight: 700, backgroundColor: '#f8fafc', height: '48px' }}
                                    value={item.expense_type}
                                    onChange={e => updateExpenseItem(idx, 'expense_type', e.target.value)}
                                >
                                    <option>Fahrtkosten</option>
                                    <option>Hotel</option>
                                    <option>Verpflegung</option>
                                    <option>Taxi</option>
                                    <option>Parkgebühren</option>
                                    <option>Sonstiges</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 400 ? '1fr' : '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={labelStyle}>Datum</label>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setOpenExpenseCalendar(openExpenseCalendar === idx ? null : idx)}
                                        style={{
                                            ...inputStyle,
                                            height: '48px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                            {item.date ? format(new Date(item.date), 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                                        </span>
                                        <span style={{ fontSize: '1.1rem' }}>📅</span>
                                    </button>
                                </div>
                                <div>
                                    <label style={labelStyle}>Betrag (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="btn"
                                        style={{ ...inputStyle, fontWeight: 800, textAlign: 'left', height: '48px', color: 'var(--primary-color)' }}
                                        value={item.amount}
                                        onChange={e => updateExpenseItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            {openExpenseCalendar === idx && (
                                <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.5rem', backgroundColor: '#fff', borderTop: '4px solid var(--primary-color)' }}>
                                    <TouchSingleCalendar
                                        date={item.date}
                                        onChange={(newDate) => {
                                            updateExpenseItem(idx, 'date', newDate);
                                            setOpenExpenseCalendar(null);
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Beschreibung</label>
                                <input className="btn" style={{ ...inputStyle, textAlign: 'left', height: '48px' }} value={item.description} onChange={e => updateExpenseItem(idx, 'description', e.target.value)} placeholder="Details..." />
                            </div>

                            <div>
                                <label style={labelStyle}>Beleg</label>
                                {item.receipt ? (
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f0fdf4', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                                        <span style={{ marginRight: '0.75rem', fontSize: '1.25rem' }}>📄</span>
                                        <a href={item.receipt} target="_blank" rel="noreferrer" style={{ color: '#166534', flex: 1, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>Beleg ansehen</a>
                                        <button
                                            onClick={() => updateExpenseItem(idx, 'receipt', null)}
                                            className="btn"
                                            style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8125rem' }}
                                        >
                                            Entfernen
                                        </button>
                                    </div>
                                ) : (
                                    <label style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '1.25rem', border: '2px dashed #cbd5e1', borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer', background: '#f8fafc', color: 'var(--text-secondary)',
                                        transition: 'all 0.2s',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}>
                                        <input type="file" onChange={e => {
                                            if (e.target.files && e.target.files[0]) handleFileUpload(idx, e.target.files[0]);
                                        }} style={{ display: 'none' }} />
                                        <span>📸 Foto / PDF hochladen</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid #e2e8f0',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center'
            }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary btn-full"
                    style={{
                        maxWidth: '500px',
                        height: '52px',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                >
                    {saving ? '...' : (id ? 'Speichern' : 'Einreichen')}
                </button>
            </div>
        </div>
    );
}
