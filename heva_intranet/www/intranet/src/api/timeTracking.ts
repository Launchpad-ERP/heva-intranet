import { api } from './client';

export interface TimeEntry {
    name: string;
    employee?: string;
    date: string;
    status: 'Aktiv' | 'Abgeschlossen' | 'Korrigiert';
    project?: string;
    clock_in?: string;
    clock_out?: string;
    break_start?: string;
    break_end?: string;
    break_duration?: number;
    is_onsite?: number;
    clock_in_lat?: number;
    clock_in_long?: number;
    clock_out_lat?: number;
    clock_out_long?: number;
    working_hours?: number;
    overtime_hours?: number;
    notes?: string;
    approved?: number;
}

export interface Project {
    name: string;
    project_name?: string;
    customer?: string;
}

export interface Employee {
    name: string;
    user: string;
    email?: string;
}

export const timeTrackingApi = {

    getTodayEntry: (userEmail?: string) => {
        const today = new Date().toISOString().split('T')[0];
        const filters: any[] = [['date', '=', today]];
        if (userEmail) {
            filters.push(['owner', '=', userEmail]);
        }

        return api<TimeEntry[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Time Entry',
                fields: JSON.stringify([
                    'name', 'owner', 'date', 'status', 'project',
                    'clock_in', 'clock_out', 'break_start', 'break_end',
                    'break_duration', 'is_onsite',
                    'clock_in_lat', 'clock_in_long', 'clock_out_lat', 'clock_out_long',
                    'working_hours', 'overtime_hours', 'notes'
                ]),
                filters: JSON.stringify(filters),
                order_by: 'clock_in desc',
                limit_page_length: '1'
            }
        });
    },

    getRecentEntries: (days: number = 7) => {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        return api<TimeEntry[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Time Entry',
                fields: JSON.stringify([
                    'name', 'date', 'status', 'project',
                    'clock_in', 'clock_out', 'break_duration', 'is_onsite', 'notes',
                    'working_hours', 'overtime_hours'
                ]),
                filters: JSON.stringify([
                    ['date', '>=', fromDate.toISOString().split('T')[0]]
                ]),
                order_by: 'date desc',
                limit_page_length: '30'
            }
        });
    },

    clockIn: (data: {
        user: string;
        project?: string;
        notes?: string;
        is_onsite?: number;
        lat?: number;
        long?: number;
    }) => {
        const now = new Date();
        const time = now.toTimeString().split(' ')[0];
        const date = now.toISOString().split('T')[0];

        return api<TimeEntry>('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Time Entry',
                    user: data.user,
                    date,
                    clock_in: time,
                    status: 'Aktiv',
                    is_onsite: data.is_onsite || 0,
                    clock_in_lat: data.lat,
                    clock_in_long: data.long,
                    project: data.project,
                    notes: data.notes
                }
            }
        });
    },

    clockOut: (entryName: string, lat?: number, long?: number) => {
        const now = new Date();
        const time = now.toTimeString().split(' ')[0];

        return api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Time Entry',
                name: entryName,
                fieldname: {
                    clock_out: time,
                    clock_out_lat: lat,
                    clock_out_long: long,
                    status: 'Abgeschlossen'
                }
            }
        });
    },

    startBreak: (entryName: string) => {
        const now = new Date();
        const time = now.toTimeString().split(' ')[0];

        return api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Time Entry',
                name: entryName,
                fieldname: { break_start: time }
            }
        });
    },

    endBreak: async (entryName: string, breakStart: string, currentBreakDuration: number = 0) => {
        const now = new Date();
        const endTime = now.toTimeString().split(' ')[0];

        const [startH, startM, startS] = breakStart.split(':').map(Number);
        const [endH, endM, endS] = endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM + startS / 60;
        const endMinutes = endH * 60 + endM + endS / 60;
        const thisBreakHours = (endMinutes - startMinutes) / 60;

        const totalBreakDuration = currentBreakDuration + thisBreakHours;

        return api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Time Entry',
                name: entryName,
                fieldname: {
                    break_end: endTime,
                    break_duration: totalBreakDuration
                }
            }
        });
    },

    resetBreakFields: (entryName: string) => {
        return api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Time Entry',
                name: entryName,
                fieldname: {
                    break_start: null,
                    break_end: null
                }
            }
        });
    },

    updateEntry: (entryName: string, data: {
        clock_in?: string;
        clock_out?: string;
        break_duration?: number;
        project?: string;
        notes?: string;
    }) => {
        return api('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Time Entry',
                name: entryName,
                fieldname: data
            }
        });
    },

    getProjects: () =>
        api<Project[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Project',
                fields: JSON.stringify(['name', 'project_name', 'customer']),
                limit_page_length: '100'
            }
        }),

    deleteEntry: (entryName: string) => {
        return api('frappe.client.delete', {
            method: 'POST',
            data: {
                doctype: 'Intranet Time Entry',
                name: entryName
            }
        });
    }
};
