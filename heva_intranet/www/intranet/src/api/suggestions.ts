import { api } from './client';

export interface Suggestion {
    name: string;
    title: string;
    suggestion_type?: string;
    status: 'Neu' | 'In Prüfung' | 'Akzeptiert' | 'Abgelehnt' | 'Umgesetzt';
    priority?: 'Niedrig' | 'Mittel' | 'Hoch';
    category?: string;
    description?: string;
    submitted_by?: string;
    is_anonymous?: number;
    submitted_at?: string;
    upvotes?: number;
    response?: string;
}

export interface SuggestionCategory {
    name: string;
    responsible_person?: string;
}

export const suggestionsApi = {
    getSuggestions: (status?: string) => {
        const filters: any[] = [];
        if (status) {
            filters.push(['status', '=', status]);
        }

        const params: Record<string, string> = {
            doctype: 'Intranet Suggestion',
            fields: JSON.stringify([
                'name', 'title', 'suggestion_type', 'status', 'priority',
                'category', 'submitted_by', 'is_anonymous', 'submitted_at', 'upvotes'
            ]),
            order_by: 'upvotes desc, creation desc',
            limit_page_length: '50'
        };
        if (filters.length) {
            params.filters = JSON.stringify(filters);
        }

        return api<Suggestion[]>('frappe.client.get_list', {
            method: 'GET',
            params
        });
    },

    getSuggestionDetail: (name: string) =>
        api<Suggestion>('frappe.client.get', {
            method: 'GET',
            params: {
                doctype: 'Intranet Suggestion',
                name
            }
        }),

    createSuggestion: (data: Partial<Suggestion>) =>
        api<Suggestion>('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Suggestion',
                    status: 'Neu',
                    ...data
                }
            }
        }),

    upvote: (suggestionName: string) =>
        api('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Suggestion Vote',
                    suggestion: suggestionName,
                    vote_type: 'Upvote'
                }
            }
        }),

    getCategories: () =>
        api<SuggestionCategory[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Suggestion Category',
                fields: JSON.stringify(['name', 'responsible_person'])
            }
        })
};
