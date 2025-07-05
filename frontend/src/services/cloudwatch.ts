import { ProcessingResult } from '../types';

interface CloudWatchMetric {
  name: string;
  value: number;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

class CloudWatchService {
  private apiUrl: string;
  private metricsQueue: CloudWatchMetric[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    this.startBatchTimer();
  }

  private startBatchTimer() {
    this.timer = setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  private async flushMetrics() {
    if (this.metricsQueue.length === 0) return;

    const metricsToSend = this.metricsQueue.splice(0, this.batchSize);
    
    try {
      await fetch(`${this.apiUrl}/api/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.formatMetricsForBackend(metricsToSend))
      });
    } catch (error) {
      console.warn('Failed to send metrics to CloudWatch:', error);
      // Re-queue failed metrics (with limit to prevent infinite growth)
      if (this.metricsQueue.length < 100) {
        this.metricsQueue.unshift(...metricsToSend);
      }
    }
  }

  private formatMetricsForBackend(metrics: CloudWatchMetric[]) {
    const formatted: Record<string, any> = {};
    
    metrics.forEach(metric => {
      if (metric.dimensions) {
        formatted[metric.name] = {
          value: metric.value,
          dimensions: metric.dimensions,
          timestamp: metric.timestamp || new Date()
        };
      } else {
        formatted[metric.name] = metric.value;
      }
    });
    
    return formatted;
  }

  // Public methods for tracking different types of events
  trackPageView(page: string) {
    this.addMetric('PageView', 1, { page });
  }

  trackUserInteraction(action: string, component: string) {
    this.addMetric('UserInteraction', 1, { action, component });
  }

  trackConversationStart(personality: string) {
    this.addMetric('ConversationStarted', 1, { personality });
  }

  trackConversationEnd(duration: number, messageCount: number) {
    this.addMetric('ConversationDuration', duration, { unit: 'seconds' });
    this.addMetric('ConversationMessages', messageCount);
  }

  trackEmotionDetected(emotion: string, confidence: number, category: string) {
    this.addMetric('EmotionDetected', 1, { emotion, category });
    this.addMetric('EmotionConfidence', confidence * 100, { emotion });
  }

  trackSentimentAnalysis(sentiment: string, confidence: number) {
    this.addMetric('SentimentAnalyzed', 1, { sentiment });
    this.addMetric('SentimentConfidence', confidence * 100, { sentiment });
  }

  trackAudioRecording(duration: number, fileSize: number) {
    this.addMetric('AudioRecorded', 1);
    this.addMetric('AudioDuration', duration, { unit: 'seconds' });
    this.addMetric('AudioFileSize', fileSize, { unit: 'bytes' });
  }

  trackAPICall(endpoint: string, method: string, duration: number, success: boolean) {
    this.addMetric('APICall', 1, { endpoint, method, success: success.toString() });
    this.addMetric('APIResponseTime', duration, { endpoint, method });
    
    if (!success) {
      this.addMetric('APIError', 1, { endpoint, method });
    }
  }

  trackWellnessActivity(activity: string, duration: number) {
    this.addMetric('WellnessActivity', 1, { activity });
    this.addMetric('WellnessActivityDuration', duration, { activity });
  }

  trackThemeChange(theme: string) {
    this.addMetric('ThemeChanged', 1, { theme });
  }

  trackPersonalityChange(fromPersonality: string, toPersonality: string) {
    this.addMetric('PersonalityChanged', 1, { 
      from: fromPersonality, 
      to: toPersonality 
    });
  }

  trackError(errorType: string, component: string, message?: string) {
    this.addMetric('FrontendError', 1, { 
      errorType, 
      component,
      ...(message && { message: message.substring(0, 100) })
    });
  }

  trackPerformance(metric: string, value: number, component?: string) {
    this.addMetric('Performance', value, { 
      metric,
      ...(component && { component })
    });
  }

  trackProcessingResult(result: ProcessingResult) {
    // Track language detection
    this.addMetric('LanguageDetected', 1, { 
      language: result.language,
      isSouthIndian: result.is_south_indian_language?.toString() || 'false'
    });

    // Track processing times
    this.addMetric('TranscriptionTime', result.processing_time || 0);
    this.addMetric('TranscriptionConfidence', result.transcript_confidence * 100);

    // Track sentiment
    this.trackSentimentAnalysis(result.sentiment, result.sentiment_confidence);

    // Track emotions if available
    if (result.emotions) {
      this.trackEmotionDetected(
        result.emotions.primary_emotion,
        result.emotions.confidence,
        result.emotions.category
      );
    }
  }

  private addMetric(name: string, value: number, dimensions?: Record<string, string>) {
    this.metricsQueue.push({
      name,
      value,
      dimensions,
      timestamp: new Date()
    });

    // Flush immediately if queue is full
    if (this.metricsQueue.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  // Cleanup method
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flushMetrics(); // Send any remaining metrics
  }
}

// Create singleton instance
export const cloudWatchService = new CloudWatchService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cloudWatchService.destroy();
  });
}