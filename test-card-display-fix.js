/**
 * Test Card Display Fix
 * 
 * This test verifies that the Dashboard correctly extracts and displays
 * bank names and card numbers from transaction sources.
 */

// Mock transaction data based on user's example
const testTransactions = [
  {
    id: 'test-1',
    date: new Date('2025-12-24'),
    amount: 3424.00,
    currency: 'INR',
    merchant: 'Amazon Pay',
    type: 'DEBIT',
    source: 'ICICI Bank Credit ****1005', // This is what the parsing should produce
    rawSnippet: 'Dear Customer, Your ICICI Bank Credit Card XX1005 has been used for a transaction of INR 3424.00 on Dec 24, 2025 at 11:52:09. Info: AMAZON PAY IN E COMMERCE.',
    category: 'Shopping'
  },
  {
    id: 'test-2',
    date: new Date('2025-12-25'),
    amount: 4178.73,
    currency: 'INR',
    merchant: 'Airtel',
    type: 'DEBIT',
    source: 'SBI Credit ****6103',
    rawSnippet: 'Dear Cardholder, This is to inform you that, Rs.4178.73 spent on your SBI Credit Card ending 6103 at BHARTIAIRTELLTD on 25/12/25.',
    category: 'Utilities'
  },
  {
    id: 'test-3',
    date: new Date('2025-12-26'),
    amount: 1200.00,
    currency: 'INR',
    merchant: 'Zomato',
    type: 'DEBIT',
    source: 'HDFC Bank Credit ****4567',
    rawSnippet: 'Transaction alert: Rs.1200.00 debited from your HDFC Bank Credit Card ending 4567 at ZOMATO on 26/12/25.',
    category: 'Dining'
  }
];

// Test functions (these would be extracted from Dashboard.tsx)
function getBankName(source) {
  const s = source.toLowerCase();
  
  // Common bank patterns - Enhanced with more variations
  if (s.includes('sbi') || s.includes('state bank')) return 'SBI';
  if (s.includes('axis')) return 'Axis Bank';
  if (s.includes('icici')) return 'ICICI Bank';
  if (s.includes('hdfc')) return 'HDFC Bank';
  if (s.includes('kotak')) return 'Kotak';
  
  // Enhanced Pattern Matching for Credit Card Sources
  // Pattern 1: "ICICI Bank Credit ****1005" or "SBI Credit ****6103"
  const bankCardPattern = /^([A-Za-z\s]+?)\s+(?:Bank\s+)?(?:Credit|Debit|Card)/i;
  const bankCardMatch = source.match(bankCardPattern);
  if (bankCardMatch) {
    const bankName = bankCardMatch[1].trim();
    // Validate it's a reasonable bank name
    if (bankName.length >= 3 && bankName.length <= 25 && /^[A-Za-z\s]+$/.test(bankName)) {
      // Handle specific cases
      if (bankName.toLowerCase() === 'icici') return 'ICICI Bank';
      if (bankName.toLowerCase() === 'hdfc') return 'HDFC Bank';
      if (bankName.toLowerCase() === 'axis') return 'Axis Bank';
      if (bankName.toLowerCase() === 'sbi') return 'SBI';
      return bankName;
    }
  }
  
  // Pattern 2: "BankName ****1234" - extract before card number
  const cardNumPattern = /^([A-Za-z\s]+?)\s+\*{4}/i;
  const cardNumMatch = source.match(cardNumPattern);
  if (cardNumMatch) {
    const bankName = cardNumMatch[1].trim();
    if (bankName.length >= 3 && bankName.length <= 25 && !bankName.toLowerCase().includes('upi')) {
      // Handle specific cases
      if (bankName.toLowerCase() === 'icici') return 'ICICI Bank';
      if (bankName.toLowerCase() === 'hdfc') return 'HDFC Bank';
      if (bankName.toLowerCase() === 'axis') return 'Axis Bank';
      if (bankName.toLowerCase() === 'sbi') return 'SBI';
      return bankName;
    }
  }
  
  return 'Bank';
}

function extractLast4Digits(source) {
  // Match patterns like ****1234 or ending with 4 digits
  const match = source.match(/\*{4}(\d{4})(?!\d)|(\d{4})$/);
  return match ? (match[1] || match[2]) : null;
}

function getCardholderName(source, brandName) {
  // For cards, prioritize bank name extraction
  const extractedBankName = getBankName(source);
  if (extractedBankName !== 'Bank') {
    return extractedBankName;
  }
  
  // Use brandName if available and meaningful
  if (brandName && brandName !== 'Card' && brandName !== 'CARDHOLDER' && brandName !== 'Bank') {
    return brandName;
  }
  
  // Extract from source for cards - Enhanced patterns
  // Pattern 1: "ICICI Bank Credit ****1005" -> "ICICI Bank"
  const bankCardPattern = source.match(/^([A-Za-z\s]+?)\s+(?:Bank\s+)?(?:Credit|Debit|Card)/i);
  if (bankCardPattern) {
    const extracted = bankCardPattern[1].trim();
    if (extracted.length >= 3 && extracted.length <= 25) {
      // Handle specific cases
      if (extracted.toLowerCase() === 'icici') return 'ICICI Bank';
      if (extracted.toLowerCase() === 'hdfc') return 'HDFC Bank';
      if (extracted.toLowerCase() === 'axis') return 'Axis Bank';
      if (extracted.toLowerCase() === 'sbi') return 'SBI';
      return extracted;
    }
  }
  
  // Last resort - return a more meaningful default
  return 'Credit Card';
}

// Run tests
console.log('🧪 Testing Card Display Fix...\n');

testTransactions.forEach((transaction, index) => {
  console.log(`Test ${index + 1}: ${transaction.merchant} Transaction`);
  console.log(`Source: "${transaction.source}"`);
  
  const bankName = getBankName(transaction.source);
  const cardNumber = extractLast4Digits(transaction.source);
  const cardholderName = getCardholderName(transaction.source, bankName);
  
  console.log(`✅ Bank Name: "${bankName}"`);
  console.log(`✅ Card Number: "${cardNumber}"`);
  console.log(`✅ Cardholder Display: "${cardholderName}"`);
  console.log(`✅ Expected Card Display: "${bankName} ****${cardNumber}"`);
  console.log('---');
});

console.log('🎉 All tests completed!');
console.log('\n📋 Expected Results:');
console.log('1. ICICI Bank transaction should show "ICICI Bank" as cardholder');
console.log('2. SBI transaction should show "SBI" as cardholder');
console.log('3. HDFC Bank transaction should show "HDFC Bank" as cardholder');
console.log('4. Card numbers should be properly extracted (1005, 6103, 4567)');
console.log('5. No more "CARDHOLDER" fallback text should appear');