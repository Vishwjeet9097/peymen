/**
 * Test Comprehensive Transaction Grouping
 * 
 * This test verifies that all non-UPI, non-credit-card transactions
 * are properly grouped as "Unidentified Payment" with professional terminology.
 */

// Mock transaction data covering various payment methods
const testTransactions = [
  // Credit Cards (should remain separate)
  {
    id: 'card-1',
    source: 'ICICI Bank Credit ****1005',
    type: 'DEBIT',
    amount: 1000,
    expectedGroup: 'Credit Card'
  },
  {
    id: 'card-2', 
    source: 'SBI Credit ****6103',
    type: 'DEBIT',
    amount: 500,
    expectedGroup: 'Credit Card'
  },
  
  // UPI Transactions (should remain as UPI Payment)
  {
    id: 'upi-1',
    source: 'HDFC Bank UPI 3556',
    type: 'DEBIT',
    amount: 200,
    expectedGroup: 'UPI Payment'
  },
  {
    id: 'upi-2',
    source: 'PhonePe UPI',
    type: 'DEBIT', 
    amount: 150,
    expectedGroup: 'UPI Payment'
  },
  
  // These should be grouped into separate professional cards
  {
    id: 'bank-1',
    source: 'Bank NEFT',
    type: 'DEBIT',
    amount: 5000,
    expectedGroup: 'Bank Transfer'
  },
  {
    id: 'bank-2',
    source: 'Bank IMPS',
    type: 'DEBIT',
    amount: 2000,
    expectedGroup: 'Bank Transfer'
  },
  {
    id: 'bank-3',
    source: 'Bank RTGS',
    type: 'DEBIT',
    amount: 10000,
    expectedGroup: 'Bank Transfer'
  },
  {
    id: 'manual-1',
    source: 'Manual Entry',
    type: 'DEBIT',
    amount: 300,
    expectedGroup: 'Manual Entry'
  },
  {
    id: 'manual-2',
    source: 'Manually Added',
    type: 'DEBIT',
    amount: 150,
    expectedGroup: 'Manual Entry'
  },
  
  // These should remain as "Unidentified Payment"
  {
    id: 'cash-1',
    source: 'Cash Payment',
    type: 'DEBIT',
    amount: 100,
    expectedGroup: 'Unidentified Payment'
  },
  {
    id: 'wallet-1',
    source: 'Paytm Wallet',
    type: 'DEBIT',
    amount: 75,
    expectedGroup: 'Unidentified Payment'
  },
  {
    id: 'gmail-1',
    source: 'Gmail Sync',
    type: 'DEBIT',
    amount: 250,
    expectedGroup: 'Unidentified Payment'
  },
  {
    id: 'gmail-2',
    source: 'Gmail Sync • Auto Pay',
    type: 'DEBIT',
    amount: 99,
    expectedGroup: 'Unidentified Payment'
  },
  {
    id: 'other-1',
    source: 'Online Payment',
    type: 'DEBIT',
    amount: 800,
    expectedGroup: 'Unidentified Payment'
  }
];

// Test functions (extracted from Dashboard.tsx logic)
function isUPITransaction(source) {
  const s = source.toLowerCase();
  // More specific UPI detection - must contain "upi" or specific UPI app patterns
  return s.includes('upi') || s.includes('vpa') || 
         s.includes('phonepe upi') || s.includes('googlepay') || s.includes('gpay') || 
         s.includes('paytm upi') || s.includes('bhim') || s.includes('amazonpay upi') ||
         // UPI domain patterns
         /@(ok|axis|icici|paytm|ybl|hdfcbank|sbi|kotak|axl|oksbi|okicici|pz|superyes|okhdfcbank|okhdfc|okaxis|okkotak|okyes|okindusind|okpnb|okbob|okcanara|okfederal|okrbl|okbandhan|okciti|okhsbc|oksc|okdbs)\b/.test(s);
}

function isBankTransfer(source) {
  const s = source.toLowerCase();
  return s.includes('neft') || s.includes('imps') || s.includes('rtgs') || 
         s.includes('bank transfer') || s.includes('wire transfer') ||
         s.includes('bank neft') || s.includes('bank imps') || s.includes('bank rtgs');
}

function isManualEntry(source) {
  const s = source.toLowerCase();
  return s.includes('manual entry') || s.includes('manual') || 
         s.includes('manually added') || s.includes('user entry') ||
         source === 'Manual Entry';
}

function getPrimaryCardNumber(source) {
  const match = source.match(/\*{4}(\d{4})(?!\d)|(\d{4})$/);
  return match ? (match[1] || match[2]) : null;
}

