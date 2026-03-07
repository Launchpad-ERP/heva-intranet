import { createContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type User } from '../api/auth';

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (usr: string, pwd: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const loggedUser = await authApi.getLoggedUser();
            if (loggedUser && loggedUser !== 'Guest') {
                try {
                    const [distinctUser, employeeId] = await Promise.all([
                        authApi.getCurrentUser(loggedUser),
                        authApi.getEmployeeId(loggedUser)
                    ]);
                    setUser({ ...distinctUser, employee_id: employeeId || undefined });
                } catch (innerError) {
                    const employeeId = await authApi.getEmployeeId(loggedUser).catch(() => null);
                    setUser({ name: loggedUser, email: loggedUser, full_name: loggedUser, employee_id: employeeId || undefined });
                }
            } else {
                setUser(null);
            }
        } catch (e: any) {
            if (e.message && (e.message.includes('not whitelisted') || e.message.includes('permitted') || e.message.includes('403') || e.message.includes('401'))) {
                setUser(null);
                console.error('Auth check failed', e);
                setUser(null);
            }
        } finally {
            console.log('Auth check finished. User set to:', user); // Note: user state update is async, this log might show old value if relying on state, but here we are in function scope. 
            // Better to log inside useEffect or before setting
            setIsLoading(false);
        }
    }

    async function login(usr: string, pwd: string) {
        await authApi.login(usr, pwd);
        await checkAuth();
    }

    async function logout() {
        try {
            await authApi.logout();
        } catch (e) {
            console.warn('Logout failed', e);
        }
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
