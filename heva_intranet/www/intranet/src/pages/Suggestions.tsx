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
        <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>💡 Kummerbox</h1>
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
                            style={{ cursor: 'pointer' }}
                            onClick={() => openSuggestion(suggestion)}
                        >
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {/* Upvote Button */}
                                <div
                                    onClick={(e) => { e.stopPropagation(); handleUpvote(suggestion.name); }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '0.5rem',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 'var(--radius-md)',
                                        minWidth: '50px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>👍</span>
                                    <span style={{ fontWeight: 600 }}>{suggestion.upvotes || 0}</span>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '999px',
                                            backgroundColor: TYPE_COLORS[suggestion.suggestion_type || ''] || '#6b7280',
                                            color: 'white'
                                        }}>
                                            {suggestion.suggestion_type || 'Sonstiges'}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '999px',
                                            backgroundColor: STATUS_COLORS[suggestion.status] || '#6b7280',
                                            color: 'white'
                                        }}>
                                            {suggestion.status}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                                        {suggestion.title}
                                    </h3>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)'
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
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#14b8a6',
                    color: 'white',
                    border: 'none',
                    fontSize: '2rem',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
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
                        maxHeight: '90vh',
                        borderTopLeftRadius: 'var(--radius-lg)',
                        borderTopRightRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        overflow: 'auto'
                    }}>
                        <h2 style={{ marginTop: 0 }}>💡 Neue Idee</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Titel *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Kurzer, prägnanter Titel"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kategorie</label>
                                    <select
                                        value={formData.suggestion_type}
                                        onChange={e => setFormData({ ...formData, suggestion_type: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="Prozessverbesserung">Prozessverbesserung</option>
                                        <option value="Arbeitsumgebung">Arbeitsumgebung</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Kommunikation">Kommunikation</option>
                                        <option value="Sonstiges">Sonstiges</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Priorität</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as 'Niedrig' | 'Mittel' | 'Hoch' })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="Niedrig">Niedrig</option>
                                        <option value="Mittel">Mittel</option>
                                        <option value="Hoch">Hoch</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Beschreibung *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Beschreibe deinen Vorschlag im Detail..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_anonymous === 1}
                                        onChange={e => setFormData({ ...formData, is_anonymous: e.target.checked ? 1 : 0 })}
                                    />
                                    🎭 Anonym einreichen
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn"
                                    style={{ flex: 1, backgroundColor: '#e2e8f0', color: 'black' }}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, backgroundColor: '#14b8a6' }}
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
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '1rem',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedSuggestion.title}</h2>
                            <button
                                onClick={() => setSelectedSuggestion(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '1rem', overflow: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '0.875rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    backgroundColor: TYPE_COLORS[selectedSuggestion.suggestion_type || ''] || '#6b7280',
                                    color: 'white'
                                }}>
                                    {selectedSuggestion.suggestion_type}
                                </span>
                                <span style={{
                                    fontSize: '0.875rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    backgroundColor: STATUS_COLORS[selectedSuggestion.status] || '#6b7280',
                                    color: 'white'
                                }}>
                                    {selectedSuggestion.status}
                                </span>
                                <span style={{
                                    fontSize: '0.875rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    backgroundColor: '#e2e8f0'
                                }}>
                                    👍 {selectedSuggestion.upvotes || 0}
                                </span>
                            </div>

                            <div
                                dangerouslySetInnerHTML={{ __html: selectedSuggestion.description || '' }}
                                style={{ lineHeight: 1.6, marginBottom: '1.5rem' }}
                            />

                            {selectedSuggestion.response && (
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#f0fdf4',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: '4px solid #10b981'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>📣 Antwort</div>
                                    <div dangerouslySetInnerHTML={{ __html: selectedSuggestion.response }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
