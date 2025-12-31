
import { Transaction, TransactionType } from '../types';
import { Type } from "@google/genai";

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

export class GmailService {
  private accessToken: string;
  private appApiKey: string | null = null;

  constructor(accessToken: string, appApiKey?: string) {
    this.accessToken = accessToken;
    this.appApiKey = appApiKey || null;
  }

  /**
   * Validates if the current token has Gmail scope by making a test API call
   */
  private async validateGmailScope(): Promise<void> {
    try {
      // Make a minimal API call to check if Gmail scope is available
      const response = await fetch(`${GMAIL_API_BASE}/profile`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData?.error?.message?.includes('insufficient authentication scopes') || 
            errorData?.error?.details?.[0]?.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT') {
          throw new Error('GMAIL_SCOPE_INSUFFICIENT: Your login session doesn\'t have Gmail read permissions. Please logout and login again to grant Gmail access.');
        }
      }
      
      if (!response.ok) {
        throw new Error(`Gmail scope validation failed: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('GMAIL_SCOPE_INSUFFICIENT')) {
        throw error;
      }
      // If it's a network error or other issue, don't block the operation
      console.warn('Gmail scope validation failed, proceeding anyway:', error);
    }
  }

  /**
   * Gets the API key with priority: .env.local > App Settings
   * @returns API key string or null
   */
  private getApiKey(): string | null {
    // Priority 1: Environment variable (.env.local) - safely access for Vite/TS
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? (process as any).env?.API_KEY : null);
    if (envKey && envKey !== 'your_new_gemini_api_key_here' && envKey !== 'your_gemini_api_key_here') {
      // Check if it's a known leaked key
      if (this.isLeakedApiKey(envKey)) {
        console.error('🚨 SECURITY ALERT: Environment API key is on the leaked keys blacklist!');
        return null;
      }
      return envKey;
    }

    // Priority 2: App settings (localStorage)
    if (this.appApiKey) {
      // Check if it's a known leaked key
      if (this.isLeakedApiKey(this.appApiKey)) {
        console.error('🚨 SECURITY ALERT: App API key is on the leaked keys blacklist!');
        // Auto-cleanup leaked key from localStorage
        this.cleanupLeakedApiKey();
        return null;
      }
      return this.appApiKey;
    }

    return null;
  }

  /**
   * Checks if an API key is on the known leaked keys blacklist
   */
  private isLeakedApiKey(apiKey: string): boolean {
    const leakedKeys = [
      'AIzaSyAN1gbmoj37LUE0Wcrw3Km4c4MZuSrDaxs', // Reported as leaked in console logs
      'AIzaSyDCNNhW1--jdGKdAUpK_6BBkADIjs_jtPo'  // Previous leaked key from .env
    ];
    
    return leakedKeys.includes(apiKey);
  }

  /**
   * Cleans up leaked API keys from localStorage
   */
  private cleanupLeakedApiKey(): void {
    console.log('🧹 Cleaning up leaked API key from storage...');
    localStorage.removeItem('qpay_gemini_key');
    localStorage.removeItem('qpay_gemini_key_encrypted');
    this.appApiKey = null;
    
    // Show user notification about the cleanup
    if (typeof window !== 'undefined' && (window as any).showLeakedKeyNotification) {
      (window as any).showLeakedKeyNotification();
    }
  }

  private async fetchGmail(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        // Check if it's a scope issue
        if (errorData?.error?.message?.includes('insufficient authentication scopes') || 
            errorData?.error?.details?.[0]?.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT') {
          throw new Error('GMAIL_SCOPE_INSUFFICIENT: Your login session doesn\'t have Gmail read permissions. Please logout and login again to grant Gmail access.');
        }
        throw new Error('GMAIL_PERMISSION_DENIED: Gmail access is restricted. Please ensure you have added your email to Test Users in Google Cloud Console.');
      }
      if (response.status === 401) {
        throw new Error('GMAIL_AUTH_EXPIRED: Your session has expired. Please login again.');
      }
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listMessages(maxResults = 50, q = 'subject:(transaction OR debit OR credit OR payment OR confirmed OR receipt OR "spent on" OR "charged" OR "UPI txn" OR "done a UPI" OR debited OR credited) OR from:(alerts@hdfcbank.net OR alerts@sbi.co.in OR alerts@icicibank.com OR alerts@axisbank.com OR credit_cards@icicibank.com OR onlinesbicard@sbicard.com OR alerts@axis.bank.in OR nps-communications@mailer.proteantech.in)') {
    // Validate Gmail scope before making API calls
    await this.validateGmailScope();
    
    const data = await this.fetchGmail(`/messages?maxResults=${maxResults}&q=${encodeURIComponent(q)}`);
    return data.messages || [];
  }

  async getMessage(id: string) {
    return this.fetchGmail(`/messages/${id}`);
  }

  async getAttachment(messageId: string, attachmentId: string) {
    return this.fetchGmail(`/messages/${messageId}/attachments/${attachmentId}`);
  }

  /**
   * Parses multiple Gmail messages in a single API call (bulk processing)
   * More efficient for free tier with RPM limits
   */
  async parseTransactionsBulk(messages: any[]): Promise<(Transaction | null)[]> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.warn('Gemini API key not found. Falling back to basic parsing.');
      return Promise.all(messages.map(msg => {
        const snippet = msg.snippet || '';
        const body = this.extractEmailBody(msg);
        const isUPI = /upi|vpa|@ok|@axis|@icici|@paytm|@ybl|phonepe|googlepay|paytm/i.test(snippet + body);
        const isCard = /card|visa|mastercard|amex|rupay|debit|credit/i.test(snippet + body);
        const isBankTransfer = /neft|imps|rtgs|bank transfer/i.test(snippet + body);
        return this.parseTransactionBasic(msg, { isUPI, isCard, isBankTransfer });
      }));
    }

    try {
      // Prepare bulk email data
      const emailsData = messages.map((msg, idx) => {
        const snippet = msg.snippet || '';
        const body = this.extractEmailBody(msg);
        return `
EMAIL #${idx + 1}:
ID: ${msg.id}
Snippet: "${snippet}"
Body: "${body}"
---`;
      }).join('\n');

      const promptText = `You are a financial data extraction expert. Analyze these ${messages.length} transaction emails and extract information for each.

**CRITICAL INSTRUCTIONS:**
- Return ONLY a valid JSON array, no other text
- Array should have exactly ${messages.length} objects, one for each email in order
- **STRICTLY IGNORE promotional/marketing emails** including:
  * Credit card offers, eligibility notifications, pre-approved offers
  * Loan offers and investment opportunities  
  * "We wanted to share an update regarding your credit card profile"
  * "Based on your profile, you may be eligible for"
  * Any email about credit limits, loan amounts, or offers with "up to ₹X"
  * Insurance, mutual fund, or account opening offers
  * Newsletters, marketing content, or unsubscribe emails
- **ONLY EXTRACT actual financial transactions** with these indicators:
  * Money actually spent: "Rs.X spent on", "Rs.X charged", "Rs.X debited"
  * Money actually received: "Rs.X credited", "Rs.X received", "Rs.X refunded"
  * UPI transactions: "UPI transaction", "VPA transfer", "UPI payment"
  * Card transactions: "Card transaction at [merchant]", "Payment successful"
  * Bank transfers: "NEFT/IMPS/RTGS transfer", "Transfer completed"
- If email is promotional/marketing (even if it contains words like "credit", "debit"), use: {"isTransaction": false, "emailIndex": N}
- **EXTRACT scheduled auto-payments**: "Auto-payment of ₹X is scheduled on [date]" → Extract with type: "SCHEDULED"
- **EXTRACT failed auto-payments**: "Auto-payment of ₹X failed" → Extract with type: "FAILED"
- For valid transactions, extract these fields:

**Required Fields per Transaction:**
1. emailIndex (number): The email number (1 to ${messages.length})
2. amount (number): Clean numeric value (e.g., "Rs. 1,222.35" → 1222.35, "Rs.415.06" → 415.06)
3. currency (string): 3-letter ISO code (INR, USD, EUR, GBP)
4. date (string): Transaction date in DD-MM-YY format from email (e.g., "28-12-25" → "2025-12-28")
5. merchant (string): **CRITICAL - Professional Merchant Extraction**
   **Priority Order (use first available):**
   
   **For CREDIT transactions (money received):**
   a) **Sender Name from VPA** (highest priority): 
      - "by VPA 8341870089@axl Chenram Krishna Reddy" → "Chenram Krishna Reddy"
      - "by VPA prayansharora99-3@okhdfcbank PRAYANSH ARORA" → "PRAYANSH ARORA"
      - Extract the NAME that appears AFTER the VPA address
   b) **Sender Name from notes**: "by VPA [email] Name" → "Name"
   c) **From account holder**: "from account holder John Doe" → "John Doe"
   
