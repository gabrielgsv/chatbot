// Telemetry Service - Data Collection Strategy
// Curadoria de dados para análise comportamental e treinamento de IA

export enum EventType {
  TYPING_START = 'typing_start',
  TYPING_END = 'typing_end',
  TYPING_PAUSE = 'typing_pause',
  MESSAGE_EDIT = 'message_edit',
  MESSAGE_CLEAR = 'message_clear',
  SCROLL_VELOCITY = 'scroll_velocity',
  CLICK_HEATMAP = 'click_heatmap',
  TIME_ON_PAGE = 'time_on_page',
  TAB_SWITCH = 'tab_switch',
  DEVICE_INFO = 'device_info',
  CONNECTION_QUALITY = 'connection_quality',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
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

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    this.collectDeviceInfo();
    this.trackTimeOnPage();
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

  // Core: Track event
  track(eventType: EventType, metadata?: object) {
    const event: TelemetryEvent = {
      eventType,
      timestamp: new Date().toISOString(),
      metadata,
      sessionId: this.sessionId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.buffer.push(event);

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  // Strategy: Batching with automatic flush
  private startFlushTimer() {
    if (typeof window === 'undefined') return;
    
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.track(EventType.SESSION_END, { durationMs: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0 });
      this.flushSync();
    });

    // Track tab visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track(EventType.TAB_SWITCH, {
        hidden: document.hidden,
        timeSinceLastVisible: Date.now(),
      });
    });
  }

  private sessionStartTime: number = Date.now();

  private async flush() {
    if (this.buffer.length === 0 || !this.authToken) return;

    const batch: TelemetryBatch = {
      events: [...this.buffer],
    };

    // Clear buffer immediately to avoid duplicates
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

      console.log(`[Telemetry] Sent ${batch.events.length} events`);
    } catch (error) {
      console.error('[Telemetry] Failed to send batch:', error);
      // Retry logic: add events back to buffer for retry
      this.buffer.unshift(...batch.events);
      // Keep only last 100 events to prevent memory issues
      if (this.buffer.length > 100) {
        this.buffer = this.buffer.slice(-100);
      }
    }
  }

  private flushSync() {
    // Synchronous flush for page unload using sendBeacon
    if (this.buffer.length === 0 || !this.authToken) return;

    const batch: TelemetryBatch = {
      events: this.buffer,
    };

    const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
    navigator.sendBeacon?.(`${this.apiUrl}/telemetry/batch`, blob);
  }

  // Data Collection Strategies

  private collectDeviceInfo() {
    if (typeof window === 'undefined') return;

    this.track(EventType.DEVICE_INFO, {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
      connection: (navigator as { connection?: { effectiveType: string; downlink: number } }).connection?.effectiveType,
    });

    this.track(EventType.SESSION_START, {
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
  }

  private trackTimeOnPage() {
    if (typeof window === 'undefined') return;

    let lastActiveTime = Date.now();
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeOnPage = now - this.sessionStartTime;
      
      // Send periodic updates every 30 seconds
      if (timeOnPage % 30000 < 1000) {
        this.track(EventType.TIME_ON_PAGE, {
          totalMs: timeOnPage,
          lastActiveMs: now - lastActiveTime,
        });
      }
    }, 1000);

    // Update last active time on interaction
    ['click', 'scroll', 'keydown', 'mousemove'].forEach(event => {
      window.addEventListener(event, () => {
        lastActiveTime = Date.now();
      }, { passive: true });
    });
  }

  // Chat-specific tracking
  trackTypingStart() {
    this.track(EventType.TYPING_START);
  }

  trackTypingEnd(durationMs: number, characterCount: number) {
    this.track(EventType.TYPING_END, {
      durationMs,
      characterCount,
      wpm: characterCount / 5 / (durationMs / 60000), // Rough WPM estimate
    });
  }

  trackTypingPause(pauseDurationMs: number) {
    this.track(EventType.TYPING_PAUSE, {
      pauseDurationMs,
      threshold: 2000, // Pause > 2 seconds
    });
  }

  trackMessageEdit(originalLength: number, finalLength: number) {
    this.track(EventType.MESSAGE_EDIT, {
      originalLength,
      finalLength,
      editRatio: finalLength / originalLength,
    });
  }

  trackMessageClear(contentLength: number) {
    this.track(EventType.MESSAGE_CLEAR, {
      contentLength,
      timeInvestedMs: null, // Can be calculated from typing_start
    });
  }

  trackMessageSent(content: string, responseTimeMs?: number) {
    this.track(EventType.MESSAGE_SENT, {
      messageLength: content.length,
      wordCount: content.split(/\s+/).length,
      hasQuestionMark: content.includes('?'),
      responseTimeMs,
    });
  }

  trackMessageReceived(content: string, source: 'ai' | 'mock') {
    this.track(EventType.MESSAGE_RECEIVED, {
      messageLength: content.length,
      wordCount: content.split(/\s+/).length,
      source,
    });
  }

  trackScrollVelocity(velocity: number, direction: 'up' | 'down') {
    this.track(EventType.SCROLL_VELOCITY, {
      velocity: Math.round(velocity),
      direction,
      timestamp: Date.now(),
    });
  }

  trackClick(element: string, position: { x: number; y: number }) {
    this.track(EventType.CLICK_HEATMAP, {
      element,
      position,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
  }

  trackConnectionQuality(latencyMs: number) {
    this.track(EventType.CONNECTION_QUALITY, {
      latencyMs,
      timestamp: Date.now(),
    });
  }

  // Manual flush for logout/page navigation
  async forceFlush() {
    this.track(EventType.SESSION_END, {
      durationMs: Date.now() - this.sessionStartTime,
    });
    await this.flush();
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.forceFlush();
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// React hook for typing tracking
export function useTypingTracker() {
  let typingStartTime: number | null = null;
  let lastInputTime: number = Date.now();
  let pauseTimer: NodeJS.Timeout | null = null;

  const handleTypingStart = () => {
    if (!typingStartTime) {
      typingStartTime = Date.now();
      telemetry.trackTypingStart();
    }
    lastInputTime = Date.now();

    // Track pauses
    if (pauseTimer) clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => {
      if (typingStartTime) {
        const pauseDuration = Date.now() - lastInputTime;
        if (pauseDuration > 2000) {
          telemetry.trackTypingPause(pauseDuration);
        }
      }
    }, 2000);
  };

  const handleTypingEnd = (content: string) => {
    if (typingStartTime) {
      const duration = Date.now() - typingStartTime;
      telemetry.trackTypingEnd(duration, content.length);
      typingStartTime = null;
    }
    if (pauseTimer) {
      clearTimeout(pauseTimer);
    }
  };

  return {
    handleTypingStart,
    handleTypingEnd,
  };
}
