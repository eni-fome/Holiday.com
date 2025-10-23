import { useAuthStore } from '../store/auth.store';
import { fetchCsrfToken, getCsrfToken } from '../utils/csrf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://holiday-com-backend.onrender.com';

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshQueue: Array<() => void> = [];
  private readonly allowedHosts = ['holiday-com-backend.onrender.com', 'localhost'];

  constructor(baseUrl: string) {
    this.validateBaseUrl(baseUrl);
    this.baseUrl = baseUrl;
  }

  private validateBaseUrl(url: string): void {
    try {
      const parsed = new URL(url);
      const isAllowed = this.allowedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
      if (!isAllowed) {
        throw new Error('Invalid API base URL');
      }
    } catch {
      throw new Error('Invalid API base URL');
    }
  }

  private validateEndpoint(endpoint: string): void {
    if (!endpoint.startsWith('/')) {
      throw new Error('Invalid endpoint');
    }
  }

  private async getHeaders(includeContentType = true): Promise<HeadersInit> {
    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    return headers;
  }

  private async refreshAccessToken(): Promise<boolean> {
    const { refreshToken, clearAuth, updateAccessToken } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const data = await response.json();
      updateAccessToken(data.accessToken);
      return true;
    } catch (error) {
      clearAuth();
      return false;
    }
  }

  private async handleUnauthorized(): Promise<boolean> {
    if (this.isRefreshing) {
      // Wait for the ongoing refresh
      return new Promise((resolve) => {
        this.refreshQueue.push(() => resolve(true));
      });
    }

    this.isRefreshing = true;
    const success = await this.refreshAccessToken();
    this.isRefreshing = false;

    // Process queued requests
    this.refreshQueue.forEach((callback) => callback());
    this.refreshQueue = [];

    return success;
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    this.validateEndpoint(endpoint);
    const { requiresAuth = false, ...fetchOptions } = options;

    const makeRequest = async (): Promise<Response> => {
      const headers = new Headers(await this.getHeaders(options.body instanceof FormData ? false : true));

      // Merge custom headers
      if (fetchOptions.headers) {
        Object.entries(fetchOptions.headers).forEach(([key, value]) => {
          headers.set(key, value);
        });
      }

      return fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    };

    let response = await makeRequest();

    // Handle 401 Unauthorized
    if (response.status === 401 && requiresAuth) {
      const refreshSuccess = await this.handleUnauthorized();
      if (refreshSuccess) {
        // Retry the original request with new token
        response = await makeRequest();
      } else {
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Convenience methods
  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(endpoint: string, data: any, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      requiresAuth,
    });
  }

  async put<T>(endpoint: string, data: any, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