   **For DEBIT transactions (money sent):**
   a) **Auto-Payment Service** (highest priority for scheduled/failed auto-payments): 
      - "Auto-payment of ₹X for your Subscribe & Save orders" → "Subscribe & Save" or "Amazon Subscribe & Save"
      - "Auto-payment of ₹X for Netflix subscription" → "Netflix"
      - Extract the service/subscription name mentioned in the email
   b) **Recipient Account** (for account transfers): "debited from account 3556 to account ***9592" → "Account ***9592"
   c) **Recipient Name from VPA**: "to VPA merchant@bank MerchantName" → "MerchantName"
   d) **Recipient Name from notes**: "to account ***9592" → "Account ***9592" (use account number as merchant)
   e) **Business Name**: "at Starbucks Coffee" → "Starbucks"
   f) **Service Provider**: "Netflix subscription" → "Netflix"
   
   **For all transactions:**
   f) **Business Name**: "at Starbucks Coffee" → "Starbucks"
   g) **Recipient/Sender Name**: "to John Doe" or "from John Doe" → "John Doe"
   h) **Fallback**: If none found, use "Unknown Merchant"
   
   **Cleaning Rules:**
   - Remove: "@axisb", "@paytm", "@okaxis", "@ybl", "@okhdfcbank", "@axl", "PA", "LTD", "E COMMERCE", "VPA", account numbers (except when used as merchant name like "Account ***9592")
   - Keep: Actual business/person names (preserve proper names like "Chenram Krishna Reddy", "PRAYANSH ARORA")
   - For VPA patterns: Extract the name AFTER the VPA address, not the VPA username itself
   - **Merchant Name Cleaning Examples:**
     * "ZEPTOMARKETPLACEPRIV" → "ZEPTO" (match known merchant)
     * "BHARTIAIRTELLTD" → "BHARTI AIRTEL LTD" or "Airtel" (split words properly)
     * "AMAZON PAY IN E COMMERCE" → "Amazon Pay" (clean and simplify)
     * "debited from account 3556 to account ***9592" → "Account ***9592" (use recipient account)
   - Examples:
     * "by VPA 8341870089@axl Chenram Krishna Reddy" → "Chenram Krishna Reddy"
     * "by VPA prayansharora99-3@okhdfcbank PRAYANSH ARORA" → "PRAYANSH ARORA"
     * "to VPA cred.club@axisb CRED Club" → "CRED"
     * "to VPA appleservices.bdsi@hdfcbank Apple Services" → "Apple Services"
     * "paid to Uber India" → "Uber"
     * "transaction at Zomato" → "Zomato"
     * "at ZEPTOMARKETPLACEPRIV" → "Zepto"
     * "at BHARTIAIRTELLTD" → "Airtel"
     * "at AMAZON PAY IN E COMMERCE" → "Amazon Pay"

6. type (string): DEBIT (debited/spent), CREDIT (credited/received), TRANSFER, SCHEDULED (scheduled auto-payment), or FAILED (failed auto-payment)
7. category (string): Transport, Subscription, Dining, Shopping, Health, Utilities, Travel, Income, Education, Entertainment, Groceries, or General
8. paymentMethod (string): Bank/Card/UPI with account details
   **Format:** "HDFC Bank UPI 3556" for UPI, "HDFC Bank 3556" for others
   **Extract account number from:** "from account 3556" → "3556"

**Emails to Process:**
${emailsData}

**Examples:**

**Example 1 - CREDIT (money received):**
Input: "Rs. 120.00 is successfully credited to your account **3556 by VPA 8341870089@axl Chenram Krishna Reddy on 29-12-25"
Output: {"emailIndex": 1, "amount": 120.00, "currency": "INR", "date": "2025-12-29", "merchant": "Chenram Krishna Reddy", "type": "CREDIT", "category": "Income", "paymentMethod": "HDFC Bank UPI 3556"}

**Example 2 - CREDIT (money received):**
Input: "Rs. 700.00 is successfully credited to your account **3556 by VPA prayansharora99-3@okhdfcbank PRAYANSH ARORA on 23-12-25"
Output: {"emailIndex": 2, "amount": 700.00, "currency": "INR", "date": "2025-12-23", "merchant": "PRAYANSH ARORA", "type": "CREDIT", "category": "Income", "paymentMethod": "HDFC Bank UPI 3556"}

**Example 3 - DEBIT (money sent):**
Input: "Rs.1.00 has been debited from account 3556 to account ***9592 on 30-12-25"
Output: {"emailIndex": 3, "amount": 1.00, "currency": "INR", "date": "2025-12-30", "merchant": "Account ***9592", "type": "DEBIT", "category": "General", "paymentMethod": "HDFC Bank UPI 3556"}

**Example 4 - DEBIT (money sent to VPA):**
Input: "Rs.415.06 has been debited from account 3556 to VPA cred.club@axisb CRED Club on 28-12-25"
Output: {"emailIndex": 4, "amount": 415.06, "currency": "INR", "date": "2025-12-28", "merchant": "CRED", "type": "DEBIT", "category": "General", "paymentMethod": "HDFC Bank UPI 3556"}

