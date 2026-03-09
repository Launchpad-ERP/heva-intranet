import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactElement, adminOnly?: boolean }) {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        console.log('ProtectedRoute: user:', user, 'isLoading:', isLoading, 'adminOnly:', adminOnly);
    }, [user, isLoading, adminOnly]);

    if (isLoading) {
        return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'var(--text-secondary)'
        }}>Laden...</div>;
    }

    if (!user) {
        console.log('ProtectedRoute: No user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    if (adminOnly) {
        const isAdmin = user.roles?.some(r => r.role === 'Intranet Admin' || r.role === 'Administrator') || user?.name === 'Administrator';
        if (!isAdmin) {
            console.log('ProtectedRoute: User is not an "Intranet Admin", redirecting to home');
            return <Navigate to="/" replace />;
        }
    }

    console.log('ProtectedRoute: Rendering children');
    return children;
}
