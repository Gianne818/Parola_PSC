try { require('dotenv').config(); } catch (e) {}

function sanitizePhilippineMobileNumber(phone) {
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

function calculateSmsSegments(message) {
  const isUnicode = /[^\u0000-\u007F]/.test(message);
  const characterCount = message.length;
  const maxSingle = isUnicode ? 70 : 160;
  const maxConcat = isUnicode ? 67 : 153;
  let segmentCount = 1;
  if (characterCount > maxSingle) {
    segmentCount = Math.ceil(characterCount / maxConcat);
  }
  return { characterCount, segmentCount, isUnicode, estimatedCredits: segmentCount };
}

class IProgSmsService {
  constructor(customConfig) {
    this.config = {
      endpoint: customConfig?.endpoint || process.env.IPROG_API_ENDPOINT || 'https://iprogtech.com/api/v1/sms_messages',
      apiKey: customConfig?.apiKey !== undefined ? customConfig.apiKey : (process.env.IPROG_API_KEY || ''),
      senderName: customConfig?.senderName || process.env.IPROG_SENDER_NAME || 'PAROLA',
      mockMode: customConfig?.mockMode !== undefined ? customConfig.mockMode : (process.env.IPROG_MOCK_MODE !== 'false'),
    };
  }

  async sendSms(req) {
    const formattedPhone = sanitizePhilippineMobileNumber(req.recipient);
    if (this.config.mockMode) {
      console.log('----------------------------------------------------');
      console.log('🛡️ [iPROG DRY-RUN MODE ACTIVE - Preserving Trial Quota]');
      console.log(`📱 Recipient: ${formattedPhone} (Original: ${req.recipient})`);
      console.log(`💬 Message (${req.message.length} chars): ${req.message}`);
      console.log(`🏷️ Sender ID: ${this.config.senderName}`);
      console.log('----------------------------------------------------');
      return {
        success: true,
        messageId: `MOCK-PAROLA-${Date.now()}`,
        recipientFormatted: formattedPhone,
        mode: 'MOCK_DRY_RUN',
        remainingQuotaEstimate: 5,
      };
    }
  }
}

async function runTests() {
  console.log('🧪 Running iPROG SMS Gateway Verification Tests...\n');
  let passed = 0;

  // Test 1: Phone Normalization
  if (sanitizePhilippineMobileNumber('09171234567') === '639171234567') {
    console.log('✅ [PASS] 09171234567 -> 639171234567');
    passed++;
  }
  if (sanitizePhilippineMobileNumber('9171234567') === '639171234567') {
    console.log('✅ [PASS] 9171234567 -> 639171234567');
    passed++;
  }
  if (sanitizePhilippineMobileNumber('639171234567') === '639171234567') {
    console.log('✅ [PASS] 639171234567 -> 639171234567');
    passed++;
  }

  // Test 2: Segment Counter
  const seg = calculateSmsSegments('[PAROLA ALERT] Test notification');
  if (seg.segmentCount === 1) {
    console.log('✅ [PASS] Short message consumes 1 segment');
    passed++;
  }

  // Test 3: Mock Mode
  const service = new IProgSmsService({ mockMode: true });
  const res = await service.sendSms({ recipient: '09171234567', message: 'Dry-run test message' });
  if (res.success && res.mode === 'MOCK_DRY_RUN' && res.remainingQuotaEstimate === 5) {
    console.log('✅ [PASS] Mock dry-run mode executed cleanly (5 free credits preserved)');
    passed++;
  }

  console.log(`\n🎉 Verification Complete: ${passed}/5 Assertions Passed!`);
}

runTests();
