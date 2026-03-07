import { api } from './client';

export interface EventAttendee {
    user: string;
    status?: 'Zugesagt' | 'Abgesagt' | 'Vielleicht';
}

export interface IntranetEvent {
    name: string;
    title: string;
    event_type?: string;
    organizer?: string;
    customer?: string;
    start_datetime: string;
    end_datetime?: string;
    is_all_day?: number;
    location?: string;
    description?: string;
    attendees?: EventAttendee[];
}

export const eventsApi = {
    getUpcomingEvents: () => {
        const today = new Date().toISOString().split('T')[0];

        return api<IntranetEvent[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Event',
                fields: JSON.stringify([
                    'name', 'title', 'event_type', 'organizer',
                    'start_datetime', 'end_datetime', 'is_all_day', 'location'
                ]),
                filters: JSON.stringify([['start_datetime', '>=', today]]),
                order_by: 'start_datetime asc',
                limit_page_length: '50'
            }
        });
    },

    getPastEvents: () => {
        const today = new Date().toISOString().split('T')[0];

        return api<IntranetEvent[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Event',
                fields: JSON.stringify([
                    'name', 'title', 'event_type',
                    'start_datetime', 'end_datetime', 'location'
                ]),
                filters: JSON.stringify([['start_datetime', '<', today]]),
                order_by: 'start_datetime desc',
                limit_page_length: '20'
            }
        });
    },

    getEventDetail: (name: string) =>
        api<IntranetEvent>('frappe.client.get', {
            method: 'GET',
            params: {
                doctype: 'Intranet Event',
                name
            }
        }),

    registerForEvent: (eventName: string, userEmail: string, status: string = 'Zugesagt') =>
        api('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Event Attendee',
                    parent: eventName,
                    parenttype: 'Intranet Event',
                    parentfield: 'attendees',
                    user: userEmail,
                    status
                }
            }
        })
};
