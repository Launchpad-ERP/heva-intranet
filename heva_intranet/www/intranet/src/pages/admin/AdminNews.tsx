import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { format, parseISO } from 'date-fns';

export default function AdminNews() {
    const [news, setNews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newArticle, setNewArticle] = useState({
        title: '',
        content: '',
        published: 1
    });

    useEffect(() => {
        fetchNews();
    }, []);

    async function fetchNews() {
        try {
            setIsLoading(true);
            const fetchedNews = await adminApi.getAllNews();
            setNews(fetchedNews);
        } catch (error) {
            console.error('Failed to fetch news', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleCreateNews = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createNews({
                ...newArticle,
                date: new Date().toISOString().split('T')[0]
            });
            setShowModal(false);
            setNewArticle({ title: '', content: '', published: 1 });
            fetchNews();
            alert('News erfolgreich erstellt.');
        } catch (error) {
            console.error('Failed to create news', error);
            alert(`Fehler beim Erstellen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
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
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>News Management</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Neuigkeiten im Intranet veröffentlichen und bearbeiten</p>
                </div>
                <button className="btn btn-primary" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', height: '48px' }} onClick={() => setShowModal(true)}>
                    + Neuer Beitrag
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {isLoading ? (
                    <div className="card" style={{ textAlign: 'center' }}>Laden...</div>
                ) : news.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center' }}>Keine Beiträge gefunden.</div>
                ) : news.map((article) => (
                    <div key={article.name} className="card" style={{
                        display: 'flex',
                        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: window.innerWidth < 640 ? 'flex-start' : 'center',
                        gap: '1rem'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.25rem 0' }}>{article.title}</h3>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {format(parseISO(article.date), 'dd.MM.yyyy')} - von {article.author || 'System'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: window.innerWidth < 640 ? '100%' : 'auto', justifyContent: 'space-between' }}>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.875rem',
                                backgroundColor: article.published ? '#dcfce7' : '#f1f5f9',
                                color: article.published ? '#166534' : '#475569'
                            }}>
                                {article.published ? 'Veröffentlicht' : 'Entwurf'}
                            </span>
                            <button className="btn" style={{ border: '1px solid #e2e8f0', height: '40px', padding: '0 1rem', fontWeight: 600 }}>Bearbeiten</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100,
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>Neuen News-Beitrag erstellen</h2>
                        <form onSubmit={handleCreateNews}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Titel</label>
                                <input
                                    type="text"
                                    required
                                    className="btn"
                                    style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white', textAlign: 'left' }}
                                    value={newArticle.title}
                                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Inhalt (HTML möglich)</label>
                                <textarea
                                    required
                                    rows={6}
                                    style={{
                                        width: '100%',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.75rem',
                                        fontFamily: 'inherit',
                                        backgroundColor: 'white'
                                    }}
                                    value={newArticle.content}
                                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexDirection: window.innerWidth < 480 ? 'column-reverse' : 'row' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ border: '1px solid #e2e8f0', height: '48px' }}>Abbrechen</button>
                                <button type="submit" className="btn btn-primary" style={{ height: '48px' }}>Veröffentlichen</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
