const BASE_URL = '';

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}

// Get CSRF token from cookie or global window object
function getCsrfToken(): string | null {
    if ((window as any).csrf_token && (window as any).csrf_token !== '{{ csrf_token }}') {
        // console.log('Using window.csrf_token:', (window as any).csrf_token);
        return (window as any).csrf_token;
    }
    const cookieMatch = document.cookie.match(/csrf_token=([^;]+)/);
    if (cookieMatch) {
        // console.log('Using cookie csrf_token');
        return decodeURIComponent(cookieMatch[1]);
    }
    console.warn('No CSRF token found in window or cookie');
    return null;
}

// Cache for CSRF token (set during login)
let csrfTokenCache: string | null = null;

// Export functions for auth module to set/clear token
export function setCsrfToken(token: string): void {
    csrfTokenCache = token;
}

export function clearCsrfToken(): void {
    csrfTokenCache = null;
}

function getValidCsrfToken(): string | null {
    if (csrfTokenCache) {
        return csrfTokenCache;
    }
    const token = getCsrfToken();
    if (token) {
        csrfTokenCache = token;
        return token;
    }
    return null;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', data, params, headers = {} } = options;

    const url = new URL(`${BASE_URL}/api/method/${endpoint}`, window.location.origin);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
    }

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
    };

    if (method !== 'GET') {
        const csrfToken = getValidCsrfToken();
        if (csrfToken) {
            requestHeaders['X-Frappe-CSRF-Token'] = csrfToken;
        }
    }

    try {
        const response = await fetch(url.toString(), {
            method,
            headers: requestHeaders,
            body: data ? JSON.stringify(data) : undefined,
            credentials: 'include',
        });

        if (!response.ok) {
            let errorMessage = 'An unexpected error occurred';

            try {
                const errorData = await response.json();
                if (errorData._server_messages) {
                    try {
                        const messages = JSON.parse(errorData._server_messages);
                        errorMessage = messages.map((m: any) => JSON.parse(m).message).join(', ');
                    } catch {
                        // fallback
                    }
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.exception) {
                    errorMessage = errorData.exception;
                }
            } catch {
                errorMessage = response.statusText;
            }

            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        return responseData?.message ?? responseData;

    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}
