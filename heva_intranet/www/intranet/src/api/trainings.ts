import { api } from './client';

export interface Training {
    name: string;
    subject: string;
    provider: string;
    url: string;
    date_text: string;
    location: string;
    price: string;
    description: string;
}

export const trainingsApi = {
    getAll: () => {
        return api<Training[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet External Training',
                fields: JSON.stringify(['name', 'subject', 'provider', 'url', 'date_text', 'location', 'price', 'description']),
                order_by: 'creation desc',
                limit_page_length: '100'
            }
        });
    },

    requestQuote: (data: { training: string; user: string; notes?: string }) => {
        return api('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Training Request',
                    user: data.user,
                    training: data.training,
                    status: 'Requested',
                    notes: data.notes || ''
                }
            }
        });
    }
};
