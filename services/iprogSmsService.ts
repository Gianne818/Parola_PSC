export interface IProgSmsConfig {
  endpoint: string;
  apiKey: string;
  senderName: string;
  mockMode: boolean;
}

export interface SmsSendRequest {
  recipient: string; // Accepts "09XXXXXXXXX", "9XXXXXXXXX", or "639XXXXXXXXX"
  message: string;
  category?: 'weather' | 'emergency' | 'catch_log' | 'port_alert' | 'custom';
}

export interface SmsSendResponse {
  success: boolean;
  messageId?: string;
  recipientFormatted: string;
  mode: 'MOCK_DRY_RUN' | 'LIVE_DISPATCH';
  remainingQuotaEstimate?: number;
  error?: string;
}

export interface SmsSegmentDetail {
  characterCount: number;
  segmentCount: number;
  isUnicode: boolean;
  estimatedCredits: number;
  maxSingleSegmentLength: number;
  maxConcatSegmentLength: number;
}

/**
 * Sanitizes and formats Philippine mobile numbers to standard international format (639XXXXXXXXX).
 * Rejects invalid formats that do not match 11 digits starting with 09, 10 digits starting with 9, or 12 digits starting with 639.
 */
export function sanitizePhilippineMobileNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return '63' + cleaned.substring(1);
  }
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '63' + cleaned;
  }
  if (cleaned.startsWith('639') && cleaned.length === 12) {
    return cleaned;
  }
  throw new Error(`Invalid Philippines mobile number format: ${phone}. Expected 09XXXXXXXXX or 639XXXXXXXXX.`);
}

/**
 * Calculates SMS character length, unicode detection, SMS segment count, and estimated credits.
 */
export function calculateSmsSegments(message: string): SmsSegmentDetail {
  const isUnicode = /[^\u0000-\u007F]/.test(message);
  const characterCount = message.length;

  const maxSingle = isUnicode ? 70 : 160;
  const maxConcat = isUnicode ? 67 : 153;

  let segmentCount = 1;
  if (characterCount > maxSingle) {
    segmentCount = Math.ceil(characterCount / maxConcat);
  }

  return {
    characterCount,
    segmentCount,
    isUnicode,
    estimatedCredits: segmentCount,
    maxSingleSegmentLength: maxSingle,
    maxConcatSegmentLength: maxConcat,
  };
}

export class IProgSmsService {
  private config: IProgSmsConfig;

  constructor(customConfig?: Partial<IProgSmsConfig>) {
    this.config = {
      endpoint: customConfig?.endpoint || process.env.IPROG_API_ENDPOINT || 'https://sms.iprogtech.com/api/v1/sms_messages',
      apiKey: customConfig?.apiKey !== undefined ? customConfig.apiKey : (process.env.IPROG_API_KEY || ''),
      senderName: customConfig?.senderName || process.env.IPROG_SENDER_NAME || 'PAROLA',
      mockMode: customConfig?.mockMode !== undefined ? customConfig.mockMode : (process.env.IPROG_MOCK_MODE !== 'false'), // Default to true for safety
    };
  }

  public getConfig(): IProgSmsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<IProgSmsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async sendSms(req: SmsSendRequest): Promise<SmsSendResponse> {
    const formattedPhone = sanitizePhilippineMobileNumber(req.recipient);

    // MOCK DRY-RUN GUARD (Preserves 5 free credits)
    if (this.config.mockMode) {


      return {
        success: true,
        messageId: `MOCK-PAROLA-${Date.now()}`,
        recipientFormatted: formattedPhone,
        mode: 'MOCK_DRY_RUN',
        remainingQuotaEstimate: 5,
      };
    }

    // LIVE iPROG DISPATCH (For Hackathon Demo Day)
    if (!this.config.apiKey || this.config.apiKey === 'IPROG_PENDING_HACKATHON_KEY') {
      throw new Error('IPROG_API_KEY environment variable is missing or unconfigured for live dispatch.');
    }

    const payload: Record<string, any> = {
      api_token: this.config.apiKey,
      phone_number: formattedPhone,
      message: req.message,
    };

    if (this.config.senderName) {
      payload.sender_name = this.config.senderName;
    }

    try {
      let response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let errText = '';
      let resData: any = {};

      if (!response.ok) {
        errText = await response.text();
        try { resData = JSON.parse(errText); } catch {}
      } else {
        resData = await response.json();
      }

      const rawErrorMessage = resData.message || errText || '';

      // AUTOMATIC RETRY FOR SMART/TNT NETWORKS:
      // Smart & TNT do not accept shared/unregistered sender names.
      // If iPROG returns this error and sender_name was sent, retry without sender_name parameter.
      if (
        (rawErrorMessage.includes('Smart/TNT networks do not accept shared sender names') ||
         rawErrorMessage.includes('sender name') ||
         (resData.status && resData.status !== 200 && String(resData.message).includes('sender name'))) &&
        payload.sender_name
      ) {
        console.warn('Smart/TNT sender name restriction encountered. Retrying iPROG dispatch without sender_name parameter...');
        delete payload.sender_name;

        response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          errText = await response.text();
          try { resData = JSON.parse(errText); } catch {}
        } else {
          resData = await response.json();
        }
      }

      if (!response.ok) {
        return {
          success: false,
          recipientFormatted: formattedPhone,
          mode: 'LIVE_DISPATCH',
          error: `iPROG API Error (HTTP ${response.status}): ${resData.message || errText}`,
        };
      }

      if (resData.status && resData.status !== 200) {
        return {
          success: false,
          recipientFormatted: formattedPhone,
          mode: 'LIVE_DISPATCH',
          error: `iPROG API Error: ${resData.message || 'Dispatch failed'}`,
        };
      }

      return {
        success: true,
        messageId: resData.message_id || resData.id || `LIVE-${Date.now()}`,
        recipientFormatted: formattedPhone,
        mode: 'LIVE_DISPATCH',
      };
    } catch (err: any) {
      return {
        success: false,
        recipientFormatted: formattedPhone,
        mode: 'LIVE_DISPATCH',
        error: `Network Error connecting to iPROG: ${err.message}`,
      };
    }
  }
}
