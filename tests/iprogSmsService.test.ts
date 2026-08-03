import {
  sanitizePhilippineMobileNumber,
  calculateSmsSegments,
  IProgSmsService,
} from '../services/iprogSmsService';

async function runTests() {
  console.log('🧪 Starting iPROG SMS Service Automated Unit Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // Test 1: Phone Normalization
  console.log('1. Testing Philippine Mobile Number Normalization...');
  try {
    assert(sanitizePhilippineMobileNumber('09171234567') === '639171234567', '09171234567 -> 639171234567');
    assert(sanitizePhilippineMobileNumber('9171234567') === '639171234567', '9171234567 -> 639171234567');
    assert(sanitizePhilippineMobileNumber('639171234567') === '639171234567', '639171234567 -> 639171234567');
    assert(sanitizePhilippineMobileNumber('+63 917-123-4567') === '639171234567', 'Formatted "+63 917-123-4567" -> 639171234567');
  } catch (err: any) {
    assert(false, `Phone normalization threw unexpected error: ${err.message}`);
  }

  // Test 2: Phone Rejection
  console.log('\n2. Testing Invalid Mobile Number Rejection...');
  try {
    sanitizePhilippineMobileNumber('12345');
    assert(false, 'Should have thrown error for 12345');
  } catch {
    assert(true, 'Correctly rejected invalid number 12345');
  }

  // Test 3: Segment Counter
  console.log('\n3. Testing SMS Segment & Character Counter...');
  const shortMsg = '[PAROLA ALERT] Babala: Malalaking alon sa daungan.';
  const segShort = calculateSmsSegments(shortMsg);
  assert(segShort.segmentCount === 1, `Short message (${shortMsg.length} chars) consumes 1 segment`);

  const longMsg = 'A'.repeat(200);
  const segLong = calculateSmsSegments(longMsg);
  assert(segLong.segmentCount === 2, `Long message (200 chars) consumes 2 segments`);

  // Test 4: Mock Mode Execution
  console.log('\n4. Testing Mock Mode Execution (5 Free Credits Protection)...');
  const smsService = new IProgSmsService({ mockMode: true });
  const mockRes = await smsService.sendSms({
    recipient: '09171234567',
    message: '[PAROLA ALERT] Test Dry Run',
    category: 'weather',
  });

  assert(mockRes.success === true, 'Mock send returns success=true');
  assert(mockRes.mode === 'MOCK_DRY_RUN', 'Mock mode is MOCK_DRY_RUN');
  assert(mockRes.recipientFormatted === '639171234567', 'Recipient formatted correctly in mock response');
  assert(mockRes.remainingQuotaEstimate === 5, 'Remaining quota estimate preserved at 5 credits');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
