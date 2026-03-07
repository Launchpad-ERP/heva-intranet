import { api } from './client';
import { setCsrfToken, clearCsrfToken } from './client';

export interface User {
    name: string;
    full_name: string;
    email: string;
    image?: string;
    employee_id?: string;
}

export const authApi = {
    login: async (usr: string, pwd: string) => {
        const response = await api<any>('login', {
            method: 'POST',
            data: { usr, pwd }
        });
        // Frappe returns csrf_token in login response - store it
        if (response?.csrf_token) {
            setCsrfToken(response.csrf_token);
        }
        return response;
    },

    logout: async () => {
        clearCsrfToken();
        return api<void>('logout', { method: 'POST' });
    },

    getLoggedUser: () =>
        api<string>('frappe.auth.get_logged_user'),

    getCurrentUser: (userId: string = 'me') =>
        api<User>('frappe.client.get', {
            method: 'GET',
            params: {
                doctype: 'User',
                name: userId
            }
        }),

    getEmployeeId: async (userId: string) => {
        try {
            const result = await api<any>('frappe.client.get_value', {
                method: 'GET',
                params: {
                    doctype: 'Employee',
                    filters: JSON.stringify({ user_id: userId }),
                    fieldname: 'name'
                }
            });
            return result?.name || null;
        } catch (e) {
            return null;
        }
    }
};
