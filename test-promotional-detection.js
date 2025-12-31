// Test promotional email detection
// Run with: node test-promotional-detection.js

// Simulate the promotional detection logic
function detectPromotionalEmail(snippet, body) {
  const fullText = (snippet + ' ' + body).toLowerCase();
  
  // ENHANCED PROMOTIONAL EMAIL DETECTION
  const strongPromotionalPatterns = [
    // Credit card offers and eligibility
    /credit card.*(?:profile|eligible|eligibility|offer|pre-approved|approved|application)/i,
    /we wanted to share.*update.*credit card/i,
    /you.*(?:eligible|qualify).*credit card/i,
    /credit card.*(?:limit|offer).*(?:up to|upto|₹|rs)/i,
    /based on your profile.*you.*eligible/i,
    /pre-approved.*credit card/i,
    /congratulations.*approved.*credit card/i,
    
    // Loan offers
    /personal loan.*(?:offer|eligible|pre-approved)/i,
    /loan.*(?:up to|upto).*₹.*(?:lakh|crore)/i,
    
    // Investment and insurance offers
    /investment.*opportunity/i,
    /insurance.*policy.*offer/i,
    /mutual fund.*investment/i,
    
    // General promotional content
    /bill payment is due/i,
    /earn.*cashback/i,
    /earn.*back on this payment/i,
    /offer.*discount/i,
    /promotional/i,
    /marketing/i,
    /newsletter/i,
    /unsubscribe/i,
    
    // Bank account opening offers
    /open.*account.*with/i,
    /account opening.*offer/i,
    
    // Generic offers with amounts
    /offer.*(?:up to|upto).*₹.*(?:lakh|crore)/i,
    /get.*(?:up to|upto).*₹.*(?:lakh|crore)/i,
    
    // OTP and verification (backup check)
    /otp|one time password|verification code|verify your/i
  ];
  
  // Check for strong promotional patterns first
  const isStronglyPromotional = strongPromotionalPatterns.some(pattern => fullText.match(pattern));
  
  if (isStronglyPromotional) {
    return true;
  }
  
  // Check for actual transaction indicators (must have these for valid transactions)
  const actualTransactionPatterns = [
    // Actual spending/charging
    /(?:spent|charged|debited).*(?:rs|₹|inr)/i,
    /(?:rs|₹|inr).*(?:spent|charged|debited)/i,
    
    // Actual crediting
    /(?:credited|received|refund).*(?:rs|₹|inr)/i,
    /(?:rs|₹|inr).*(?:credited|received|refunded)/i,
    
    // UPI transactions
    /upi.*(?:transaction|payment|transfer)/i,
    /(?:transaction|payment|transfer).*upi/i,
    
    // Card transactions with merchant
    /(?:card|visa|mastercard).*(?:transaction|payment).*at/i,
    /transaction.*(?:card|visa|mastercard)/i,
    
    // Bank transfers
    /(?:neft|imps|rtgs).*transfer/i,
    /transfer.*(?:neft|imps|rtgs)/i,
    
    // Payment confirmations
    /payment.*(?:successful|confirmed|completed)/i,
    /(?:successful|confirmed|completed).*payment/i,
    
    // Transaction reference numbers
    /transaction.*(?:reference|ref|id).*\d{6,}/i,
    /(?:reference|ref|id).*\d{6,}.*transaction/i
  ];
  
  const hasActualTransactionPattern = actualTransactionPatterns.some(pattern => fullText.match(pattern));
  
  // If no actual transaction patterns found, likely promotional
  if (!hasActualTransactionPattern) {
    return true;
  }
  
  return false;
}

function detectPromotionalAmount(text) {
  const promotionalAmountPatterns = [
    /(?:up to|upto|limit|eligible for|qualify for).*₹.*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i,
    /₹.*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?).*(?:limit|eligible|qualify|offer)/i,
    /credit.*limit.*₹.*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
  ];
  
  return promotionalAmountPatterns.some(pattern => text.match(pattern));
}

// Test cases
const testCases = [
  {
    name: "IDFC Credit Card Offer (Should be IGNORED)",
    snippet: "Hi Sir/Mam, We wanted to share an update regarding your credit card profile with IDFC FIRST Bank. This is simply to keep you informed about cards you may be eligible for. Based on your profile, you",
    body: "Hi Sir/Mam, We wanted to share an update regarding your credit card profile with IDFC FIRST Bank. This is simply to keep you informed about cards you may be eligible for. Based on your profile, you may be eligible for a credit card with limit up to ₹10,00,000.00",
    shouldBeIgnored: true
  },
  {
    name: "Actual SBI Card Transaction (Should be PROCESSED)",
    snippet: "Dear Cardholder, This is to inform you that, Rs.4178.73 spent on your SBI Credit Card ending 6103 at BHARTIAIRTELLTD on 25/12/25. Txn. not done by you? Report at https://sbicard.com/Dispute . If you",
    body: "Dear Cardholder, This is to inform you that, Rs.4178.73 spent on your SBI Credit Card ending 6103 at BHARTIAIRTELLTD on 25/12/25. Txn. not done by you? Report at https://sbicard.com/Dispute . If you",
    shouldBeIgnored: false
  },
  {
    name: "UPI Credit Transaction (Should be PROCESSED)",
    snippet: "Rs. 250.00 is successfully credited to your account **3556 by VPA 8376834779@superyes AMIE HAZARIKA on 29-12-25",
    body: "Rs. 250.00 is successfully credited to your account **3556 by VPA 8376834779@superyes AMIE HAZARIKA on 29-12-25",
    shouldBeIgnored: false
  },
  {
    name: "Personal Loan Offer (Should be IGNORED)",
    snippet: "Get personal loan up to ₹25 lakh at lowest interest rates. Pre-approved offer just for you. Apply now!",
    body: "Get personal loan up to ₹25 lakh at lowest interest rates. Pre-approved offer just for you. Apply now!",
    shouldBeIgnored: true
  },
  {
    name: "OTP Email (Should be IGNORED)",
    snippet: "Your OTP for transaction verification is 123456. Do not share this with anyone.",
    body: "Your OTP for transaction verification is 123456. Do not share this with anyone.",
    shouldBeIgnored: true
  }
];

console.log('🧪 Testing Promotional Email Detection...\n');

let passCount = 0;
testCases.forEach((testCase, index) => {
  const isPromotional = detectPromotionalEmail(testCase.snippet, testCase.body);
  const hasPromotionalAmount = detectPromotionalAmount(testCase.snippet + ' ' + testCase.body);
  const shouldBeIgnored = isPromotional || hasPromotionalAmount;
  const passed = shouldBeIgnored === testCase.shouldBeIgnored;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'} - ${testCase.name}`);
  console.log(`Snippet: ${testCase.snippet.substring(0, 80)}...`);
  console.log(`Expected: ${testCase.shouldBeIgnored ? 'IGNORE' : 'PROCESS'}`);
  console.log(`Got: ${shouldBeIgnored ? 'IGNORE' : 'PROCESS'}`);
  console.log(`Promotional: ${isPromotional}, Promotional Amount: ${hasPromotionalAmount}`);
  console.log('');
  
  if (passed) passCount++;
});

console.log(`\n📊 Results: ${passCount}/${testCases.length} tests passed`);

if (passCount === testCases.length) {
  console.log('🎉 All promotional detection tests passed!');
  console.log('✅ The app will now correctly ignore promotional emails');
  console.log('✅ Credit card offers with amounts like ₹10,00,000 will be filtered out');
  console.log('✅ Only actual transactions will be processed');
} else {
  console.log('⚠️ Some tests failed. Check the patterns.');
}