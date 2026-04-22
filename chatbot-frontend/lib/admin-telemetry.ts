import ky from 'ky';
import { getTokenFromSW } from '@/app/auth/lib/serviceWorker';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface TelemetryStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  totalUsers: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
}

export interface LocationStats {
  timezone: string;
  count: number;
}

export interface LanguageStats {
  language: string;
  count: number;
}

export interface TimelineData {
  date: string;
  count: number;
}

export interface TopUser {
  userId: string;
  email: string;
  name: string;
  eventCount: number;
  lastActivity: string;
}

export interface TelemetryEvent {
  id: string;
  userId: string;
  eventType: string;
  timestamp: string;
  metadata: object | null;
  sessionId?: string;
  pageUrl?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface FrequentQuestion {
  question: string;
  count: number;
}

class AdminTelemetryService {
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const { token } = await getTokenFromSW();
    return token;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getStats(): Promise<TelemetryStats> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/stats`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: TelemetryStats }>();
    return response.data;
  }

  async getTimeline(days = 30): Promise<TimelineData[]> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/timeline?days=${days}`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: TimelineData[] }>();
    return response.data;
  }

  async getTopUsers(limit = 10): Promise<TopUser[]> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/top-users?limit=${limit}`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: TopUser[] }>();
    return response.data;
  }

  async getRecentEvents(limit = 100): Promise<TelemetryEvent[]> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/recent-events?limit=${limit}`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: TelemetryEvent[] }>();
    return response.data;
  }

  async getUserEvents(userId: string): Promise<TelemetryEvent[]> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/user-events/${userId}`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: TelemetryEvent[] }>();
    return response.data;
  }

  async getFrequentQuestions(limit = 10): Promise<FrequentQuestion[]> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/frequent-questions?limit=${limit}`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: FrequentQuestion[] }>();
    return response.data;
  }

  async getLocationStats(): Promise<LocationStats[]> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/locations`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: LocationStats[] }>();
    return response.data;
  }

  async getLanguageStats(): Promise<LanguageStats[]> {
    const response = await ky
      .get(`${API_URL}/telemetry/admin/languages`, {
        headers: await this.getHeaders(),
      })
      .json<{ statusCode: number; data: LanguageStats[] }>();
    return response.data;
  }
}

export const adminTelemetry = new AdminTelemetryService();