Return JSON array only (e.g., [{"emailIndex": 1, "amount": 100, ...}, {"emailIndex": 2, "isTransaction": false}, ...]):`;

      const contents = [
        {
          role: "user",
          parts: [{ text: promptText }]
        }
      ];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192 // Increased for bulk processing
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        console.warn('Empty response from Gemini AI, falling back to individual parsing');
        return Promise.all(messages.map(msg => this.parseTransaction(msg)));
      }

      // Extract JSON array from response
      let jsonText = responseText.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```(?:json)?/g, '').trim();
      }

      const parsedArray = JSON.parse(jsonText);

      if (!Array.isArray(parsedArray)) {
        console.warn('Expected array response, falling back to individual parsing');
        return Promise.all(messages.map(msg => this.parseTransaction(msg)));
      }

      // Map parsed results back to transactions
      return messages.map((msg, idx) => {
        try {
          const parsed = parsedArray.find(p => p.emailIndex === idx + 1) || parsedArray[idx];
          
          if (!parsed || parsed.isTransaction === false) {
            console.log(`Email #${idx + 1} is not a transaction, skipping`);
            return null;
          }

          const snippet = msg.snippet || '';
          const date = new Date(parseInt(msg.internalDate));
          const cleanMerchant = this.cleanMerchantName(parsed.merchant);

          // Use AI extracted date if valid
          let finalDate = date;
          if (parsed.date) {
            const extractedDate = new Date(parsed.date);
            if (!isNaN(extractedDate.getTime())) {
              finalDate = extractedDate;
            }
          }

          // Handle SCHEDULED and FAILED types - convert to DEBIT for now
          let transactionType: TransactionType = (parsed.type as TransactionType) || 'DEBIT';
          let source = parsed.paymentMethod || 'Gmail Sync';
          let merchant = cleanMerchant;
          
          if (parsed.type === 'SCHEDULED') {
            // Mark as Auto Pay - professional approach
            transactionType = 'DEBIT';
            // Add "Auto Pay" to source field
            if (!source.toLowerCase().includes('auto pay') && !source.toLowerCase().includes('autopay')) {
              source = `${source} • Auto Pay`;
            }
            // Add "Auto Pay" to merchant if not already present
            if (!merchant.toLowerCase().includes('auto pay') && !merchant.toLowerCase().includes('autopay')) {
              merchant = `${merchant} (Auto Pay)`;
            }
          } else if (parsed.type === 'FAILED') {
            transactionType = 'DEBIT';
            // Mark as Failed Auto Pay
            if (!source.toLowerCase().includes('failed')) {
              source = `${source} • Failed`;
            }
            if (!merchant.toLowerCase().includes('failed')) {
              merchant = `${merchant} (Failed)`;
            }
          }

          return {
            id: msg.id,
            date: finalDate,
            amount: Math.abs(parsed.amount || 0),
            currency: parsed.currency || this.detectCurrency(snippet),
            merchant: merchant,
            type: transactionType,
            source: source,
            rawSnippet: parsed.type === 'SCHEDULED' || parsed.type === 'FAILED' 
              ? `[${parsed.type}] ${snippet}` 
              : snippet,
            category: parsed.category || this.categorize(cleanMerchant)
          };
        } catch (err) {
          console.error(`Failed to parse email #${idx + 1}:`, err);
          return null;
        }
      });

    } catch (error) {
      console.error("Gemini Bulk Parsing failed", error);
      // Fallback to individual parsing
      return Promise.all(messages.map(msg => this.parseTransaction(msg)));
    }
  }

  /**
   * Parses a Gmail message into a Transaction using Gemini AI REST API
   * Bypasses @google/genai SDK due to camelCase mapping bugs with stable v1 endpoints
   */
  async parseTransaction(message: any): Promise<Transaction | null> {
    const snippet = message.snippet || '';
    const body = this.extractEmailBody(message);
    const date = new Date(parseInt(message.internalDate));

    // Detect transaction type hints
    const isUPI = /upi|vpa|@ok|@axis|@icici|@paytm|@ybl|phonepe|googlepay|paytm/i.test(snippet + body);
    const isCard = /card|visa|mastercard|amex|rupay|debit|credit/i.test(snippet + body);
    const isBankTransfer = /neft|imps|rtgs|bank transfer/i.test(snippet + body);

    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.warn('Gemini API key not found. Falling back to basic parsing.');
      return this.parseTransactionBasic(message, { isUPI, isCard, isBankTransfer });
    }

    try {
      const imageParts: any[] = [];
      if (message.payload?.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType?.startsWith('image/') && part.body?.attachmentId) {
            try {
              const attachment = await this.getAttachment(message.id, part.body.attachmentId);
              if (attachment.data) {
                // Gmail API returns Base64URL, Gemini needs standard Base64
                const normalizedData = attachment.data.replace(/-/g, '+').replace(/_/g, '/');
                imageParts.push({
                  inline_data: {
                    mime_type: part.mimeType,
                    data: normalizedData
                  }
                });
                console.log(`Added image attachment (${part.mimeType}) to Gemini prompt`);
              }
            } catch (err) {
              console.warn('Failed to fetch image attachment', err);
            }
          }
        }
      }

      const promptText = `You are a financial data extraction expert. Analyze this transaction email and extract information.

**CRITICAL INSTRUCTIONS:**
- Return ONLY a valid JSON object, no other text
- **STRICTLY IGNORE promotional/marketing emails** including:
  * Credit card offers, eligibility notifications, pre-approved offers
  * Loan offers and investment opportunities  
  * "We wanted to share an update regarding your credit card profile"
  * "Based on your profile, you may be eligible for"
  * Any email about credit limits, loan amounts, or offers with "up to ₹X"
  * Insurance, mutual fund, or account opening offers
  * Newsletters, marketing content, or unsubscribe emails
- **ONLY EXTRACT actual financial transactions** with these indicators:
  * Money actually spent: "Rs.X spent on", "Rs.X charged", "Rs.X debited"
  * Money actually received: "Rs.X credited", "Rs.X received", "Rs.X refunded"
  * UPI transactions: "UPI transaction", "VPA transfer", "UPI payment"
  * Card transactions: "Card transaction at [merchant]", "Payment successful"
  * Bank transfers: "NEFT/IMPS/RTGS transfer", "Transfer completed"
- If email is promotional/marketing (even if it contains words like "credit", "debit"), return: {"isTransaction": false}
- **EXTRACT scheduled auto-payments**: "Auto-payment of ₹X is scheduled on [date]" → Extract with type: "SCHEDULED"
  - For merchant: Extract service name (e.g., "Subscribe & Save", "Netflix", "Amazon Prime") from the email
  - Example: "Auto-payment of ₹170.05 for your Subscribe & Save orders" → merchant: "Subscribe & Save" or "Amazon Subscribe & Save"
- **EXTRACT failed auto-payments**: "Auto-payment of ₹X failed" → Extract with type: "FAILED"
  - For merchant: Extract service name from the email
- For valid transactions, extract these fields:

**Required Fields:**
1. amount (number): Clean numeric value (e.g., "Rs. 1,222.35" → 1222.35, "Rs.415.06" → 415.06)
2. currency (string): 3-letter ISO code (INR, USD, EUR, GBP)
3. date (string): Transaction date in DD-MM-YY format from email (e.g., "28-12-25" → "2025-12-28")
4. merchant (string): **CRITICAL - Professional Merchant Extraction**
   **Priority Order (use first available):**
   
   **For CREDIT transactions (money received):**
   a) **Sender Name from VPA** (highest priority): 
      - "by VPA 8341870089@axl Chenram Krishna Reddy" → "Chenram Krishna Reddy"
      - "by VPA prayansharora99-3@okhdfcbank PRAYANSH ARORA" → "PRAYANSH ARORA"
      - Extract the NAME that appears AFTER the VPA address
   b) **Sender Name from notes**: "by VPA [email] Name" → "Name"
   c) **From account holder**: "from account holder John Doe" → "John Doe"
   
   **For DEBIT transactions (money sent):**
   a) **Auto-Payment Service** (highest priority for scheduled/failed auto-payments): 
      - "Auto-payment of ₹X for your Subscribe & Save orders" → "Subscribe & Save" or "Amazon Subscribe & Save"
      - "Auto-payment of ₹X for Netflix subscription" → "Netflix"
      - Extract the service/subscription name mentioned in the email
   b) **Recipient Account** (for account transfers): "debited from account 3556 to account ***9592" → "Account ***9592"
   c) **Recipient Name from VPA**: "to VPA merchant@bank MerchantName" → "MerchantName"
   d) **Recipient Name from notes**: "to account ***9592" → "Account ***9592" (use account number as merchant)
   e) **Business Name**: "at Starbucks Coffee" → "Starbucks"
   f) **Service Provider**: "Netflix subscription" → "Netflix"
   
   **For all transactions:**
   e) **Business Name**: "at Starbucks Coffee" → "Starbucks"
   f) **Recipient/Sender Name**: "to John Doe" or "from John Doe" → "John Doe"
   g) **Fallback**: If none found, use "Unknown Merchant"
   
   **Cleaning Rules:**
   - Remove: "@axisb", "@paytm", "@okaxis", "@ybl", "@okhdfcbank", "@axl", "PA", "LTD", "E COMMERCE", "VPA", account numbers
   - Keep: Actual business/person names (preserve proper names like "Chenram Krishna Reddy", "PRAYANSH ARORA")
   - For VPA patterns: Extract the name AFTER the VPA address, not the VPA username itself
5. type (string): DEBIT (debited/spent), CREDIT (credited/received), TRANSFER, SCHEDULED (scheduled auto-payment), or FAILED (failed auto-payment)
6. category (string): Transport, Subscription, Dining, Shopping, Health, Utilities, Travel, Income, Education, Entertainment, Groceries, or General
7. paymentMethod (string): Bank/Card/UPI with account details
   **Format:** "HDFC Bank UPI 3556" for UPI, "HDFC Bank 3556" for others
   **Extract account number from:** "from account 3556" → "3556"

**Email Content:**
Snippet: "${snippet}"
Full Body: "${body}"

**Examples:**

**Example 1 - CREDIT (money received):**
Input: "Rs. 120.00 is successfully credited to your account **3556 by VPA 8341870089@axl Chenram Krishna Reddy on 29-12-25"
Output: {"amount": 120.00, "currency": "INR", "date": "2025-12-29", "merchant": "Chenram Krishna Reddy", "type": "CREDIT", "category": "Income", "paymentMethod": "HDFC Bank UPI 3556"}

**Example 2 - CREDIT (money received):**
Input: "Rs. 700.00 is successfully credited to your account **3556 by VPA prayansharora99-3@okhdfcbank PRAYANSH ARORA on 23-12-25"
Output: {"amount": 700.00, "currency": "INR", "date": "2025-12-23", "merchant": "PRAYANSH ARORA", "type": "CREDIT", "category": "Income", "paymentMethod": "HDFC Bank UPI 3556"}

**Example 3 - DEBIT (money sent):**
Input: "Rs.1.00 has been debited from account 3556 to account ***9592 on 30-12-25"
Output: {"amount": 1.00, "currency": "INR", "date": "2025-12-30", "merchant": "Account ***9592", "type": "DEBIT", "category": "General", "paymentMethod": "HDFC Bank UPI 3556"}

**Example 4 - DEBIT (money sent to VPA):**
Input: "Rs.415.06 has been debited from account 3556 to VPA cred.club@axisb CRED Club on 28-12-25"
Output: {"amount": 415.06, "currency": "INR", "date": "2025-12-28", "merchant": "CRED", "type": "DEBIT", "category": "General", "paymentMethod": "HDFC Bank UPI 3556"}

Return JSON only:`;

      const contents = [
        {
          role: "user",
          parts: [
            { text: promptText },
            ...imageParts
          ]
        }
      ];

      // Direct REST API call using v1beta with gemini-2.5-flash (latest stable model)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        console.warn('Empty response from Gemini AI');
        return this.parseTransactionBasic(message, { isUPI, isCard, isBankTransfer });
      }

      // Extract JSON from response (may contain markdown code blocks)
      let jsonText = responseText.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```(?:json)?/g, '').trim();
      }

      const parsed = JSON.parse(jsonText);
      
      // Check if it's a non-transaction email
      if (parsed.isTransaction === false) {
        console.log('Non-transaction email detected, skipping');
        return null;
      }

      const cleanMerchant = this.cleanMerchantName(parsed.merchant);

      // Use AI extracted date if valid, otherwise fallback to message internal date
      let finalDate = date;
      if (parsed.date) {
        const extractedDate = new Date(parsed.date);
        if (!isNaN(extractedDate.getTime())) {
          finalDate = extractedDate;
        }
      }

      // Handle SCHEDULED and FAILED types - convert to DEBIT for now (can be enhanced later)
      let transactionType: TransactionType = (parsed.type as TransactionType) || 'DEBIT';
      let source = parsed.paymentMethod || this.detectPaymentMethod(snippet, { isUPI, isCard, isBankTransfer });
      let merchant = cleanMerchant;
      
      if (parsed.type === 'SCHEDULED') {
        // Mark as Auto Pay - professional approach
        transactionType = 'DEBIT';
        // Add "Auto Pay" to source field
        if (!source.toLowerCase().includes('auto pay') && !source.toLowerCase().includes('autopay')) {
          source = `${source} • Auto Pay`;
        }
        // Add "Auto Pay" to merchant if not already present
        if (!merchant.toLowerCase().includes('auto pay') && !merchant.toLowerCase().includes('autopay')) {
          merchant = `${merchant} (Auto Pay)`;
        }
      } else if (parsed.type === 'FAILED') {
        transactionType = 'DEBIT';
        // Mark as Failed Auto Pay
        if (!source.toLowerCase().includes('failed')) {
          source = `${source} • Failed`;
        }
        if (!merchant.toLowerCase().includes('failed')) {
          merchant = `${merchant} (Failed)`;
        }
      }

      return {
        id: message.id,
        date: finalDate,
        amount: Math.abs(parsed.amount),
        currency: parsed.currency || this.detectCurrency(snippet),
        merchant: merchant,
        type: transactionType,
        source: source,
        rawSnippet: parsed.type === 'SCHEDULED' || parsed.type === 'FAILED' 
          ? `[${parsed.type}] ${snippet}` 
          : snippet,
        category: parsed.category || this.categorize(cleanMerchant)
      };
    } catch (error) {
      console.error("Gemini Multimodal Parsing failed", error);
      return this.parseTransactionBasic(message, { isUPI, isCard, isBankTransfer });
    }
  }

  private extractEmailBody(message: any): string {
    let body = message.snippet || '';
    try {
      if (message.payload?.body?.data) {
        const decoded = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        body = decoded.substring(0, 1000);
      } else if (message.payload?.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            body = decoded.substring(0, 1000);
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Could not extract full email body');
    }
    return body;
  }

  private cleanMerchantName(merchant: string): string {
    if (!merchant) return 'Unknown';
    if (merchant === 'Unknown Merchant') return 'Unknown';
    
    // Keep "Account ***XXXX" format for account-to-account transfers
    if (merchant.match(/^Account\s+\*{2,}\d+$/i)) {
      return merchant;
    }
    
    // Known merchant mappings (before cleaning)
    const knownMerchants: Record<string, string> = {
      'zeptomarketplacepriv': 'Zepto',
      'zepto': 'Zepto',
      'bhartiairtelltd': 'Airtel',
      'bharti airtel': 'Airtel',
      'airtel': 'Airtel',
      'amazon pay in e commerce': 'Amazon Pay',
      'amazon pay': 'Amazon Pay',
      'amazon': 'Amazon',
    };
    
    const lowerMerchant = merchant.toLowerCase().trim();
    for (const [key, value] of Object.entries(knownMerchants)) {
      if (lowerMerchant.includes(key)) {
        return value;
      }
    }
    
    // Remove VPA domain suffixes (e.g., @axisb, @paytm, @okaxis, @okhdfcbank, @axl)
    let clean = merchant.replace(/@(axisb|paytm|okaxis|ybl|icici|hdfcbank|sbi|kotak|axis|okhdfcbank|axl)\b/gi, '');
    
    // Remove account numbers and masked accounts (e.g., ***9592, **3556) - but keep if it's "Account ***XXXX"
    if (!clean.match(/^Account\s+\*{2,}\d+$/i)) {
      clean = clean.replace(/\*{2,}\d+/g, '').replace(/account\s*\d+/gi, '').replace(/\d{4,}/g, '');
    }
    
    // Split concatenated words (e.g., BHARTIAIRTELLTD → BHARTI AIRTEL LTD)
    // Pattern: Uppercase letters followed by lowercase (word boundary detection)
    clean = clean.replace(/([A-Z])([A-Z]+)([A-Z][a-z])/g, '$1$2 $3'); // Insert space before last uppercase if followed by lowercase
    clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2'); // Insert space between lowercase and uppercase
    clean = clean.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2'); // Insert space between all caps and mixed case
    
    // Remove common prefixes and suffixes
    clean = clean
      .replace(/^(to:|at:|from:|paid to|sent to|transaction at|spent at|purchase at|info:|vpa:?|to vpa|by vpa|account)\s*/i, '')
      .replace(/\s*(Ltd|Pvt|Private|Limited|Inc|Corp|Corporation|PA|E-COMMERCE|E COMMERCE|LTD|IN E COMMERCE|E COMM)\s*$/i, '')
      .replace(/\s*(MARK|OF|INR|RS|AMT|REF|ID|OTP|CODE|ENDING|LIMIT|PAY|PAYMENT|WALLET|VPA|MARK OF INR|CLUB|IN E COMMERCE)\s*$/i, '')
      .replace(/^(MARK|OF|INR|RS|AMT|REF|ID|OTP|CODE|PAY|VPA|MARK OF INR|Account)\s*/i, '');

    // Remove leading/trailing numbers, hyphens, underscores
    clean = clean.replace(/^[0-9\-_#.]+\s*/, '');
    clean = clean.replace(/\s*[0-9\-_#.]+$/, '');

    const platforms: Record<string, string> = {
      'zepto': 'Zepto',
      'amazon': 'Amazon',
      'flipkart': 'Flipkart',
      'myntra': 'Myntra',
      'uber': 'Uber',
      'swiggy': 'Swiggy',
      'zomato': 'Zomato',
      'netflix': 'Netflix',
      'spotify': 'Spotify',
      'google': 'Google',
      'apple': 'Apple',
      'blinkit': 'Blinkit',
      'bigbasket': 'BigBasket',
      'jio': 'Jio',
      'airtel': 'Airtel',
      'vi': 'Vi',
      'cred': 'CRED',
      'phonepe': 'PhonePe',
      'paytm': 'Paytm',
      'BEMINIMALIST':'BE MINIMALIST',
      'nykaa':'Nykaa',
      'Billdesk*Indian Railwa':'IRCTC',
      'Indian Railwa':'IRCTC',
      'Billdesk Indian Railwa':'IRCTC',
      'Billdesk*Indian Railway':'IRCTC',
      'Indian Railway':'IRCTC',
      'Billdesk Indian Railway':'IRCTC',
      'irctc':'IRCTC',
      'NASEEMPERFUMESLLP':'NASEEM PERFUMES',
      'MEESHO':'MEESHO',
      'LIFESTYLEINTERNATION':'LIFE STYLE INTERNATIONAL',
      'MINISO':'MINISO',
      'Reliance Retail':'Reliance Retail',
      'IKEAINDIAPVTLTD':'IKEA INDIA PVT LTD',
      'AdobeSystemsSoftware':'Adobe',
      'MyntraDesignsPvtLtd':'Myntra',
    };

    const lowerClean = clean.toLowerCase();
    for (const [key, value] of Object.entries(platforms)) {
      if (lowerClean === key || lowerClean.includes(key)) {
        return value;
      }
    }

    clean = clean.replace(/\s+/g, ' ').trim();
    if (!clean) return 'Unknown';

    return clean.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private detectCurrency(text: string): string {
    if (/₹|Rs\.?|INR|Rupees?/i.test(text)) return 'INR';
    if (/\$|USD|Dollars?/i.test(text)) return 'USD';
    if (/€|EUR|Euros?/i.test(text)) return 'EUR';
    if (/£|GBP|Pounds?/i.test(text)) return 'GBP';
    return 'INR';
  }

  private detectPaymentMethod(text: string, hints: { isUPI: boolean; isCard: boolean; isBankTransfer: boolean }): string {
    const lower = text.toLowerCase();
    
    // Extract account number for better formatting
    const accountMatch = text.match(/(?:from account|account|a\/c)\s+(\d{4})/i);
    const accountNum = accountMatch ? accountMatch[1] : null;
    
    if (hints.isUPI || lower.includes('upi') || lower.includes('vpa')) {
      // Check for specific bank UPI
      if (lower.includes('hdfc')) {
        return accountNum ? `HDFC Bank UPI ${accountNum}` : 'HDFC Bank UPI';
      }
      if (lower.includes('sbi')) {
        return accountNum ? `SBI UPI ${accountNum}` : 'SBI UPI';
      }
      if (lower.includes('icici')) {
        return accountNum ? `ICICI Bank UPI ${accountNum}` : 'ICICI Bank UPI';
      }
      if (lower.includes('axis')) {
        return accountNum ? `Axis Bank UPI ${accountNum}` : 'Axis Bank UPI';
      }
      
      // Check for UPI apps
      if (lower.includes('phonepe')) return 'PhonePe UPI';
      if (lower.includes('googlepay') || lower.includes('gpay')) return 'Google Pay';
      if (lower.includes('paytm')) return 'Paytm UPI';
      if (lower.includes('bhim')) return 'BHIM UPI';
      if (lower.includes('amazonpay')) return 'Amazon Pay UPI';
      
      return accountNum ? `UPI ${accountNum}` : 'UPI Payment';
    }
    
    if (hints.isCard) {
      // ENHANCED CARD NUMBER EXTRACTION - Fixed patterns to avoid amount/year confusion
      let cardNumber = null;
      let bankName = '';
      let cardType = 'Card';
      
      // Pattern 1: "Credit Card ending 6103" or "Card ending 6103" - MOST SPECIFIC
      const endingPattern = text.match(/(?:credit|debit)?\s*card\s+ending\s+(\d{4})/i);
      if (endingPattern) {
        const possibleCard = endingPattern[1];
        // Validate it's not a year (2020-2030) or common amount patterns
        if (this.isValidCardNumber(possibleCard) && !this.isLikelyAmount(text, possibleCard)) {
          cardNumber = possibleCard;
        }
      }
      
      // Pattern 2: "SBI Credit Card ending 6103" - extract bank and card number
      if (!cardNumber) {
        const bankCardPattern = text.match(/(hdfc|sbi|icici|axis|kotak|citibank|amex|american express)\s+(?:bank\s+)?(?:credit|debit)?\s*card\s+ending\s+(\d{4})/i);
        if (bankCardPattern) {
          const possibleCard = bankCardPattern[2];
          if (this.isValidCardNumber(possibleCard) && !this.isLikelyAmount(text, possibleCard)) {
            bankName = bankCardPattern[1].toUpperCase();
            cardNumber = possibleCard;
          }
        }
      }
      
      // Pattern 3: "your SBI Credit Card ending 6103"
      if (!cardNumber) {
        const yourCardPattern = text.match(/your\s+(hdfc|sbi|icici|axis|kotak|citibank|amex|american express)?\s*(?:bank\s+)?(?:credit|debit)?\s*card\s+ending\s+(\d{4})/i);
        if (yourCardPattern) {
          const possibleCard = yourCardPattern[2];
          if (this.isValidCardNumber(possibleCard) && !this.isLikelyAmount(text, possibleCard)) {
            if (yourCardPattern[1]) bankName = yourCardPattern[1].toUpperCase();
            cardNumber = possibleCard;
          }
        }
      }
      
      // Pattern 4: "Credit Card No. XX4167" or "Card No. 4167" - AVOID AMOUNTS
      if (!cardNumber) {
        const cardNoPattern = text.match(/(?:credit|debit)?\s*card\s+no\.?\s*(?:xx)?(\d{4})/i);
        if (cardNoPattern) {
          const possibleCard = cardNoPattern[1];
          // Extra validation for "Card No." patterns as they're more prone to amount confusion
          if (this.isValidCardNumber(possibleCard) && !this.isLikelyAmount(text, possibleCard)) {
            cardNumber = possibleCard;
          }
        }
      }
      
      // Pattern 5: Generic "ending 1234" - MOST RESTRICTIVE (last resort)
      if (!cardNumber) {
        const genericEndingPattern = text.match(/ending\s+(?:in\s+|with\s+)?(\d{4})/i);
        if (genericEndingPattern) {
          const possibleCard = genericEndingPattern[1];
          // Very strict validation for generic patterns
          if (this.isValidCardNumber(possibleCard) && !this.isLikelyAmount(text, possibleCard)) {
            cardNumber = possibleCard;
          }
        }
      }
      
      // Extract card type
      if (lower.includes('credit')) cardType = 'Credit';
      else if (lower.includes('debit')) cardType = 'Debit';
      else if (lower.includes('visa')) cardType = 'Visa';
      else if (lower.includes('mastercard') || lower.includes('master')) cardType = 'Mastercard';
      else if (lower.includes('rupay')) cardType = 'RuPay';
      else if (lower.includes('amex') || lower.includes('american express')) cardType = 'Amex';
      else cardType = 'Credit'; // Default to Credit if no specific type found
      
      // Extract bank name if not already found
      if (!bankName) {
        const bankMatch = text.match(/(hdfc|sbi|icici|axis|kotak|citibank|amex|american express)/i);
        if (bankMatch) {
          bankName = bankMatch[1].toUpperCase();
        }
      }
      
      // Return formatted card info
      if (cardNumber) {
        if (bankName) {
          return `${bankName} ${cardType} ****${cardNumber}`;
        } else {
          return `${cardType} Card ****${cardNumber}`;
        }
      }
      
      // Fallback patterns
      if (lower.includes('visa')) return 'Visa Card';
      if (lower.includes('mastercard') || lower.includes('master')) return 'Mastercard';
      if (lower.includes('amex') || lower.includes('american express')) return 'American Express';
      return 'Credit/Debit Card';
    }
    
    if (hints.isBankTransfer) {
      if (lower.includes('neft')) return 'Bank NEFT';
      if (lower.includes('imps')) return 'Bank IMPS';
      if (lower.includes('rtgs')) return 'Bank RTGS';
      return 'Bank Transfer';
    }
    
    return 'Gmail Sync';
  }

  /**
   * Validates if a 4-digit number is likely a card number (not a year or amount)
   */
  private isValidCardNumber(cardDigits: string): boolean {
    const num = parseInt(cardDigits);
    
    // Reject years (2020-2030)
    if (num >= 2020 && num <= 2030) {
      return false;
    }
    
    // Reject common amount patterns (like 4178 from Rs.4178.73)
    // Card numbers typically don't start with 0
    if (cardDigits.startsWith('0')) {
      return false;
    }
    
    // Valid card number range (most cards start with 1-9)
    return num >= 1000 && num <= 9999;
  }

  /**
   * Checks if a 4-digit number appears in an amount context that would conflict with card number
   */
  private isLikelyAmount(text: string, digits: string): boolean {
    // Check if the same digits appear in both amount and card contexts
    const hasCardContext = text.match(new RegExp(`card.*ending\\s+${digits}`, 'i'));
    
    // If no card context, use standard amount detection
    if (!hasCardContext) {
      const patterns = [
        new RegExp(`Rs\\.?\\s*${digits}\\.\\d{2}`, 'i'),
        new RegExp(`(?:spent|charged|debited).*Rs\\.?\\s*${digits}(?:\\.\\d{2})?`, 'i'),
        new RegExp(`Rs\\.?\\s*${digits}(?:\\.\\d{2})?.*(?:spent|charged|debited)`, 'i')
      ];
      return patterns.some(pattern => text.match(pattern));
    }
    
    // If card context exists, check for suspicious amount patterns
    // Case 1: Exact whole number match - "Rs.4178 spent on card ending 4178"
    const exactWholeMatch = text.match(new RegExp(`Rs\\.?\\s*${digits}(?!\\.).*card.*ending\\s+${digits}`, 'i'));
    if (exactWholeMatch) {
      return true; // Reject - exact amount matches card number
    }
    
    // Case 2: Decimal amounts - be more nuanced
    const decimalAmountMatch = text.match(new RegExp(`Rs\\.?\\s*(\\d+)\\.(\\d{2}).*card.*ending\\s+${digits}`, 'i'));
    if (decimalAmountMatch) {
      const amountBase = decimalAmountMatch[1];
      const amountDecimals = decimalAmountMatch[2];
      
      // Only reject if the FULL amount (including decimals) would be essentially the same as card number
      // Example: "Rs.4178.00" with card 4178 - suspicious (4178.00 is essentially 4178)
      // Example: "Rs.2757.50" with card 2757 - legitimate (2757.50 ≠ 2757)
      if (amountBase === digits && amountDecimals === "00") {
        return true; // Reject - amount like Rs.4178.00 is essentially 4178
      }
      
      // If decimals are non-zero, the amount is different from card number
      return false; // Allow - amounts like Rs.2757.50 are different from 2757
    }
    
    // Default: allow
    return false;
  }

  /**
   * Public method for basic parsing without AI (quota-friendly fallback)
   */
  async parseTransactionBasicOnly(message: any): Promise<Transaction | null> {
    const snippet = message.snippet || '';
    const body = this.extractEmailBody(message);
    const isUPI = /upi|vpa|@ok|@axis|@icici|@paytm|@ybl|phonepe|googlepay|paytm/i.test(snippet + body);
    const isCard = /card|visa|mastercard|amex|rupay|debit|credit/i.test(snippet + body);
    const isBankTransfer = /neft|imps|rtgs|bank transfer/i.test(snippet + body);
    
    return this.parseTransactionBasic(message, { isUPI, isCard, isBankTransfer });
  }

  private parseTransactionBasic(message: any, hints: { isUPI: boolean; isCard: boolean; isBankTransfer: boolean }): Transaction | null {
    const snippet = (message.snippet || '').replace(/\r?\n|\r/g, " ");
    const body = this.extractEmailBody(message);
    const fullText = (snippet + ' ' + body).toLowerCase();
    const date = new Date(parseInt(message.internalDate));

    // ENHANCED PROMOTIONAL EMAIL DETECTION
    // First check for strong promotional indicators (these override transaction keywords)
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
      console.log('Strong promotional email detected, skipping');
      return null;
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
      console.log('No actual transaction patterns found, likely promotional email, skipping');
      return null;
    }

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
    // Search in both snippet and body for better accuracy
    const searchText = snippet + ' ' + body;
    
    // Avoid extracting amounts from promotional contexts - Fixed patterns with proper precedence
    const promotionalAmountPatterns = [
      /(?:up to|upto|limit|eligible for|qualify for).*₹.*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?)/i,
      /₹.*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?).*(?:limit|eligible|qualify|offer)/i,
      /credit.*limit.*₹.*(\d{4,}(?:\.\d{2})?|\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?)/i
    ];
    
    // Check if amount is in promotional context
    const isPromotionalAmount = promotionalAmountPatterns.some(pattern => searchText.match(pattern));
    
    if (isPromotionalAmount) {
      console.log('Amount found in promotional context, skipping');
      return null;
    }
    
    for (const pattern of amountPatterns) {
      const match = searchText.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) break;
      }
    }

    if (!amount) return null;

    let type: TransactionType = 'DEBIT';
    const lowerSnippet = snippet.toLowerCase();
    const lowerBody = body.toLowerCase();
    const lowerFull = lowerSnippet + ' ' + lowerBody;
    
    // Check for scheduled auto-payment
    if (lowerFull.includes('auto-payment') && lowerFull.includes('scheduled')) {
      // Keep as DEBIT but will be marked in rawSnippet
      type = 'DEBIT';
    } else if (lowerFull.includes('auto-payment') && lowerFull.includes('failed')) {
      // Keep as DEBIT but will be marked in rawSnippet
      type = 'DEBIT';
    } else {
      const creditKeywords = ['credited', 'received', 'refund', 'cashback', 'inward', 'salary', 'income', 'deposit'];
      if (creditKeywords.some(kw => lowerFull.includes(kw))) {
        type = 'CREDIT';
      } else if (lowerFull.includes('transfer') && !lowerFull.includes('spent')) {
        type = 'TRANSFER';
      }
    }

    let merchant = this.extractMerchant(snippet, hints);
    let source = this.detectPaymentMethod(snippet, hints);
    
    // Check if source already contains card number to avoid duplication
    const hasCardNumber = /\*{4}\d{4}/.test(source);
    
    // Only add card number if not already present
    if (!hasCardNumber) {
      const cardMatch = snippet.match(/(?:card|a\/c|account|acct)\s+(?:ending|ending in|ending with|no\.?|number)\s*([X*\d]{4,})/i);
      if (cardMatch) {
        const last4 = cardMatch[1].replace(/[X*]/g, '').slice(-4);
        if (last4.length === 4) {
          // Check if source already has this card number
          if (!source.includes(`****${last4}`)) {
            source = source.includes('Card') ? source.replace('Card', `Card ****${last4}`) : `${source} ****${last4}`;
          }
        }
      }
    }
    
    // Remove duplicate card numbers from source (e.g., "SBI Credit ****6103 ****6103" -> "SBI Credit ****6103")
    source = source.replace(/(\*{4}\d{4})\s+\1/g, '$1');

    merchant = this.cleanMerchantName(merchant);

    // Mark scheduled/failed in rawSnippet and update source/merchant
    let rawSnippet = snippet;
    let finalMerchant = merchant;
    let finalSource = source;
    
    if (lowerFull.includes('auto-payment') && lowerFull.includes('scheduled')) {
      rawSnippet = `[SCHEDULED] ${snippet}`;
      // Add "Auto Pay" to source field
      if (!finalSource.toLowerCase().includes('auto pay') && !finalSource.toLowerCase().includes('autopay')) {
        finalSource = `${finalSource} • Auto Pay`;
      }
      // Add "Auto Pay" to merchant if not already present
      if (!finalMerchant.toLowerCase().includes('auto pay') && !finalMerchant.toLowerCase().includes('autopay')) {
        finalMerchant = `${finalMerchant} (Auto Pay)`;
      }
    } else if (lowerFull.includes('auto-payment') && lowerFull.includes('failed')) {
      rawSnippet = `[FAILED] ${snippet}`;
      // Mark as Failed Auto Pay
      if (!finalSource.toLowerCase().includes('failed')) {
        finalSource = `${finalSource} • Failed`;
      }
      if (!finalMerchant.toLowerCase().includes('failed')) {
        finalMerchant = `${finalMerchant} (Failed)`;
      }
    }

    return {
      id: message.id,
      date,
      amount,
      currency: this.detectCurrency(snippet),
      merchant: finalMerchant,
      type,
      source: finalSource,
      rawSnippet: rawSnippet,
      category: this.categorize(merchant)
    };
  }

  private extractMerchant(text: string, hints: { isUPI: boolean; isCard: boolean; isBankTransfer: boolean }): string {
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
      
      // "UPI transaction: Rs.1000 received from john@okaxis JOHN SMITH"
      /Rs\.?\s*[\d,]+(?:\.\d{2})?\s+received\s+from\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\.|$)/i,
      
      // Generic patterns without amount
      /is\s+successfully\s+credited.*by\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\s+dated|\.|$)/i,
      /credited\s+by\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\s+dated|\.|$)/i,
      /received\s+from\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\.|$)/i
    ];

    // Try credit UPI patterns first
    for (const pattern of creditUPIPatterns) {
      const match = text.match(pattern);
      if (match) {
        // For patterns with 3 groups, use the name (group 3)
        if (match[3]) {
          const merchantName = match[3].trim();
          if (merchantName && merchantName.length > 2 && merchantName.length < 50) {
            return this.cleanUPIMerchant(merchantName);
          }
        }
        // For patterns with 1 group, use the name (group 1)
        else if (match[1]) {
          const merchantName = match[1].trim();
          if (merchantName && merchantName.length > 2 && merchantName.length < 50) {
            return this.cleanUPIMerchant(merchantName);
          }
        }
      }
    }

    // Enhanced UPI Patterns - Priority 2: DEBIT UPI (money sent)
    const debitUPIPatterns = [
      // "Rs.50000.00 has been debited from account 3556 to VPA 9097490427@pz VISHWJEET KUMAR"
      /Rs\.?\s*[\d,]+(?:\.\d{2})?\s+(?:has been\s+)?debited\s+from\s+account\s+\d+\s+to\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s]+?)(?:\s+on|\.|$)/i,
      
      // "Rs.50000.00 debited to VPA merchant@paytm MERCHANT NAME on 25-Dec"
      /Rs\.?\s*[\d,]+(?:\.\d{2})?\s+(?:has been\s+)?debited.*to\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s\&\.\-]+?)(?:\s+on|\.|$)/i,
      
      // "to VPA merchant@bank MerchantName" pattern (existing)
      /to VPA\s+([A-Za-z0-9\.\-_]+)@[A-Za-z]+\s+([A-Za-z0-9\s\&\.\-]+?)(?:\s+on|\.|$)/i,
      
      // "UPI payment to merchant@axis ZOMATO BANGALORE"
      /payment\s+to\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s\&\.\-]+?)(?:\s+on|\.|$)/i,
      
      // Generic patterns without amount
      /debited.*to\s+VPA\s+([A-Za-z0-9\.\-_]+)@([A-Za-z]+)\s+([A-Z][A-Za-z\s\&\.\-]+?)(?:\s+on|\.|$)/i
    ];

    // Try debit UPI patterns
    for (const pattern of debitUPIPatterns) {
      const match = text.match(pattern);
      if (match) {
        // For patterns with 3 groups, use the name (group 3)
        if (match[3]) {
          const merchantName = match[3].trim();
          if (merchantName && merchantName.length > 2 && merchantName.length < 50) {
            return this.cleanUPIMerchant(merchantName);
          }
        }
        // For patterns with 2 groups, use the name (group 2) or fallback to VPA username (group 1)
        else if (match[2]) {
          const merchantName = match[2].trim();
          if (merchantName && merchantName.length > 2 && merchantName.length < 50) {
            return this.cleanUPIMerchant(merchantName);
          }
          // Fallback to VPA username
          const vpaUser = match[1]?.split('.')[0];
          if (vpaUser && vpaUser.length > 2) {
            return this.cleanUPIMerchant(vpaUser);
          }
        }
      }
    }

    // Priority 3: Account to account transfer - "debited from account X to account ***Y"
    const accountToAccountPattern = /debited from account\s+\d+\s+to account\s+(\*{2,}\d+)/i;
    const accountToAccountMatch = text.match(accountToAccountPattern);
    if (accountToAccountMatch && accountToAccountMatch[1]) {
      return `Account ${accountToAccountMatch[1]}`;
    }

    // Priority 4: "to account ***9592" pattern
    const accountPattern = /to account\s+(\*{2,}\d+)/i;
    const accountMatch = text.match(accountPattern);
    if (accountMatch) {
      return `Account ${accountMatch[1]}`;
    }

    // Priority 5: Card transactions - "at MERCHANTNAME" or "Info: MERCHANTNAME" pattern
    const cardMerchantPatterns = [
      /(?:at|spent on|spent at)\s+([A-Z][A-Z0-9]{5,40})(?:\s+on|\s+dated|\.|\,)/i,
      /Info:\s+([A-Z][A-Z\s]{5,40})(?:\s+IN|\s+E|\s+COMMERCE|\.|\,)/i,
      /at\s+([A-Z][A-Za-z0-9]{5,40})\s+on/i
    ];
    
    for (const pattern of cardMerchantPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let merchant = match[1].trim();
        // Clean known merchants
        if (merchant.includes('ZEPTO') || merchant.includes('ZEPTOMARKETPLACE')) return 'Zepto';
        if (merchant.includes('BHARTIAIRTEL') || merchant.includes('AIRTELLTD') || merchant.includes('BHARTI AIRTEL')) return 'Airtel';
        if (merchant.includes('AMAZON PAY') || merchant.includes('AMAZONPAY')) return 'Amazon Pay';
        if (merchant.includes('AMAZON')) return 'Amazon';
        // Return cleaned merchant
        return this.cleanMerchantName(merchant);
      }
    }

    // Priority 6: Standard merchant patterns
    const patterns = [
      /(?:to|paid to|sent to|transferred to|transaction at)\s+([A-Z][A-Za-z0-9\s\&\.\-]{2,40})(?:\s+via|\s+through|\s+using|\s+MARK|\.|\,)/i,
      /(?:at|from)\s+([A-Z][A-Za-z0-9\s\&\.\-]{2,40})(?:\s+on|\s+dated|\s+MARK|\.|\,)/i,
      /debited\s+(?:for|at|from|to)\s+([A-Za-z0-9\s\&\.\-]{2,40})(?:\.|\,|\s+on)/i,
      /purchase\s+(?:at|from)\s+([A-Za-z0-9\s\&\.\-]{2,40})(?:\.|\,)/i,
      /spent\s+(?:at|on)\s+([A-Za-z0-9\s\&\.\-]{2,40})(?:\.|\,)/i,
      /merchant[:\s]+([A-Za-z0-9\s\&\.\-]{2,40})(?:\.|\,)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let merchant = match[1].trim();
        if (merchant.includes('@')) {
          merchant = merchant.split('@')[0].replace(/[_\-\.]/g, ' ');
        }
        merchant = merchant.replace(/[\.,"';:]+$/, '');
        if (merchant.length >= 3 && merchant.length <= 50) {
          return merchant;
        }
      }
    }
    
    return 'Unknown Merchant';
  }

  /**
   * Clean UPI merchant names
   */
  private cleanUPIMerchant(merchant: string): string {
    // Remove VPA domain suffixes (including new ones like pz, superyes)
    merchant = merchant.replace(/@(axisb|paytm|okaxis|ybl|icici|hdfcbank|sbi|kotak|axis|okhdfcbank|axl|oksbi|okicici|pz|superyes|okhdfcbank|okhdfc|okicici|oksbi|okaxis|okkotak|okyes|okindusind|okpnb|okbob|okcanara|okfederal|okrbl|okbandhan|okciti|okhsbc|oksc|okdbs)\b/gi, '');
    
    // Remove common UPI prefixes/suffixes
    merchant = merchant.replace(/^(VPA|UPI|PA)\s*/i, '');
    merchant = merchant.replace(/\s*(VPA|UPI|PA)$/i, '');
    
    // Remove transaction reference numbers that might be included
    merchant = merchant.replace(/\s+\d{10,}/g, '');
    
    // Clean up extra spaces
    merchant = merchant.replace(/\s+/g, ' ').trim();
    
    return this.titleCase(merchant);
  }

  /**
   * Convert string to title case
   */
  private titleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  private categorize(merchant: string): string {
    const m = merchant.toLowerCase();
    if (/(uber|ola|lyft|rapido|metro|railway|train|bus|taxi|cab|parking|toll|gas|petrol|fuel|diesel)/i.test(m)) return 'Transport';
    if (/(netflix|spotify|prime|amazon prime|hotstar|disney|youtube|premium|subscription|monthly|apple music|jio|airtel|membership|gym)/i.test(m)) return 'Subscription';
    if (/(zomato|swiggy|ubereats|foodpanda|domino|pizza|restaurant|cafe|starbucks|mcdonald|kfc|burger|food|dining|eatery|biryani)/i.test(m)) return 'Dining';
    if (/(amazon|flipkart|myntra|ajio|meesho|snapdeal|walmart|shop|store|mall|retail|fashion|clothing|electronics|gadget)/i.test(m)) return 'Shopping';
    if (/(bigbasket|grofers|blinkit|dunzo|zepto|instamart|supermarket|grocery|vegetables|fruits|kirana|mart)/i.test(m)) return 'Groceries';
    if (/(hospital|clinic|pharmacy|medicine|apollo|fortis|max hospital|doctor|medical|health|wellness|diagnostics|lab test)/i.test(m)) return 'Health';
    if (/(electricity|water|gas cylinder|lpg|broadband|internet|wifi|telephone|mobile|recharge|bill|utility|bsnl|vodafone)/i.test(m)) return 'Utilities';
    if (/(flight|airline|hotel|booking|makemytrip|goibibo|cleartrip|yatra|irctc|tourism|travel|resort|vacation)/i.test(m)) return 'Travel';
    if (/(school|college|university|course|tuition|udemy|coursera|byju|unacademy|education|coaching|books|stationery)/i.test(m)) return 'Education';
    if (/(movie|cinema|pvr|inox|concert|event|ticket|bookmyshow|game|gaming|entertainment|theatre)/i.test(m)) return 'Entertainment';
    if (/(salary|income|payment received|refund|cashback|dividend|interest|bonus|incentive|commission)/i.test(m)) return 'Income';
    if (/(mutual fund|stock|share|sip|insurance|lic|policy|investment|trading|demat)/i.test(m)) return 'Investment';
    return 'General';
  }
}
