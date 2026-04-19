export enum EventType {
  USER_DATA = 'user_data',
  USER_MESSAGE = 'user_message',
  BOT_RESPONSE = 'bot_response',
  USER_LOCATION = 'user_location',
  RETURN_RATE = 'return_rate',
  MESSAGE_INTERVAL = 'message_interval',
  FEEDBACK = 'feedback',
  RESPONSE_TIME = 'response_time',
  LANGUAGE = 'language',
}

export interface TelemetryEvent {
  eventType: EventType;
  timestamp: string;
  metadata?: object;
  sessionId?: string;
  pageUrl?: string;
}

interface TelemetryBatch {
  events: TelemetryEvent[];
}

class TelemetryService {
  private buffer: TelemetryEvent[] = [];
  private readonly maxBatchSize = 50;
  private readonly flushIntervalMs = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private apiUrl: string;
  private authToken: string | null = null;
  private sessionId: string;

  private lastMessageTime: number | null = null;
  private lastVisitTime: number | null = null;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    this.collectUserData();
    this.collectUserLocation();
    this.detectLanguage();
    this.checkReturnRate();
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  track(eventType: EventType, metadata?: object) {
    const event: TelemetryEvent = {
      eventType,
      timestamp: new Date().toISOString(),
      metadata,
      sessionId: this.sessionId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.buffer.push(event);

    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private startFlushTimer() {
    if (typeof window === 'undefined') return;

    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushSync();
    });

    // Track return rate on page load
    window.addEventListener('load', () => {
      this.checkReturnRate();
    });
  }

  private sessionStartTime: number = Date.now();

  private getStoredData() {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('telemetry_user_data');
    return data ? JSON.parse(data) : null;
  }

  private setStoredData(data: object) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('telemetry_user_data', JSON.stringify(data));
  }

  private async flush() {
    if (this.buffer.length === 0 || !this.authToken) return;

    const batch: TelemetryBatch = {
      events: [...this.buffer],
    };

    this.buffer = [];

    try {
      const response = await fetch(`${this.apiUrl}/telemetry/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

    } catch (error) {
      console.error('[Telemetry] Failed to send batch:', error);
      this.buffer.unshift(...batch.events);
      if (this.buffer.length > 100) {
        this.buffer = this.buffer.slice(-100);
      }
    }
  }

  private flushSync() {
    if (this.buffer.length === 0 || !this.authToken) return;

    const batch: TelemetryBatch = {
      events: this.buffer,
    };

    const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
    navigator.sendBeacon?.(`${this.apiUrl}/telemetry/batch`, blob);
  }

  private collectUserData() {
    if (typeof window === 'undefined') return;

    const userData = {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
      referrer: document.referrer,
      sessionStart: new Date().toISOString(),
    };

    this.track(EventType.USER_DATA, userData);
  }

  private collectUserLocation() {
    if (typeof window === 'undefined') return;

    // Try to get location from geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.track(EventType.USER_LOCATION, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          // Fallback to timezone-based location
          this.track(EventType.USER_LOCATION, {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString(),
            error: error.message,
          });
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      this.track(EventType.USER_LOCATION, {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private detectLanguage() {
    if (typeof window === 'undefined') return;

    this.track(EventType.LANGUAGE, {
      browserLanguage: navigator.language,
      languages: navigator.languages,
      timestamp: new Date().toISOString(),
    });
  }

  private checkReturnRate() {
    if (typeof window === 'undefined') return;

    const stored = this.getStoredData();
    const now = Date.now();

    if (stored && stored.lastVisit) {
      const daysSinceLastVisit = (now - stored.lastVisit) / (1000 * 60 * 60 * 24);
      this.track(EventType.RETURN_RATE, {
        daysSinceLastVisit: Math.round(daysSinceLastVisit * 100) / 100,
        isReturningUser: daysSinceLastVisit < 30,
        previousVisits: stored.visitCount || 0,
        timestamp: new Date().toISOString(),
      });

      // Update visit count
      this.setStoredData({
        ...stored,
        lastVisit: now,
        visitCount: (stored.visitCount || 0) + 1,
      });
    } else {
      this.track(EventType.RETURN_RATE, {
        isReturningUser: false,
        previousVisits: 0,
        timestamp: new Date().toISOString(),
      });

      this.setStoredData({
        lastVisit: now,
        visitCount: 1,
      });
    }
  }

  trackUserMessage(content: string) {
    const now = Date.now();
    let timeSinceLastMessage: number | null = null;

    if (this.lastMessageTime) {
      timeSinceLastMessage = now - this.lastMessageTime;
    }
    this.lastMessageTime = now;

    this.track(EventType.USER_MESSAGE, {
      message: content,
      messageLength: content.length,
      wordCount: content.split(/\s+/).length,
      hasQuestionMark: content.includes('?'),
      timestamp: new Date().toISOString(),
    });

    // Also track the interval if we have a previous message
    if (timeSinceLastMessage !== null) {
      this.track(EventType.MESSAGE_INTERVAL, {
        intervalMs: timeSinceLastMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  trackBotResponse(content: string, source: 'ai' | 'mock', responseTimeMs?: number) {
    this.track(EventType.BOT_RESPONSE, {
      messageLength: content.length,
      wordCount: content.split(/\s+/).length,
      source,
      timestamp: new Date().toISOString(),
    });

    // Track response time separately if provided
    if (responseTimeMs !== undefined) {
      this.track(EventType.RESPONSE_TIME, {
        responseTimeMs,
        timestamp: new Date().toISOString(),
      });
    }
  }

  trackFeedback(messageId: string, isApproved: boolean, comment?: string) {
    this.track(EventType.FEEDBACK, {
      messageId,
      isApproved,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  trackResponseTime(responseTimeMs: number) {
    this.track(EventType.RESPONSE_TIME, {
      responseTimeMs,
      timestamp: new Date().toISOString(),
    });
  }

  async forceFlush() {
    await this.flush();
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.forceFlush();
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// Hook simplificado - agora apenas retorna funções dummy
// A telemetria foi simplificada para focar em eventos de mensagem
export function useTypingTracker() {
  return {
    handleTypingStart: () => {},
    handleTypingEnd: (_content: string) => {},
  };
}
