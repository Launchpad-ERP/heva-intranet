import { api } from './client';

export interface NewsCategory {
    name: string;
    color?: string;
    icon?: string;
}

export interface NewsArticle {
    name: string;
    title: string;
    category?: string;
    summary?: string;
    content?: string;
    image?: string;
    author?: string;
    publish_date?: string;
    views?: number;
    is_published?: number;
    is_pinned?: number;
}

export const newsApi = {
    getNewsList: (category?: string) => {
        const filters: any[] = [['is_published', '=', 1]];
        if (category) {
            filters.push(['category', '=', category]);
        }

        return api<NewsArticle[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet News',
                fields: JSON.stringify([
                    'name', 'title', 'category', 'summary', 'image',
                    'author', 'publish_date', 'is_pinned', 'views'
                ]),
                filters: JSON.stringify(filters),
                order_by: 'is_pinned desc, publish_date desc',
                limit_page_length: '50'
            }
        });
    },

    getNewsDetail: (name: string) =>
        api<NewsArticle>('frappe.client.get', {
            method: 'GET',
            params: {
                doctype: 'Intranet News',
                name
            }
        }),

    getCategories: () =>
        api<NewsCategory[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet News Category',
                fields: JSON.stringify(['name', 'color', 'icon'])
            }
        })
};
