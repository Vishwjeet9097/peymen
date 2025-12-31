
export class AuthService {
  private static tokenClient: any = null;

  /**
   * Initializes the Google Identity Services token client.
   * This is called when the GIS script is loaded.
   */
  static initTokenClient(clientId: string, callback: (resp: any) => void) {
    if (!clientId || typeof window === 'undefined' || !(window as any).google) return;

    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' '),
      callback: (response: any) => {
        if (response.error !== undefined) {
          console.error("GIS Error:", response);
          return;
        }
        
        // Debug: Log the scopes that were actually granted
        console.log('🔐 OAuth Success - Scopes granted:', response.scope || 'No scope info available');
        
        // Save token with expiry
        const expiresAt = Date.now() + (response.expires_in * 1000);
        localStorage.setItem('qpay_token', response.access_token);
        localStorage.setItem('qpay_token_expiry', expiresAt.toString());
        
        // Also save the granted scopes for debugging
        if (response.scope) {
          localStorage.setItem('qpay_token_scopes', response.scope);
        }
        
        callback(response);
      },
    });
  }

  /**
   * Triggers the Google OAuth popup.
   */
  static login(clientId: string, callback: (resp: any) => void) {
    if (!this.tokenClient) {
      this.initTokenClient(clientId, callback);
    }
    
    if (this.tokenClient) {
      // ALWAYS use prompt: 'consent' to ensure all scopes are granted
      // This forces the permission screen to show even if user previously granted some permissions
      // This is CRITICAL for fixing Gmail scope issues
      console.log('🔐 Requesting OAuth with forced consent to ensure Gmail scope...');
      this.tokenClient.requestAccessToken({ 
        prompt: 'consent',
        // Add hint to ensure Gmail scope is requested
        hint: 'Please grant Gmail read-only access to sync your transaction emails'
      });
    } else {
      console.error("Token client not initialized. Ensure Client ID is set.");
    }
  }

  /**
   * Refresh token silently (if possible)
   */
  static refreshToken(clientId: string, callback: (resp: any) => void) {
    if (!this.tokenClient) {
      this.initTokenClient(clientId, callback);
    }
    
    if (this.tokenClient) {
      // Try to refresh without showing consent screen
      this.tokenClient.requestAccessToken({ prompt: '' });
    } else {
      console.error("Token client not initialized for refresh. Ensure Client ID is set.");
      // Fallback to regular login
      this.login(clientId, callback);
    }
  }

  /**
   * Checks if the current stored token has the required Gmail scope.
   */
  static hasGmailScope(): boolean {
    const scopes = localStorage.getItem('qpay_token_scopes');
    if (!scopes) {
      console.log('⚠️ No scope information available for current token');
      return false; // Assume no Gmail scope if we don't have scope info
    }
    
    const hasGmailScope = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
    console.log('🔍 Gmail scope check:', hasGmailScope ? '✅ Has Gmail scope' : '❌ Missing Gmail scope');
    return hasGmailScope;
  }

  /**
   * Checks if the current stored token is valid.
   */
  static isTokenValid(): boolean {
    const token = localStorage.getItem('qpay_token');
    const expiry = localStorage.getItem('qpay_token_expiry');
    
    // If no token, definitely invalid
    if (!token || token.trim() === '') return false;
    
    // If no expiry info, assume token is valid (legacy tokens)
    if (!expiry || expiry === 'null' || expiry === 'undefined') {
      console.log('⚠️ No expiry info for token, assuming valid (legacy token)');
      return true;
    }
    
    try {
      const expiryTime = parseInt(expiry);
      const currentTime = Date.now();
      
      // Check if token expires in the next 5 minutes (300000ms)
      const isValid = currentTime < (expiryTime - 300000);
      
      if (!isValid) {
        console.log('⏰ Token expired or expires soon, marking as invalid');
      }
      
      return isValid;
    } catch (error) {
      console.warn('⚠️ Could not parse token expiry, assuming token is valid');
      return true; // If we can't parse expiry, assume token is still valid
    }
  }

  /**
   * Revokes the current token.
   */
  static logout(token: string) {
    if (token && (window as any).google) {
      (window as any).google.accounts.oauth2.revoke(token, () => {
        console.log('Token revoked');
      });
    }
    localStorage.removeItem('qpay_token');
    localStorage.removeItem('qpay_token_expiry');
    localStorage.removeItem('qpay_token_scopes');
  }

  /**
   * Legacy method for hash parsing - kept for compatibility if needed.
   */
  static parseTokenFromHash(): string | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    if (token) {
        window.location.hash = ''; // Clear hash
        // Set a default expiry if parsed from hash (1 hour)
        const expiresAt = Date.now() + 3600000;
        localStorage.setItem('qpay_token', token);
        localStorage.setItem('qpay_token_expiry', expiresAt.toString());
    }
    return token;
  }
}
