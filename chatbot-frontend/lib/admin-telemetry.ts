import ky from 'ky';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = ky.create({
  credentials: 'include',
});

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
  async getStats(): Promise<TelemetryStats> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/stats`)
      .json<{ statusCode: number; data: TelemetryStats }>();
    return response.data;
  }

  async getTimeline(days = 30): Promise<TimelineData[]> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/timeline?days=${days}`)
      .json<{ statusCode: number; data: TimelineData[] }>();
    return response.data;
  }

  async getTopUsers(limit = 10): Promise<TopUser[]> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/top-users?limit=${limit}`)
      .json<{ statusCode: number; data: TopUser[] }>();
    return response.data;
  }

  async getRecentEvents(limit = 100): Promise<TelemetryEvent[]> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/recent-events?limit=${limit}`)
      .json<{ statusCode: number; data: TelemetryEvent[] }>();
    return response.data;
  }

  async getUserEvents(userId: string): Promise<TelemetryEvent[]> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/user-events/${userId}`)
      .json<{ statusCode: number; data: TelemetryEvent[] }>();
    return response.data;
  }

  async getFrequentQuestions(limit = 10): Promise<FrequentQuestion[]> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/frequent-questions?limit=${limit}`)
      .json<{ statusCode: number; data: FrequentQuestion[] }>();
    return response.data;
  }

  async getLocationStats(): Promise<LocationStats[]> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/locations`)
      .json<{ statusCode: number; data: LocationStats[] }>();
    return response.data;
  }

  async getLanguageStats(): Promise<LanguageStats[]> {
    const response = await api
      .get(`${API_URL}/telemetry/admin/languages`)
      .json<{ statusCode: number; data: LanguageStats[] }>();
    return response.data;
  }
}

export const adminTelemetry = new AdminTelemetryService();
