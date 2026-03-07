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
        <div style={{ padding: '1rem', paddingBottom: '2rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', marginRight: '1rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Events</h1>
            </header>

            {/* Toggle Past/Upcoming */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem'
            }}>
                <button
                    onClick={() => setShowPast(false)}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: !showPast ? 'var(--primary-color)' : '#e2e8f0',
                        color: !showPast ? 'white' : 'inherit',
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                >
                    Kommende
                </button>
                <button
                    onClick={() => setShowPast(true)}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: showPast ? 'var(--primary-color)' : '#e2e8f0',
                        color: showPast ? 'white' : 'inherit',
                        fontWeight: 500,
                        cursor: 'pointer'
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
                                gap: '1rem'
                            }}
                        >
                            {/* Date Badge */}
                            <div style={{
                                minWidth: '60px',
                                textAlign: 'center',
                                padding: '0.5rem',
                                backgroundColor: EVENT_TYPE_COLORS[event.event_type || ''] || '#6366f1',
                                borderRadius: 'var(--radius-md)',
                                color: 'white'
                            }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                    {format(new Date(event.start_datetime), 'dd')}
                                </div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    {format(new Date(event.start_datetime), 'MMM', { locale: de })}
                                </div>
                            </div>

                            {/* Event Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: EVENT_TYPE_COLORS[event.event_type || ''] || 'var(--text-secondary)',
                                    marginBottom: '0.25rem',
                                    fontWeight: 500
                                }}>
                                    {event.event_type || 'Event'}
                                </div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{event.title}</h3>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <span>🕐 {formatEventTime(event)}</span>
                                    {event.location && <span>📍 {event.location}</span>}
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
                        maxHeight: '80vh',
                        borderTopLeftRadius: 'var(--radius-lg)',
                        borderTopRightRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem',
                            background: `linear-gradient(135deg, ${EVENT_TYPE_COLORS[selectedEvent.event_type || ''] || '#6366f1'}, ${EVENT_TYPE_COLORS[selectedEvent.event_type || ''] || '#6366f1'}dd)`,
                            color: 'white'
                        }}>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    fontSize: '1.25rem',
                                    color: 'white',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                                {selectedEvent.event_type}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedEvent.title}</h2>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '1.5rem', overflow: 'auto', flex: 1 }}>
                            {/* Date & Time */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1rem',
                                padding: '1rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>📅</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {format(new Date(selectedEvent.start_datetime), 'EEEE, dd. MMMM yyyy', { locale: de })}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
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
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>📍</span>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Ort</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
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
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Organisator</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {selectedEvent.organizer}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {selectedEvent.description && (
                                <div style={{ marginTop: '1rem' }}>
                                    <h3 style={{ marginBottom: '0.5rem' }}>Beschreibung</h3>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                                        style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}
                                    />
                                </div>
                            )}

                            {/* Attendees Count */}
                            {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#f0fdf4',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                        {selectedEvent.attendees.length} Teilnehmer
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
