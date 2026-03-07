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
        <div style={{ padding: '1rem', paddingBottom: '2rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Neuigkeiten</h1>
            </header>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem'
                }}>
                    <button
                        onClick={() => setSelectedCategory('')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '999px',
                            border: 'none',
                            backgroundColor: !selectedCategory ? 'var(--primary-color)' : '#e2e8f0',
                            color: !selectedCategory ? 'white' : 'inherit',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                        }}
                    >
                        Alle
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '999px',
                                border: 'none',
                                backgroundColor: selectedCategory === cat.name ? (cat.color || 'var(--primary-color)') : '#e2e8f0',
                                color: selectedCategory === cat.name ? 'white' : 'inherit',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
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
                        {/* Modal Header */}
                        <div style={{
                            padding: '1rem',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedArticle.title}</h2>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '1rem', overflow: 'auto', flex: 1 }}>
                            {selectedArticle.image && (
                                <img
                                    src={selectedArticle.image}
                                    alt={selectedArticle.title}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '1rem'
                                    }}
                                />
                            )}
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {selectedArticle.author && <span>Von: {selectedArticle.author}</span>}
                                {selectedArticle.publish_date && (
                                    <span>{format(new Date(selectedArticle.publish_date), 'dd. MMMM yyyy', { locale: de })}</span>
                                )}
                            </div>
                            <div
                                dangerouslySetInnerHTML={{ __html: selectedArticle.content || '' }}
                                style={{ lineHeight: 1.6 }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
