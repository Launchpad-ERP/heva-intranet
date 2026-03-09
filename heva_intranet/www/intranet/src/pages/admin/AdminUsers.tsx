import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { type User } from '../../api/admin';

export default function AdminEmployees() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({
        first_name: '',
        last_name: '',
        email: '',
        send_welcome_email: true
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setIsLoading(true);
            const fetchedUsers = await adminApi.getAllUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createNewUser({
                ...newUser,
                send_welcome_email: newUser.send_welcome_email ? 1 : 0
            });
            setShowModal(false);
            setNewUser({ first_name: '', last_name: '', email: '', send_welcome_email: true });
            fetchUsers();
            alert('Benutzer erfolgreich erstellt.');
        } catch (error) {
            console.error('Failed to create user', error);
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
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Benutzerverwaltung</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Neue Benutzer zum Intranet hinzufügen und bestehende verwalten</p>
                </div>
                <button className="btn btn-primary" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', height: '48px' }} onClick={() => setShowModal(true)}>
                    + Neuer Benutzer
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Benutzer</th>
                            <th style={{ padding: '1rem' }}>E-Mail</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center' }}>Laden...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center' }}>Keine Benutzer gefunden.</td></tr>
                        ) : users.map((user) => (
                            <tr key={user.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: 'var(--radius-full)',
                                        backgroundColor: '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem',
                                        flexShrink: 0
                                    }}>
                                        {user.full_name?.charAt(0) || user.name.charAt(0)}
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{user.full_name || user.name}</span>
                                </td>
                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem',
                                        whiteSpace: 'nowrap',
                                        backgroundColor: user.enabled ? '#dcfce7' : '#fee2e2',
                                        color: user.enabled ? '#166534' : '#b91c1c'
                                    }}>
                                        {user.enabled ? 'Aktiv' : 'Deaktiviert'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>Neuen Benutzer hinzufügen</h2>
                        <form onSubmit={handleCreateUser}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Vorname</label>
                                <input
                                    type="text"
                                    required
                                    className="btn"
                                    style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white', textAlign: 'left' }}
                                    value={newUser.first_name}
                                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nachname</label>
                                <input
                                    type="text"
                                    required
                                    className="btn"
                                    style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white', textAlign: 'left' }}
                                    value={newUser.last_name}
                                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>E-Mail</label>
                                <input
                                    type="email"
                                    required
                                    className="btn"
                                    style={{ width: '100%', height: '44px', border: '1px solid #e2e8f0', backgroundColor: 'white', textAlign: 'left' }}
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="send_email"
                                    style={{ width: '20px', height: '20px' }}
                                    checked={newUser.send_welcome_email}
                                    onChange={(e) => setNewUser({ ...newUser, send_welcome_email: e.target.checked })}
                                />
                                <label htmlFor="send_email" style={{ cursor: 'pointer' }}>Willkommens-E-Mail senden</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexDirection: window.innerWidth < 480 ? 'column-reverse' : 'row' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ border: '1px solid #e2e8f0', height: '48px' }}>Abbrechen</button>
                                <button type="submit" className="btn btn-primary" style={{ height: '48px' }}>Erstellen</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
