import { api } from './client';

export interface AbsenceType {
    name: string;
    color: string;
    max_days_per_year?: number;
    requires_approval: number;
}

export interface AbsenceRequest {
    name: string;
    employee?: string;
    user?: string;
    absence_type: string;
    from_date: string;
    to_date: string;
    half_day: number;
    half_day_date?: string;
    reason?: string;
    status: 'Entwurf' | 'Eingereicht' | 'Genehmigt' | 'Abgelehnt' | 'Open' | 'Approved' | 'Rejected';
    medical_certificate?: string;
    workflow_state?: string;
}

export const absenceApi = {
    getAbsenceTypes: () =>
        api<AbsenceType[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Absence Type',
                fields: JSON.stringify(['name', 'color', 'max_days_per_year', 'requires_approval'])
            }
        }),

    getMyRequests: (userName?: string) => {
        const filters = userName ? [['user', '=', userName]] : [['owner', '=', 'current']];
        return api<AbsenceRequest[]>('frappe.client.get_list', {
            method: 'GET',
            params: {
                doctype: 'Intranet Absence Request',
                fields: JSON.stringify(['name', 'absence_type', 'from_date', 'to_date', 'status', 'half_day', 'reason', 'user']),
                filters: JSON.stringify(filters),
                order_by: 'from_date desc'
            }
        });
    },

    createAbsenceType: (data: Partial<AbsenceType>) =>
        api<AbsenceType>('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Absence Type',
                    ...data
                }
            }
        }),

    createRequest: (data: Partial<AbsenceRequest>) =>
        api<AbsenceRequest>('frappe.client.insert', {
            method: 'POST',
            data: {
                doc: {
                    doctype: 'Intranet Absence Request',
                    ...data
                }
            }
        }),

    updateRequest: (name: string, data: Partial<AbsenceRequest>) =>
        api<AbsenceRequest>('frappe.client.set_value', {
            method: 'POST',
            data: {
                doctype: 'Intranet Absence Request',
                name,
                fieldname: data
            }
        }),

    deleteRequest: (name: string) =>
        api<void>('frappe.client.delete', {
            method: 'POST',
            data: {
                doctype: 'Intranet Absence Request',
                name
            }
        })
};
