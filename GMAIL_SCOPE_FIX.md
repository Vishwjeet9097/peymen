# Gmail Scope Insufficient Error Fix

## Issue Description
Users were getting a `403 GMAIL_SCOPE_INSUFFICIENT` error when trying to sync emails, even after logging in. This happened because the OAuth token didn't include the required Gmail read-only scope.

## Root Cause
The issue occurred when:
1. User logged in but didn't grant Gmail permissions during OAuth consent
2. Token was valid for profile access but missing `gmail.readonly` scope
3. Gmail API calls failed with 403 Forbidden due to insufficient scopes

## Solution Implemented

### 1. Enhanced OAuth Scope Validation
**File: `services/auth.ts`**
- Added `hasGmailScope()` method to check if token has Gmail permissions
- Enhanced token callback to log and store granted scopes
- Improved login flow to always use `prompt: 'consent'` for complete scope granting

### 2. Proactive Scope Checking
**File: `App.tsx`**
- Added Gmail scope validation before sync attempts
- Automatic logout and re-login when scope is missing
- User-friendly notifications explaining the issue

### 3. Gmail API Scope Validation
**File: `services/gmail.ts`**
- Added `validateGmailScope()` method for early scope detection
- Improved error messages for scope-related issues
- Proactive validation before making Gmail API calls

### 4. Automatic Recovery Flow
When scope issue is detected:
1. Show clear error message to user
2. Automatically logout current session
3. Redirect to login with proper scope request
4. Force consent screen to ensure all permissions are granted

## Technical Changes

### AuthService Enhancements
```typescript
// New method to check Gmail scope
static hasGmailScope(): boolean {
  const scopes = localStorage.getItem('qpay_token_scopes');
  return scopes?.includes('https://www.googleapis.com/auth/gmail.readonly') || false;
}

// Enhanced login with forced consent
static login(clientId: string, callback: (resp: any) => void) {
  this.tokenClient.requestAccessToken({ 
    prompt: 'consent', // Always show permission screen
    hint: 'Please grant Gmail read-only access to sync your transaction emails'
  });
}
```

### Gmail Service Validation
```typescript
// Proactive scope validation
private async validateGmailScope(): Promise<void> {
  const response = await fetch(`${GMAIL_API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${this.accessToken}` }
  });
  
  if (response.status === 403) {
    // Check for scope issues and throw appropriate error
  }
}
```

### App Component Flow
```typescript
// Pre-sync validation
if (!AuthService.hasGmailScope()) {
  // Show notification and auto-recover
  handleLogout();
  setTimeout(() => handleLogin(), 1000);
  return;
}
```

## User Experience Improvements

### Before (❌ Poor UX)
1. User clicks sync
2. Gets cryptic 403 error
3. No clear guidance on how to fix
4. Manual logout/login required

### After (✅ Smooth UX)
1. User clicks sync
2. System detects missing Gmail scope
3. Clear notification: "Gmail Permission Required"
4. Automatic logout and re-login flow
5. Consent screen ensures proper permissions
6. Sync works seamlessly

## Error Messages Enhanced

### Scope Insufficient
- **Before**: "Error: GMAIL_SCOPE_INSUFFICIENT: Please logout and login again"
- **After**: "🔐 Gmail Permission Required: Your login session doesn't have Gmail access. Automatically logging out and redirecting to login..."

### User Notifications
- Warning notification explains the issue clearly
- Automatic recovery reduces user friction
- Debug logs help troubleshoot scope issues

## OAuth Consent Screen Behavior

### Forced Consent (`prompt: 'consent'`)
- Always shows permission screen even for returning users
- Ensures all required scopes are explicitly granted
- Prevents partial permission grants that cause scope issues

### Scope Storage and Validation
- Stores granted scopes in localStorage for validation
- Checks scope before making API calls
- Proactive detection prevents runtime failures

## Testing Scenarios

### ✅ Verified Fixes
1. **New User Login**: Properly grants all scopes including Gmail
2. **Existing User Re-login**: Forces consent screen for complete permissions
3. **Scope Missing**: Automatic detection and recovery flow
4. **Token Expiry**: Proper re-authentication with all scopes
5. **Manual Logout/Login**: Maintains proper scope granting

## Files Modified
- `services/auth.ts`: Enhanced OAuth scope management
- `services/gmail.ts`: Added proactive scope validation
- `App.tsx`: Improved error handling and auto-recovery flow

## Result
The Gmail scope insufficient error is now automatically detected and resolved with a smooth user experience. Users no longer need to manually troubleshoot OAuth permission issues - the system handles scope problems gracefully with clear communication and automatic recovery.