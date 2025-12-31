/**
 * Emergency localStorage Cleanup Script
 * 
 * Run this in browser console if you're experiencing authentication issues
 * or need to clear all app data including leaked API keys.
 * 
 * Instructions:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 * 5. Refresh the page
 */

console.log('🧹 Starting Peymen localStorage cleanup...');

// List of all localStorage keys used by the app
const appKeys = [
  'qpay_token',
  'qpay_token_expiry', 
  'qpay_token_scopes',
  'qpay_user_profile',
  'qpay_client_id',
  'qpay_gemini_key',
  'qpay_gemini_key_encrypted',
  'qpay_show_dummy',
  'qpay_guest_mode',
  'qpay_has_seen_onboarding',
  'qpay_install_prompt_dismissed',
  'qpay_sync_interval',
  'qpay_oauth_state',
  'qpay_oauth_nonce'
];

// Clear all app-related localStorage
let clearedCount = 0;
appKeys.forEach(key => {
  if (localStorage.getItem(key) !== null) {
    localStorage.removeItem(key);
    clearedCount++;
    console.log(`✅ Cleared: ${key}`);
  }
});

console.log(`🎉 Cleanup complete! Cleared ${clearedCount} items from localStorage.`);
console.log('📱 Please refresh the page to restart the app with clean state.');

// Optional: Clear all localStorage (use with caution)
function clearAllStorage() {
  const confirm = window.confirm('⚠️ This will clear ALL localStorage data for this domain. Continue?');
  if (confirm) {
    localStorage.clear();
    console.log('🧹 All localStorage cleared. Please refresh the page.');
  }
}

console.log('💡 To clear ALL localStorage (not just app data), run: clearAllStorage()');