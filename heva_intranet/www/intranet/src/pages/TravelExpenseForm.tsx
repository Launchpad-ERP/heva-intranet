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
        <div style={{ padding: '1rem', paddingBottom: '6rem', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10, padding: '1rem 0' }}>
                <button onClick={() => navigate('/travel')} style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem', cursor: 'pointer', padding: '0.5rem' }}>←</button>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{id ? 'Bericht bearbeiten' : 'Neuer Bericht'}</h1>
            </header>

            {/* General Section */}
            <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', fontWeight: 600 }}>Allgemeine Angaben</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Reisebeschreibung *</label>
                        <input style={inputStyle} value={formData.trip_description} onChange={e => setFormData({ ...formData, trip_description: e.target.value })} placeholder="z.B. Kundenbesuch Berlin" />
                    </div>
                    <div>
                        <label style={labelStyle}>Reiseziel *</label>
                        <input style={inputStyle} value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="Ort / Stadt" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Zweck</label>
                            <select style={inputStyle} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value as any })}>
                                <option>Kundenbesuch</option>
                                <option>Schulung</option>
                                <option>Messe</option>
                                <option>Sonstiges</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Status</label>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{formData.status}</div>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Kunde (Freitext)</label>
                        <input style={inputStyle} value={formData.customer || ''} onChange={e => setFormData({ ...formData, customer: e.target.value })} placeholder="Name des Kunden" />
                    </div>
                    <div>
                        <label style={labelStyle}>Projekt (Freitext)</label>
                        <input style={inputStyle} value={formData.project || ''} onChange={e => setFormData({ ...formData, project: e.target.value })} placeholder="Projektbezeichnung" />
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: '0', fontWeight: 600 }}>Reisezeitraum</h2>
                    <button onClick={() => setShowCalendar(!showCalendar)} style={{
                        fontSize: '0.95rem',
                        backgroundColor: showCalendar ? '#f1f5f9' : '#eff6ff',
                        color: showCalendar ? '#475569' : '#2563eb',
                        border: showCalendar ? '1px solid #cbd5e1' : '1px solid #bfdbfe',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {showCalendar ? '🔽 Schließen' : '📅 Kalender öffnen'}
                    </button>
                </div>

                {showCalendar && (
                    <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#fff' }}>
                        <TouchRangeCalendar
                            startDate={formData.from_date || ''}
                            endDate={formData.to_date || ''}
                            onChange={(start, end) => setFormData(prev => ({ ...prev, from_date: start, to_date: end }))}
                        />
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Beginn *</label>
                        <input type="date" style={inputStyle} value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} />
                    </div>
                    <div>
                        <label style={labelStyle}>Ende *</label>
                        <input type="date" style={inputStyle} value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} />
                    </div>
                    <div>
                        <label style={labelStyle}>Startzeit</label>
                        <input type="time" style={inputStyle} value={formData.departure_time || ''} onChange={e => setFormData({ ...formData, departure_time: e.target.value })} />
                    </div>
                    <div>
                        <label style={labelStyle}>Rückkehr</label>
                        <input type="time" style={inputStyle} value={formData.return_time || ''} onChange={e => setFormData({ ...formData, return_time: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Meals */}
            {formData.meals_provided && formData.meals_provided.length > 0 && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Verpflegung</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                        Wurden Mahlzeiten vom Arbeitgeber oder Kunden gestellt? (kostenlos)
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {formData.meals_provided.map((meal, idx) => (
                            <div key={meal.date} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ fontWeight: 500, minWidth: '80px' }}>
                                    {format(new Date(meal.date), 'dd.MM.')}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem', gap: '0.2rem' }}>
                                        <span>Früh</span>
                                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={!!meal.breakfast_provided} onChange={e => {
                                            const newMeals = [...formData.meals_provided!];
                                            newMeals[idx].breakfast_provided = e.target.checked ? 1 : 0;
                                            setFormData({ ...formData, meals_provided: newMeals });
                                        }} />
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem', gap: '0.2rem' }}>
                                        <span>Mit</span>
                                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={!!meal.lunch_provided} onChange={e => {
                                            const newMeals = [...formData.meals_provided!];
                                            newMeals[idx].lunch_provided = e.target.checked ? 1 : 0;
                                            setFormData({ ...formData, meals_provided: newMeals });
                                        }} />
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.75rem', gap: '0.2rem' }}>
                                        <span>Abd</span>
                                        <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={!!meal.dinner_provided} onChange={e => {
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {formData.expense_items?.map((item, idx) => (
                        <div key={idx} style={{
                            backgroundColor: '#fff',
                            padding: '1.25rem',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            border: '1px solid #f1f5f9',
                            position: 'relative'
                        }}>
                            <button onClick={() => removeExpenseItem(idx)} style={{
                                position: 'absolute', top: '10px', right: '10px',
                                color: '#94a3b8', background: 'none', border: 'none', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer'
                            }}>×</button>

                            <div style={{ marginBottom: '1rem', paddingRight: '2rem' }}>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Art der Ausgabe</label>
                                <select style={{ ...inputStyle, fontWeight: 600, border: 'none', background: '#f8fafc', padding: '0.5rem' }} value={item.expense_type} onChange={e => updateExpenseItem(idx, 'expense_type', e.target.value)}>
                                    <option>Fahrtkosten</option>
                                    <option>Hotel</option>
                                    <option>Verpflegung</option>
                                    <option>Taxi</option>
                                    <option>Parkgebühren</option>
                                    <option>Sonstiges</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Datum</label>
                                    <button
                                        type="button"
                                        onClick={() => setOpenExpenseCalendar(openExpenseCalendar === idx ? null : idx)}
                                        style={{
                                            ...inputStyle,
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span>{item.date ? format(new Date(item.date), 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}</span>
                                        <span style={{ fontSize: '1.1rem' }}>📅</span>
                                    </button>
                                </div>
                                <div>
                                    <label style={labelStyle}>Betrag (€)</label>
                                    <input type="number" step="0.01" style={{ ...inputStyle, fontWeight: 600 }} value={item.amount} onChange={e => updateExpenseItem(idx, 'amount', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>

                            {openExpenseCalendar === idx && (
                                <div style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.5rem', backgroundColor: '#fff', borderTop: '4px solid #3b82f6' }}>
                                    <TouchSingleCalendar
                                        date={item.date}
                                        onChange={(newDate) => {
                                            updateExpenseItem(idx, 'date', newDate);
                                            setOpenExpenseCalendar(null);
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Beschreibung</label>
                                <input style={inputStyle} value={item.description} onChange={e => updateExpenseItem(idx, 'description', e.target.value)} placeholder="Details..." />
                            </div>

                            <div>
                                <label style={labelStyle}>Beleg</label>
                                {item.receipt ? (
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                                        <span style={{ marginRight: '0.5rem' }}>📄</span>
                                        <a href={item.receipt} target="_blank" rel="noreferrer" style={{ color: '#166534', flex: 1, textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Beleg ansehen</a>
                                        <button onClick={() => updateExpenseItem(idx, 'receipt', null)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Löschen</button>
                                    </div>
                                ) : (
                                    <label style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '1rem', border: '2px dashed #cbd5e1', borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer', background: '#f8fafc', color: 'var(--text-secondary)'
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

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'white', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        margin: '0 auto',
                        display: 'block',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: saving ? 0.8 : 1
                    }}
                >
                    {saving ? 'Speichert...' : 'Speichern'}
                </button>
            </div>
        </div>
    );
}
