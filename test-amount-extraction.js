// Test amount extraction fix
// Run with: node test-amount-extraction.js

function extractAmount(text) {
  // ENHANCED AMOUNT EXTRACTION - Fixed patterns with proper precedence
  const amountPatterns = [
    // Specific transaction patterns - prioritize longer numbers first
    /(?:spent|charged|debited|credited|received|paid|transfer).*(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?)/i,
    /(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?).*(?:spent|charged|debited|credited|received|paid|transfer)/i,
    
    // UPI transaction amounts
    /upi.*(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?)/i,
    /(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?).*upi/i,
    
    // Card transaction amounts
    /card.*(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?)/i,
    /(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?).*card/i,
    
    // Transaction with "at" merchant
    /(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?).*at\s+[A-Z]/i,
    
    // Pattern for "Rs.XXXX.XX" without space - most specific first
    /Rs\.(\d{4,}(?:\.\d{2})?)/i,
    /Rs\.(\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?)/i,
    
    // Generic patterns with longer numbers first
    /(?:Rs\.?|₹|INR)\s*(\d{4,}(?:\.\d{2})?)/i,
    /(?:Rs\.?|₹|INR)\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?)/i,
    /(?:Rs\.?|₹|INR)\s*(\d{1,3}(?:\.\d{2})?)/i,
    
    // Fallback patterns
    /(\d{4,}(?:\.\d{2})?).*(?:Rs\.?|₹|INR)/i,
    /(\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?).*(?:Rs\.?|₹|INR)/i,
    /(\d{1,3}(?:\.\d{2})?).*(?:Rs\.?|₹|INR)/i
  ];

  let amount = 0;
  
  // Check for promotional context first
  const promotionalAmountPatterns = [
    /(?:up to|upto|limit|eligible for|qualify for).*₹.*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?|\d{4,}(?:\.\d{2})?)/i,
    /₹.*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?|\d{4,}(?:\.\d{2})?).*(?:limit|eligible|qualify|offer)/i,
    /credit.*limit.*₹.*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?|\d{4,}(?:\.\d{2})?)/i
  ];
  
  const isPromotionalAmount = promotionalAmountPatterns.some(pattern => text.match(pattern));
  
  if (isPromotionalAmount) {
    return null; // Ignore promotional amounts
  }
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0) break;
    }
  }
  
  return amount > 0 ? amount : null;
}

// Test cases
const testCases = [
  {
    name: "SBI Card Transaction (Original Issue)",
    text: "Dear Cardholder, This is to inform you that, Rs.4178.73 spent on your SBI Credit Card ending 6103 at BHARTIAIRTELLTD on 25/12/25. Trxn. not done by you?",
    expected: 4178.73
  },
  {
    name: "UPI Credit Transaction",
    text: "Rs. 250.00 is successfully credited to your account **3556 by VPA 8376834779@superyes AMIE HAZARIKA on 29-12-25",
    expected: 250.00
  },
  {
    name: "Large Amount with Commas",
    text: "Rs. 1,25,000.50 debited from your account for property payment",
    expected: 125000.50
  },
  {
    name: "Small Amount",
    text: "Rs. 50.00 charged for SMS service",
    expected: 50.00
  },
  {
    name: "Amount without Decimals",
    text: "Rs.1500 spent at Amazon",
    expected: 1500
  },
  {
    name: "Promotional Amount (Should be Ignored)",
    text: "Credit card limit up to ₹10,00,000 available for you",
    expected: null
  },
  {
    name: "Another Promotional (Should be Ignored)",
    text: "You are eligible for ₹5,00,000 personal loan",
    expected: null
  },
  {
    name: "Edge Case - 4 Digit Amount",
    text: "Transaction of Rs.9999.99 completed successfully",
    expected: 9999.99
  },
  {
    name: "6 Digit Amount",
    text: "Rs.123456.78 debited from your SBI account for property purchase",
    expected: 123456.78
  },
  {
    name: "6 Digit Amount without Decimals",
    text: "Transaction of Rs.654321 completed at merchant",
    expected: 654321
  },
  {
    name: "Large 6 Digit UPI",
    text: "Rs. 999999.99 is successfully credited to your account by VPA test@paytm",
    expected: 999999.99
  }
];

console.log('🧪 Testing Amount Extraction Fix...\n');

let passCount = 0;
testCases.forEach((testCase, index) => {
  const result = extractAmount(testCase.text);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'} - ${testCase.name}`);
  console.log(`Text: ${testCase.text.substring(0, 80)}...`);
  console.log(`Expected: ${testCase.expected}`);
  console.log(`Got: ${result}`);
  console.log('');
  
  if (passed) passCount++;
});

console.log(`\n📊 Results: ${passCount}/${testCases.length} tests passed`);

if (passCount === testCases.length) {
  console.log('🎉 All amount extraction tests passed!');
  console.log('✅ Rs.4178.73 will now be correctly extracted as 4178.73');
  console.log('✅ All number formats (with/without commas, decimals) supported');
  console.log('✅ Promotional amounts are still correctly ignored');
} else {
  console.log('⚠️ Some tests failed. Check the patterns.');
}