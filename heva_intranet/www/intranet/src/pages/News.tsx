import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsApi, type NewsArticle, type NewsCategory } from '../api/news';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function News() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

    useEffect(() => {
        loadData();
    }, [selectedCategory]);

    async function loadData() {
        setLoading(true);
        try {
            const [newsList, catList] = await Promise.all([
                newsApi.getNewsList(selectedCategory || undefined),
                categories.length === 0 ? newsApi.getCategories() : Promise.resolve(categories)
            ]);
            setArticles(newsList);
            if (categories.length === 0) {
                setCategories(catList as NewsCategory[]);
            }
        } catch (e) {
            console.error('Failed to load news:', e);
        } finally {
            setLoading(false);
        }
    }

    async function openArticle(article: NewsArticle) {
        try {
            const detail = await newsApi.getNewsDetail(article.name);
            setSelectedArticle(detail);
        } catch (e) {
            console.error('Failed to load article:', e);
        }
    }

    const getCategoryColor = (categoryName?: string) => {
        const cat = categories.find(c => c.name === categoryName);
        return cat?.color || '#6366f1';
    };

    if (loading && articles.length === 0) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;
    }

    return (
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '3rem' }}>
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
                <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.25rem' : '1.5rem', fontWeight: 800 }}>Neuigkeiten</h1>
            </header>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '0.625rem',
                    marginBottom: '1.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.75rem',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <button
                        onClick={() => setSelectedCategory('')}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            backgroundColor: !selectedCategory ? 'var(--primary-color)' : '#f1f5f9',
                            color: !selectedCategory ? 'white' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            boxShadow: !selectedCategory ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none'
                        }}
                    >
                        Alle
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: 'var(--radius-full)',
                                border: 'none',
                                backgroundColor: selectedCategory === cat.name ? (cat.color || 'var(--primary-color)') : '#f1f5f9',
                                color: selectedCategory === cat.name ? 'white' : 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                boxShadow: selectedCategory === cat.name ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Articles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {articles.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Keine Neuigkeiten gefunden.</p>
                ) : (
                    articles.map(article => (
                        <div
                            key={article.name}
                            onClick={() => openArticle(article)}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                borderLeft: `4px solid ${getCategoryColor(article.category)}`
                            }}
                        >
                            {article.image && (
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    style={{
                                        width: '100%',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '0.75rem'
                                    }}
                                />
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {article.is_pinned === 1 && (
                                    <span style={{ fontSize: '0.875rem' }}>📌</span>
                                )}
                                {article.category && (
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '999px',
                                        backgroundColor: getCategoryColor(article.category),
                                        color: 'white'
                                    }}>
                                        {article.category}
                                    </span>
                                )}
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{article.title}</h3>
                            {article.summary && (
                                <p style={{
                                    margin: '0 0 0.5rem 0',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.875rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {article.summary}
                                </p>
                            )}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <span>
                                    {article.publish_date && format(new Date(article.publish_date), 'dd. MMM yyyy', { locale: de })}
                                </span>
                                <span>👁 {article.views || 0}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Article Detail Modal */}
            {selectedArticle && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: window.innerWidth < 640 ? 'flex-end' : 'center',
                    zIndex: 1000,
                    padding: window.innerWidth < 640 ? 0 : '1rem',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: window.innerWidth < 640 ? '95vh' : '90vh',
                        borderRadius: window.innerWidth < 640 ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'var(--shadow-lg)',
                        animation: window.innerWidth < 640 ? 'slideUp 0.3s ease-out' : 'none'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.25rem',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '1rem'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 }}>{selectedArticle.title}</h2>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="btn"
                                style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '1.25rem',
                                    width: '36px',
                                    height: '36px',
                                    padding: 0,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '1.5rem', overflow: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                            {selectedArticle.image && (
                                <img
                                    src={selectedArticle.image}
                                    alt={selectedArticle.title}
                                    style={{
                                        width: '100%',
                                        height: window.innerWidth < 640 ? '180px' : '280px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '1.25rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}
                                />
                            )}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.8125rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {selectedArticle.author && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        👤 <span style={{ fontWeight: 600 }}>{selectedArticle.author}</span>
                                    </span>
                                )}
                                {selectedArticle.publish_date && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        📅 {format(new Date(selectedArticle.publish_date), 'dd. MMMM yyyy', { locale: de })}
                                    </span>
                                )}
                            </div>
                            <div
                                className="news-content"
                                dangerouslySetInnerHTML={{ __html: selectedArticle.content || '' }}
                                style={{
                                    lineHeight: 1.7,
                                    fontSize: '1rem',
                                    color: 'var(--text-color)'
                                }}
                            />
                        </div>

                        {/* Modal Footer (for mobile to close) */}
                        {window.innerWidth < 640 && (
                            <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                                <button
                                    onClick={() => setSelectedArticle(null)}
                                    className="btn btn-primary btn-full"
                                    style={{ height: '48px', fontWeight: 700 }}
                                >
                                    Schließen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
