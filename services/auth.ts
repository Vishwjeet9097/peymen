
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
        // Save token with expiry
        const expiresAt = Date.now() + (response.expires_in * 1000);
        localStorage.setItem('qpay_token', response.access_token);
        localStorage.setItem('qpay_token_expiry', expiresAt.toString());
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
      // Use prompt: 'consent' to always show permission screen
      // This ensures users grant all required scopes including Gmail
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      console.error("Token client not initialized. Ensure Client ID is set.");
    }
  }

  /**
   * Checks if the current stored token is valid.
   */
  static isTokenValid(): boolean {
    const token = localStorage.getItem('qpay_token');
    const expiry = localStorage.getItem('qpay_token_expiry');
    if (!token || !expiry) return false;
    
    // Check if token expires in the next 5 minutes
    return Date.now() < (parseInt(expiry) - 300000);
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
