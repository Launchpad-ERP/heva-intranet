import { api } from './client';

export interface TravelExpense {
    name: string;
    trip_description: string;
    status: 'Entwurf' | 'Eingereicht' | 'Genehmigt' | 'Abgelehnt' | 'Erstattet';
    destination: string;
    purpose: 'Kundenbesuch' | 'Schulung' | 'Messe' | 'Sonstiges';
    customer?: string;
    project?: string;
    from_date: string;
    to_date: string;
    departure_time?: string; // HH:mm:ss
    return_time?: string; // HH:mm:ss
    total_amount?: number;
    meals_provided?: TravelMeal[];
    expense_items?: ExpenseItem[];
}

export interface TravelMeal {
    name?: string;
    date: string;
    breakfast_provided: 0 | 1;
    lunch_provided: 0 | 1;
    dinner_provided: 0 | 1;
}

export interface ExpenseItem {
    name?: string;
    expense_type: 'Fahrtkosten' | 'Hotel' | 'Verpflegung' | 'Taxi' | 'Parkgebühren' | 'Sonstiges';
    description?: string;
    date: string;
    amount: number;
    receipt?: string; // URL
}

export const travelExpensesApi = {
    getList: (userEmail: string) => {
        return api<TravelExpense[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Travel Expense',
                fields: JSON.stringify([
                    'name', 'trip_description', 'status', 'from_date', 'to_date',
                    'destination', 'total_amount'
                ]),
                filters: JSON.stringify([
                    ['user', '=', userEmail] // Using 'user' field as per refactoring
                ]),
                order_by: 'from_date desc',
                limit_page_length: '50'
            }
        });
    },

    getDetail: (name: string) => {
        return api<TravelExpense>('frappe.client.get', {
            method: 'GET',
            params: {
                doctype: 'Intranet Travel Expense',
                name: name
            }
        });
    },

    create: (data: Partial<TravelExpense> & { user: string }) => {
        return api<TravelExpense>('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Travel Expense',
                    ...data,
                    meals_provided: data.meals_provided || [],
                    expense_items: data.expense_items || []
                }
            }
        });
    },

    update: (name: string, data: Partial<TravelExpense>) => {
        return api<TravelExpense>('frappe.client.save', { // 'save' handles child tables better than set_value
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Travel Expense',
                    name: name,
                    ...data
                }
            }
        });
    },

    submit: (name: string) => {
        return api('frappe.client.submit', {
            method: 'POST',
            data: {
                doctype: 'Intranet Travel Expense',
                name: name
            }
        });
    },

    delete: (name: string) => {
        return api('frappe.client.delete', {
            method: 'POST',
            data: {
                doctype: 'Intranet Travel Expense',
                name: name
            }
        });
    },

    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('is_private', '1');

        return fetch('/api/method/upload_file', {
            method: 'POST',
            headers: {
                'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
            },
            body: formData
        }).then(res => res.json());
    },

    getProjects: () =>
        api<{ name: string, project_name: string }[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Project',
                fields: JSON.stringify(['name', 'project_name']),
                limit_page_length: '100'
            }
        }),

    getCustomers: () =>
        api<{ name: string, customer_name: string }[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Customer',
                fields: JSON.stringify(['name', 'customer_name']),
                limit_page_length: '100'
            }
        })
};