function isUnidentifiedPayment(source) {
  const isUPI = isUPITransaction(source);
  const cardNumber = getPrimaryCardNumber(source);
  const isCard = cardNumber && !isUPI;
  const isBankTx = isBankTransfer(source);
  const isManual = isManualEntry(source);
  
  // If it's not UPI, not a card, not bank transfer, and not manual entry, it's unidentified
  return !isUPI && !isCard && !isBankTx && !isManual;
}

function categorizeTransaction(transaction) {
  const { source } = transaction;
  const isUPI = isUPITransaction(source);
  const cardNumber = getPrimaryCardNumber(source);
  const isCard = cardNumber && !isUPI;
  const isBankTx = isBankTransfer(source);
  const isManual = isManualEntry(source);
  const isUnidentified = isUnidentifiedPayment(source);
  
  if (isUPI) {
    return {
      group: 'UPI Payment',
      cardKey: 'UPI_PAYMENT',
      displayName: 'UPI Payment',
      isCard: false,
      isUPI: true,
      isBankTransfer: false,
      isManualEntry: false,
      isUnidentified: false
    };
  } else if (isCard) {
    return {
      group: 'Credit Card',
      cardKey: cardNumber,
      displayName: `Card ****${cardNumber}`,
      isCard: true,
      isUPI: false,
      isBankTransfer: false,
      isManualEntry: false,
      isUnidentified: false
    };
  } else if (isBankTx) {
    return {
      group: 'Bank Transfer',
      cardKey: 'BANK_TRANSFER',
      displayName: 'Bank Transfer',
      isCard: false,
      isUPI: false,
      isBankTransfer: true,
      isManualEntry: false,
      isUnidentified: false
    };
  } else if (isManual) {
    return {
      group: 'Manual Entry',
      cardKey: 'MANUAL_ENTRY',
      displayName: 'Manual Entry',
      isCard: false,
      isUPI: false,
      isBankTransfer: false,
      isManualEntry: true,
      isUnidentified: false
    };
  } else {
    return {
      group: 'Unidentified Payment',
      cardKey: 'UNIDENTIFIED_PAYMENT',
      displayName: 'Unidentified Payment',
      isCard: false,
      isUPI: false,
      isBankTransfer: false,
      isManualEntry: false,
      isUnidentified: true
    };
  }
}

// Run tests
console.log('🧪 Testing Comprehensive Transaction Grouping...\n');

let passedTests = 0;
let totalTests = testTransactions.length;

testTransactions.forEach((transaction, index) => {
  console.log(`Test ${index + 1}: ${transaction.source}`);
  
  const result = categorizeTransaction(transaction);
  const passed = result.group === transaction.expectedGroup;
  
  console.log(`✅ Source: "${transaction.source}"`);
  console.log(`✅ Expected Group: "${transaction.expectedGroup}"`);
  console.log(`✅ Actual Group: "${result.group}"`);
  console.log(`✅ Card Key: "${result.cardKey}"`);
  console.log(`✅ Display Name: "${result.displayName}"`);
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (passed) passedTests++;
  console.log('---');
});

console.log(`🎉 Test Results: ${passedTests}/${totalTests} tests passed\n`);

// Group summary
console.log('📊 Grouping Summary:');
const groups = {};
testTransactions.forEach(transaction => {
  const result = categorizeTransaction(transaction);
  if (!groups[result.group]) {
    groups[result.group] = {
      count: 0,
      totalAmount: 0,
      transactions: []
    };
  }
  groups[result.group].count++;
  groups[result.group].totalAmount += transaction.amount;
  groups[result.group].transactions.push(transaction.source);
});

Object.entries(groups).forEach(([group, data]) => {
  console.log(`\n${group}:`);
  console.log(`  - Count: ${data.count} transactions`);
  console.log(`  - Total: ₹${data.totalAmount}`);
  console.log(`  - Sources: ${data.transactions.join(', ')}`);
});

console.log('\n📋 Expected Professional 5-Tier Grouping:');
console.log('1. Credit Cards: Individual cards by bank and number');
console.log('2. UPI Payment: All UPI transactions grouped together');
console.log('3. Bank Transfer: NEFT, IMPS, RTGS transactions');
console.log('4. Manual Entry: Manual and user-added transactions');
console.log('5. Unidentified Payment: All other payment methods grouped together');
console.log('   - Cash payments');
console.log('   - Wallet payments (non-UPI)');
console.log('   - Gmail sync transactions');
console.log('   - Online payments');
console.log('   - Any other miscellaneous payments');