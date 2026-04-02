import { api } from './client';
import { type User as AuthUser } from './auth';
import { type TimeEntry as BaseTimeEntry } from './timeTracking';
import { type AbsenceRequest as BaseAbsenceRequest } from './absence';
import { type TravelExpense as BaseTravelExpense } from './travelExpenses';

// Extend base types with standard Frappe fields used in Admin context
export interface User extends AuthUser {
    enabled?: number;
    user_image?: string;
}

export interface TimeEntry extends BaseTimeEntry {
    owner: string;
}

export interface AbsenceRequest extends BaseAbsenceRequest {
    owner: string;
    user?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
}

export interface TravelExpense extends BaseTravelExpense {
    owner: string;
    user?: string;
    start_date?: string;
    end_date?: string;
}

export interface Suggestion {
    name: string;
    title: string;
    description: string;
    status: string;
    owner: string;
    creation: string;
}

export interface Training {
    name: string;
    title: string;
    date: string;
    instructor?: string;
    description?: string;
    max_participants?: number;
}

export interface TrainingParticipant {
    name: string;
    training: string;
    user: string;
    user_full_name?: string;
}

export const adminApi = {
    // User Management
    getAllUsers: () =>
        api<User[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'User',
                fields: JSON.stringify(['name', 'full_name', 'email', 'user_image', 'enabled']),
                filters: JSON.stringify([['enabled', '=', 1]]),
                limit_page_length: '1000'
            }
        }),

    createNewUser: (userData: {
        email: string;
        first_name: string;
        last_name: string;
        send_welcome_email?: number;
    }) =>
        api<User>('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'User',
                    email: userData.email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    send_welcome_email: userData.send_welcome_email ?? 1,
                    roles: [{ role: 'System Manager' }]
                }
            }
        }),

    // Time Tracking
    getAllTimeEntries: (filters: any[] = []) =>
        api<TimeEntry[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Time Entry',
                fields: JSON.stringify([
                    'name', 'owner', 'date', 'status', 'project',
                    'clock_in', 'clock_out', 'break_duration', 'working_hours', 'notes'
                ]),
                filters: JSON.stringify(filters),
                order_by: 'date desc, clock_in desc',
                limit_page_length: '1000'
            }
        }),

    updateEntry: (entryName: string, data: any) =>
        api('heva_intranet.api.update_time_entry', {
            method: 'POST',
            data: {
                name: entryName,
                data: JSON.stringify(data)
            }
        }),

    // Absence Management
    getAllAbsenceRequests: (filters: any[] = []) =>
        api<AbsenceRequest[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Absence Request',
                fields: JSON.stringify([
                    'name', 'owner', 'user', 'absence_type', 'from_date', 'to_date', 'status', 'reason', 'substitute'
                ]),
                filters: JSON.stringify(filters),
                order_by: 'from_date desc',
                limit_page_length: '1000'
            }
        }),

    updateAbsenceStatus: (name: string, status: string) =>
        api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Absence Request',
                name,
                fieldname: { status }
            }
        }),

    // Travel Expenses
    getAllTravelExpenses: (filters: any[] = []) =>
        api<TravelExpense[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Travel Expense',
                fields: JSON.stringify([
                    'name', 'owner', 'user', 'purpose', 'from_date', 'to_date', 'total_amount', 'status'
                ]),
                filters: JSON.stringify(filters),
                order_by: 'from_date desc',
                limit_page_length: '1000'
            }
        }),

    updateTravelStatus: (name: string, status: string) =>
        api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Travel Expense',
                name,
                fieldname: { status }
            }
        }),

    getTravelExpenseAttachments: (parent: string) =>
        api<any[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'File',
                fields: JSON.stringify(['name', 'file_name', 'file_url']),
                filters: JSON.stringify([['attached_to_doctype', '=', 'Intranet Travel Expense'], ['attached_to_name', '=', parent]]),
            }
        }),

    // News
    getAllNews: () =>
        api<any[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet News',
                fields: JSON.stringify(['name', 'title', 'content', 'publish_date', 'author', 'is_published']),
                order_by: 'publish_date desc',
                limit_page_length: '100'
            }
        }),

    createNews: (newsData: any) =>
        api('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet News',
                    ...newsData
                }
            }
        }),

    // Suggestions (Kummerbox)
    getAllSuggestions: () =>
        api<Suggestion[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Suggestion',
                fields: JSON.stringify(['name', 'title', 'description', 'status', 'owner', 'creation']),
                order_by: 'creation desc',
                limit_page_length: '100'
            }
        }),

    updateSuggestion: (name: string, data: Partial<Suggestion>) =>
        api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Suggestion',
                name,
                fieldname: data
            }
        }),

    // Trainings
    getAllTrainings: () =>
        api<Training[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Training',
                fields: JSON.stringify(['name', 'title', 'date', 'instructor', 'description', 'max_participants']),
                order_by: 'date desc',
                limit_page_length: '100'
            }
        }),

    getTrainingParticipants: (trainingId: string) =>
        api<TrainingParticipant[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Training Participant',
                fields: JSON.stringify(['name', 'training', 'user', 'user_full_name']),
                filters: JSON.stringify([['training', '=', trainingId]]),
                limit_page_length: '200'
            }
        }),

    syncTrainings: () =>
        api('heva_intranet.api.sync_trainings', { method: 'POST' }),

    // Role Management
    ensureIntranetAdminRole: async () => {
        try {
            // Check if role exists
            const roles = await api<{ name: string }[]>('frappe.client.get_list', {
                method: 'GET',
                params: {
                    doctype: 'Role',
                    filters: JSON.stringify([['name', '=', 'Intranet Admin']]),
                    limit_page_length: '1'
                }
            });

            if (roles.length === 0) {
                console.log('Role "Intranet Admin" not found, creating it...');
                await api('frappe.client.insert', {
                    method: 'POST',
                    data: {
                        doc: {
                            doctype: 'Role',
                            role_name: 'Intranet Admin',
                            desk_access: 0
                        }
                    }
                });
                console.log('Role "Intranet Admin" created successfully.');
            }
        } catch (error) {
            console.error('Failed to ensure "Intranet Admin" role', error);
        }
    }
};
