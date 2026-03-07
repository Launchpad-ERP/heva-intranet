import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        console.log('ProtectedRoute: user:', user, 'isLoading:', isLoading);
    }, [user, isLoading]);

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

    console.log('ProtectedRoute: Rendering children');
    return children;
}
