// Quick test for UPI merchant extraction
// Run with: node test-upi-extraction.js

// Simulate the UPI extraction logic
function cleanUPIMerchant(merchant) {
  // Remove VPA domain suffixes (including new ones like pz, superyes)
  merchant = merchant.replace(/@(axisb|paytm|okaxis|ybl|icici|hdfcbank|sbi|kotak|axis|okhdfcbank|axl|oksbi|okicici|pz|superyes|okhdfcbank|okhdfc|okicici|oksbi|okaxis|okkotak|okyes|okindusind|okpnb|okbob|okcanara|okfederal|okrbl|okbandhan|okciti|okhsbc|oksc|okdbs)\b/gi, '');
  
  // Remove common UPI prefixes/suffixes
  merchant = merchant.replace(/^(VPA|UPI|PA)\s*/i, '');
  merchant = merchant.replace(/\s*(VPA|UPI|PA)$/i, '');
  
  // Remove transaction reference numbers that might be included
  merchant = merchant.replace(/\s+\d{10,}/g, '');
  
  // Clean up extra spaces
  merchant = merchant.replace(/\s+/g, ' ').trim();
  
  return titleCase(merchant);
}

function titleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function extractMerchant(text) {
  // Enhanced UPI Patterns - Priority 1: CREDIT UPI (money received)
  const creditUPIPatterns = [
    // "Rs. 250.00 is successfully credited to your account **3556 by VPA 8376834779@superyes AMIE HAZARIKA"
    /Rs\.?\s*[\d,]+(?:\.\d{2})?\s+is\s+successfully\s+credited.*by\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\.|$)/i,
    
    // "by VPA email@bank Name" pattern (existing)
    /by VPA\s+[A-Za-z0-9\.\-_]+@[A-Za-z]+\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\.|$|Your)/i,
    
    // "Rs.50000.00 credited by VPA john.doe@paytm JOHN DOE on 25-Dec"
    /Rs\.?\s*[\d,]+(?:\.\d{2})?\s+credited\s+by\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\s+dated|\.|$)/i,
    
    // "Rs.50000.00 has been credited to your account by VPA user@bank USER NAME"
    /Rs\.?\s*[\d,]+(?:\.\d{2})?\s+(?:has been\s+)?credited.*by\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\.|$)/i,
  ];

  // Try credit UPI patterns first
  for (const pattern of creditUPIPatterns) {
    const match = text.match(pattern);
    if (match) {
      // For patterns with 3 groups, use the name (group 3)
      if (match[3]) {
        const merchantName = match[3].trim();
        if (merchantName && merchantName.length > 2 && merchantName.length < 50) {
          return cleanUPIMerchant(merchantName);
        }
      }
    }
  }

  // Enhanced UPI Patterns - Priority 2: DEBIT UPI (money sent)
  const debitUPIPatterns = [
    // "Rs.50000.00 has been debited from account 3556 to VPA 9097490427@pz VISHWJEET KUMAR"
    /Rs\.?\s*[\d,]+(?:\.\d{2})?\s+(?:has been\s+)?debited\s+from\s+account\s+\d+\s+to\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\.|$)/i,
  ];

  // Try debit UPI patterns
  for (const pattern of debitUPIPatterns) {
    const match = text.match(pattern);
    if (match) {
      // For patterns with 3 groups, use the name (group 3)
      if (match[3]) {
        const merchantName = match[3].trim();
        if (merchantName && merchantName.length > 2 && merchantName.length < 50) {
          return cleanUPIMerchant(merchantName);
        }
      }
    }
  }

  return 'Unknown Merchant';
}

// Test cases
const testCases = [
  {
    input: "Dear Customer, Rs.50000.00 has been debited from account 3556 to VPA 9097490427@pz VISHWJEET KUMAR on 21-12-25. Your UPI transaction reference number is 735208585888.",
    expected: "Vishwjeet Kumar"
  },
  {
    input: "Rs. 250.00 is successfully credited to your account **3556 by VPA 8376834779@superyes AMIE HAZARIKA on 29-12-25",
    expected: "Amie Hazarika"
  },
  {
    input: "Rs. 700.00 is successfully credited to your account **3556 by VPA prayansharora99-3@okhdfcbank PRAYANSH ARORA on 23-12-25",
    expected: "Prayansh Arora"
  }
];

console.log('🧪 Testing UPI Merchant Extraction...\n');

let passCount = 0;
testCases.forEach((testCase, index) => {
  const result = extractMerchant(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Input: ${testCase.input.substring(0, 80)}...`);
  console.log(`Expected: "${testCase.expected}"`);
  console.log(`Got: "${result}"`);
  console.log('');
  
  if (passed) passCount++;
});

console.log(`\n📊 Results: ${passCount}/${testCases.length} tests passed`);

if (passCount === testCases.length) {
  console.log('🎉 All UPI extraction tests passed!');
} else {
  console.log('⚠️ Some tests failed. Check the patterns.');
}