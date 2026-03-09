import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, type IntranetEvent } from '../api/events';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EVENT_TYPE_COLORS: Record<string, string> = {
    'Kundenevent': '#3b82f6',
    'Firmenevent': '#10b981',
    'Messe': '#f59e0b',
    'Schulung': '#8b5cf6',
    'Feier': '#ec4899'
};

export default function Events() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<IntranetEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<IntranetEvent | null>(null);
    const [showPast, setShowPast] = useState(false);

    useEffect(() => {
        loadEvents();
    }, [showPast]);

    async function loadEvents() {
        setLoading(true);
        try {
            const eventList = showPast
                ? await eventsApi.getPastEvents()
                : await eventsApi.getUpcomingEvents();
            setEvents(eventList);
        } catch (e) {
            console.error('Failed to load events:', e);
        } finally {
            setLoading(false);
        }
    }

    async function openEvent(event: IntranetEvent) {
        try {
            const detail = await eventsApi.getEventDetail(event.name);
            setSelectedEvent(detail);
        } catch (e) {
            console.error('Failed to load event:', e);
        }
    }



    function formatEventTime(event: IntranetEvent) {
        if (event.is_all_day) return 'Ganztägig';
        const start = format(new Date(event.start_datetime), 'HH:mm');
        if (event.end_datetime) {
            const end = format(new Date(event.end_datetime), 'HH:mm');
            return `${start} - ${end}`;
        }
        return start;
    }

    if (loading && events.length === 0) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Laden...</div>;
    }

    return (
        <div style={{ padding: window.innerWidth < 640 ? '0.75rem' : '1.5rem', paddingBottom: '3rem' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem',
                gap: '0.25rem'
            }}>
                <button
                    onClick={() => navigate('/')}
                    className="btn"
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', padding: '0.5rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: window.innerWidth < 640 ? '1.25rem' : '1.5rem', fontWeight: 700 }}>Events</h1>
            </header>

            {/* Toggle Past/Upcoming */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '0.25rem',
                backgroundColor: '#f1f5f9',
                borderRadius: 'var(--radius-lg)'
            }}>
                <button
                    onClick={() => setShowPast(false)}
                    className="btn"
                    style={{
                        flex: 1,
                        padding: '0.625rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: !showPast ? 'white' : 'transparent',
                        color: !showPast ? 'var(--primary-color)' : 'var(--text-secondary)',
                        boxShadow: !showPast ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                    }}
                >
                    Kommende
                </button>
                <button
                    onClick={() => setShowPast(true)}
                    className="btn"
                    style={{
                        flex: 1,
                        padding: '0.625rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: showPast ? 'white' : 'transparent',
                        color: showPast ? 'var(--primary-color)' : 'var(--text-secondary)',
                        boxShadow: showPast ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                    }}
                >
                    Vergangene
                </button>
            </div>

            {/* Events List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {events.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {showPast ? 'Keine vergangenen Events.' : 'Keine kommenden Events.'}
                    </p>
                ) : (
                    events.map(event => (
                        <div
                            key={event.name}
                            onClick={() => openEvent(event)}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                gap: '1rem',
                                padding: '1rem',
                                transition: 'transform 0.1s'
                            }}
                        >
                            {/* Date Badge */}
                            <div style={{
                                minWidth: '54px',
                                height: '54px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                textAlign: 'center',
                                backgroundColor: (EVENT_TYPE_COLORS[event.event_type || ''] || '#6366f1') + '15',
                                borderRadius: 'var(--radius-md)',
                                color: EVENT_TYPE_COLORS[event.event_type || ''] || '#6366f1'
                            }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                                    {format(new Date(event.start_datetime), 'dd')}
                                </div>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                    {format(new Date(event.start_datetime), 'MMM', { locale: de })}
                                </div>
                            </div>

                            {/* Event Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: EVENT_TYPE_COLORS[event.event_type || ''] || 'var(--text-secondary)',
                                    marginBottom: '0.125rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em'
                                }}>
                                    {event.event_type || 'Event'}
                                </div>
                                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3 }}>{event.title}</h3>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    columnGap: '0.75rem',
                                    rowGap: '0.25rem',
                                    fontSize: '0.8125rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 500
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>🕐 {formatEventTime(event)}</span>
                                    {event.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>📍 {event.location}</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
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
                        maxWidth: '550px',
                        maxHeight: window.innerWidth < 640 ? '92vh' : '85vh',
                        borderRadius: window.innerWidth < 640 ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        bottom: 0,
                        border: 'none',
                        boxShadow: '0 -10px 25px rgba(0,0,0,0.1)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.75rem 1.5rem',
                            background: `linear-gradient(135deg, ${EVENT_TYPE_COLORS[selectedEvent.event_type || ''] || '#6366f1'}, ${EVENT_TYPE_COLORS[selectedEvent.event_type || ''] || '#6366f1'}cc)`,
                            color: 'white',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="btn"
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'rgba(255,255,255,0.25)',
                                    border: 'none',
                                    fontSize: '1.25rem',
                                    color: 'white',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, marginBottom: '0.5rem' }}>
                                {selectedEvent.event_type}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>{selectedEvent.title}</h2>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '1.5rem', overflow: 'auto', flex: 1, backgroundColor: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Date & Time */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 'var(--radius-lg)'
                                }}>
                                    <span style={{ fontSize: '1.5rem', filter: 'grayscale(0.5)' }}>📅</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                            {format(new Date(selectedEvent.start_datetime), 'EEEE, dd. MMMM yyyy', { locale: de })}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>
                                            {formatEventTime(selectedEvent)}
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                {selectedEvent.location && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 'var(--radius-lg)'
                                    }}>
                                        <span style={{ fontSize: '1.5rem', filter: 'grayscale(0.5)' }}>📍</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Ort</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>
                                                {selectedEvent.location}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Organizer */}
                                {selectedEvent.organizer && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 'var(--radius-lg)'
                                    }}>
                                        <span style={{ fontSize: '1.5rem', filter: 'grayscale(0.5)' }}>👤</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Organisator</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>
                                                {selectedEvent.organizer}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {selectedEvent.description && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: 800 }}>Beschreibung</h3>
                                        <div
                                            dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                                            style={{ lineHeight: 1.7, color: 'var(--text-color)', fontSize: '0.9375rem' }}
                                        />
                                    </div>
                                )}

                                {/* Attendees Count */}
                                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '1rem',
                                        backgroundColor: '#f0fdf4',
                                        borderRadius: 'var(--radius-lg)',
                                        textAlign: 'center',
                                        border: '1px solid #dcfce7'
                                    }}>
                                        <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.95rem' }}>
                                            ✅ {selectedEvent.attendees.length} Teilnehmer
                                        </span>
                                    </div>
                                )}
                            </div>
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
                                onClick={() => setSelectedEvent(null)}
                                className="btn btn-primary"
                                style={{ width: '100%', maxWidth: '200px', padding: '0.75rem', fontWeight: 800 }}
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
