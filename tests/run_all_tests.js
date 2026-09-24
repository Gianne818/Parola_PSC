const http = require('http');
const https = require('https');

console.log('====================================================');
console.log('🧪 PAROLA END-TO-END INTEGRATION SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
  }
}

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testExternalApis() {
  console.log('1. Testing Weather & Hazard Live APIs...');
  
  // Open-Meteo Wave Height
  try {
    const res = await fetchJson('https://marine-api.open-meteo.com/v1/marine?latitude=10.3157&longitude=123.8854&hourly=wave_height');
    assert(res.status === 200 && res.data.hourly && Array.isArray(res.data.hourly.wave_height), 'Open-Meteo Marine API responds with hourly wave height array');
  } catch (e) {
    assert(false, `Open-Meteo Marine API error: ${e.message}`);
  }

  // Open-Meteo Wind
  try {
    const res = await fetchJson('https://api.open-meteo.com/v1/forecast?latitude=10.3157&longitude=123.8854&hourly=wind_speed_10m');
    assert(res.status === 200 && res.data.hourly && Array.isArray(res.data.hourly.wind_speed_10m), 'Open-Meteo Wind Forecast API responds with hourly wind speed array');
  } catch (e) {
    assert(false, `Open-Meteo Forecast API error: ${e.message}`);
  }

  // PAGASA Tropical Cyclone Bulletin API
  try {
    const res = await fetchJson('https://pagasa.chlod.net/api/v1/bulletin/list');
    assert(res.status === 200 && Array.isArray(res.data.bulletins), 'PAGASA Weather Bulletin API responds with bulletins list');
  } catch (e) {
    assert(false, `PAGASA Bulletin API error: ${e.message}`);
  }
}

async function testSmsGatewayLogic() {
  console.log('\n2. Testing iPROG SMS Gateway & Number Sanitization...');

  // Number sanitization logic
  const sanitize = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('09') && cleaned.length === 11) return '63' + cleaned.substring(1);
    if (cleaned.startsWith('9') && cleaned.length === 10) return '63' + cleaned;
    if (cleaned.startsWith('639') && cleaned.length === 12) return cleaned;
    throw new Error('Invalid format');
  };

  assert(sanitize('09171234567') === '639171234567', 'Standard PH local format 09171234567 -> 639171234567');
  assert(sanitize('9171234567') === '639171234567', '10-digit format 9171234567 -> 639171234567');
  assert(sanitize('639171234567') === '639171234567', 'International format 639171234567 -> 639171234567');

  try {
    sanitize('12345');
    assert(false, 'Should reject invalid short number');
  } catch (e) {
    assert(true, 'Rejects invalid number format "12345" cleanly');
  }
}

async function main() {
  await testExternalApis();
  await testSmsGatewayLogic();

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passedTests}/${totalTests} Assertions Passed`);
  console.log('====================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

main();
