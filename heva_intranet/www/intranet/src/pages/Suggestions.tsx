import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestionsApi, type Suggestion } from '../api/suggestions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const TYPE_COLORS: Record<string, string> = {
    'Prozessverbesserung': '#3b82f6',
    'Arbeitsumgebung': '#10b981',
    'Tools': '#8b5cf6',
    'Kommunikation': '#f59e0b',
    'Sonstiges': '#6b7280'
};

const STATUS_COLORS: Record<string, string> = {
    'Neu': '#6366f1',
    'In Prüfung': '#f59e0b',
    'Akzeptiert': '#10b981',
    'Abgelehnt': '#ef4444',
    'Umgesetzt': '#22c55e'
};

export default function Suggestions() {
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

    // Form state
    const [formData, setFormData] = useState<{
        title: string;
        suggestion_type: string;
        priority: 'Niedrig' | 'Mittel' | 'Hoch';
        description: string;
        is_anonymous: number;
    }>({
        title: '',
        suggestion_type: 'Prozessverbesserung',
        priority: 'Mittel',
        description: '',
        is_anonymous: 0
    });

    useEffect(() => {
        loadSuggestions();
    }, []);

    async function loadSuggestions() {
        setLoading(true);
        try {
            const list = await suggestionsApi.getSuggestions();
            setSuggestions(list);
        } catch (e) {
            console.error('Failed to load suggestions:', e);
        } finally {
            setLoading(false);
        }
    }

    async function openSuggestion(suggestion: Suggestion) {
        try {
            const detail = await suggestionsApi.getSuggestionDetail(suggestion.name);
            setSelectedSuggestion(detail);
        } catch (e) {
            console.error('Failed to load suggestion:', e);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await suggestionsApi.createSuggestion(formData);
            setShowForm(false);
            setFormData({
                title: '',
                suggestion_type: 'Prozessverbesserung',
                priority: 'Mittel',
                description: '',
                is_anonymous: 0
            });
            await loadSuggestions();
        } catch (e: any) {
            alert('Fehler: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpvote(suggestionName: string) {
        try {
            await suggestionsApi.upvote(suggestionName);
            await loadSuggestions();
        } catch (e: any) {
            console.error('Vote failed:', e);
        }
    }

    if (loading && suggestions.length === 0) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;
    }

    return (
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '6rem' }}>
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
                <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.25rem' : '1.5rem', fontWeight: 800 }}>💡 Kummerbox</h1>
            </header>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Teile deine Ideen und Verbesserungsvorschläge!
            </p>

            {/* Suggestions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {suggestions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Noch keine Vorschläge. Sei der/die Erste!
                    </p>
                ) : (
                    suggestions.map(suggestion => (
                        <div
                            key={suggestion.name}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                padding: '1rem',
                                transition: 'transform 0.1s'
                            }}
                            onClick={() => openSuggestion(suggestion)}
                        >
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {/* Upvote Button */}
                                <div
                                    onClick={(e) => { e.stopPropagation(); handleUpvote(suggestion.name); }}
                                    className="btn"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.4rem',
                                        backgroundColor: '#f1f5f9',
                                        borderRadius: 'var(--radius-md)',
                                        minWidth: '48px',
                                        height: '56px',
                                        cursor: 'pointer',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>👍</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--primary-color)' }}>{suggestion.upvotes || 0}</span>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.35rem',
                                        marginBottom: '0.4rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: (TYPE_COLORS[suggestion.suggestion_type || ''] || '#6b7280') + '15',
                                            color: TYPE_COLORS[suggestion.suggestion_type || ''] || '#6b7280'
                                        }}>
                                            {suggestion.suggestion_type || 'Sonstiges'}
                                        </span>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: (STATUS_COLORS[suggestion.status] || '#6b7280') + '15',
                                            color: STATUS_COLORS[suggestion.status] || '#6b7280'
                                        }}>
                                            {suggestion.status}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3 }}>
                                        {suggestion.title}
                                    </h3>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        fontWeight: 500
                                    }}>
                                        {suggestion.is_anonymous ? '🎭 Anonym' : suggestion.submitted_by}
                                        {suggestion.submitted_at && ` • ${format(new Date(suggestion.submitted_at), 'dd.MM.yyyy', { locale: de })}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => setShowForm(true)}
                className="btn"
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.25rem',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    fontSize: '2.25rem',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 100,
                    paddingBottom: '4px' // Optical alignment for '+'
                }}
            >
                +
            </button>

            {/* New Suggestion Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: window.innerWidth < 640 ? 'flex-end' : 'center',
                    zIndex: 1000,
                    padding: window.innerWidth < 640 ? 0 : '1rem'
                }}>
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: window.innerWidth < 640 ? '92vh' : '85vh',
                        borderRadius: window.innerWidth < 640 ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
                        padding: '1.75rem 1.5rem',
                        overflow: 'auto',
                        border: 'none',
                        boxShadow: '0 -10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '1.5rem' }}>💡 Neue Idee</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Titel *</label>
                                <input
                                    type="text"
                                    required
                                    className="btn"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Kurzer, prägnanter Titel"
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', height: '48px', textAlign: 'left' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: window.innerWidth < 480 ? 'column' : 'row', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Kategorie</label>
                                    <select
                                        className="btn"
                                        value={formData.suggestion_type}
                                        onChange={e => setFormData({ ...formData, suggestion_type: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', height: '48px', appearance: 'none' }}
                                    >
                                        <option value="Prozessverbesserung">Prozessverbesserung</option>
                                        <option value="Arbeitsumgebung">Arbeitsumgebung</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Kommunikation">Kommunikation</option>
                                        <option value="Sonstiges">Sonstiges</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Priorität</label>
                                    <select
                                        className="btn"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as 'Niedrig' | 'Mittel' | 'Hoch' })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', height: '48px', appearance: 'none' }}
                                    >
                                        <option value="Niedrig">Niedrig</option>
                                        <option value="Mittel">Mittel</option>
                                        <option value="Hoch">Hoch</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Beschreibung *</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="btn"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Beschreibe deinen Vorschlag im Detail..."
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', resize: 'vertical', minHeight: '120px', textAlign: 'left' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
                                    <input
                                        type="checkbox"
                                        style={{ width: '22px', height: '22px' }}
                                        checked={formData.is_anonymous === 1}
                                        onChange={e => setFormData({ ...formData, is_anonymous: e.target.checked ? 1 : 0 })}
                                    />
                                    🎭 Anonym einreichen
                                </label>
                            </div>

                            <div style={{ display: 'flex', flexDirection: window.innerWidth < 480 ? 'column-reverse' : 'row', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn"
                                    style={{ flex: 1, height: '48px', fontWeight: 700 }}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, height: '48px', fontWeight: 700 }}
                                    disabled={loading}
                                >
                                    {loading ? 'Speichern...' : 'Einreichen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedSuggestion && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: window.innerWidth < 640 ? 'flex-end' : 'center',
                    zIndex: 1000,
                    padding: window.innerWidth < 640 ? 0 : '1rem'
                }}>
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: window.innerWidth < 640 ? '92vh' : '85vh',
                        borderRadius: window.innerWidth < 640 ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        border: 'none',
                        boxShadow: '0 -10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'white'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{selectedSuggestion.title}</h2>
                            <button
                                onClick={() => setSelectedSuggestion(null)}
                                className="btn"
                                style={{
                                    background: '#f1f5f9',
                                    border: 'none',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', overflow: 'auto', flex: 1, backgroundColor: 'white' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: (TYPE_COLORS[selectedSuggestion.suggestion_type || ''] || '#6b7280') + '15',
                                    color: TYPE_COLORS[selectedSuggestion.suggestion_type || ''] || '#6b7280'
                                }}>
                                    {selectedSuggestion.suggestion_type}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: (STATUS_COLORS[selectedSuggestion.status] || '#6b7280') + '15',
                                    color: STATUS_COLORS[selectedSuggestion.status] || '#6b7280'
                                }}>
                                    {selectedSuggestion.status}
                                </span>
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    <span>👍</span> {selectedSuggestion.upvotes || 0}
                                </div>
                            </div>

                            <div style={{
                                fontSize: '0.95rem',
                                lineHeight: 1.7,
                                color: 'var(--text-color)',
                                marginBottom: '2rem'
                            }}>
                                <div dangerouslySetInnerHTML={{ __html: selectedSuggestion.description || '' }} />
                            </div>

                            {selectedSuggestion.response && (
                                <div style={{
                                    padding: '1.25rem',
                                    backgroundColor: '#f0fdf4',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid #dcfce7'
                                }}>
                                    <div style={{ fontWeight: 800, marginBottom: '0.75rem', color: '#166534', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📣</span> ANTWORT VOM TEAM
                                    </div>
                                    <div
                                        style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#14532d' }}
                                        dangerouslySetInnerHTML={{ __html: selectedSuggestion.response }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem',
                            borderTop: '1px solid #f1f5f9',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => setSelectedSuggestion(null)}
                                className="btn btn-primary"
                                style={{ width: '100%', maxWidth: '200px', height: '48px', fontWeight: 800 }}
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
