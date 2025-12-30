
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
   * Gets the API key with priority: .env.local > App Settings
   * @returns API key string or null
   */
  private getApiKey(): string | null {
    // Priority 1: Environment variable (.env.local) - safely access for Vite/TS
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? (process as any).env?.API_KEY : null);
    if (envKey) {
      return envKey;
    }

    // Priority 2: App settings (localStorage)
    if (this.appApiKey) {
      return this.appApiKey;
    }

    return null;
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
          throw new Error('GMAIL_SCOPE_INSUFFICIENT: Please logout and login again to grant Gmail access permissions.');
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

  async listMessages(maxResults = 50, q = 'subject:(transaction OR debit OR credit OR payment OR confirmed OR receipt OR "spent on" OR "charged" OR "UPI txn" OR "done a UPI" OR debited OR credited) OR from:(alerts@hdfcbank.net OR alerts@sbi.co.in OR alerts@icicibank.com OR alerts@axisbank.com)') {
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
- If an email is NOT a transaction (promotional/marketing), use: {"isTransaction": false, "emailIndex": N}
- For valid transactions, extract these fields:

**Required Fields per Transaction:**
1. emailIndex (number): The email number (1 to ${messages.length})
2. amount (number): Clean numeric value (e.g., "Rs. 1,222.35" → 1222.35, "Rs.415.06" → 415.06)
3. currency (string): 3-letter ISO code (INR, USD, EUR, GBP)
4. date (string): Transaction date in DD-MM-YY format from email (e.g., "28-12-25" → "2025-12-28")
5. merchant (string): **CRITICAL - Professional Merchant Extraction**
   **Priority Order (use first available):**
   a) **VPA Name** (highest priority): "to VPA cred.club@axisb CRED Club" → "CRED"
   b) **Merchant Name after VPA**: "to VPA merchant@bank MerchantName" → "MerchantName"
   c) **Business Name**: "at Starbucks Coffee" → "Starbucks"
   d) **Recipient Name**: "to John Doe" → "John Doe"
   e) **Service Provider**: "Netflix subscription" → "Netflix"
   f) **Fallback**: If none found, use "Unknown Merchant"
   
   **Cleaning Rules:**
   - Remove: "@axisb", "@paytm", "@okaxis", "@ybl", "PA", "LTD", "E COMMERCE", "VPA"
   - Keep: Actual business/person names
   - Examples:
     * "to VPA cred.club@axisb CRED Club" → "CRED"
     * "to VPA appleservices.bdsi@hdfcbank Apple Services" → "Apple Services"
     * "paid to Uber India" → "Uber"
     * "transaction at Zomato" → "Zomato"

6. type (string): DEBIT (debited/spent), CREDIT (credited/received), or TRANSFER
7. category (string): Transport, Subscription, Dining, Shopping, Health, Utilities, Travel, Income, Education, Entertainment, Groceries, or General
8. paymentMethod (string): Bank/Card/UPI with account details
   **Format:** "HDFC Bank UPI 3556" for UPI, "HDFC Bank 3556" for others
   **Extract account number from:** "from account 3556" → "3556"

**Emails to Process:**
${emailsData}

**Example for HDFC UPI:**
Input: "Rs.415.06 has been debited from account 3556 to VPA cred.club@axisb CRED Club on 28-12-25"
Output: {"emailIndex": 1, "amount": 415.06, "currency": "INR", "date": "2025-12-28", "merchant": "CRED", "type": "DEBIT", "category": "General", "paymentMethod": "HDFC Bank UPI 3556"}

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

          return {
            id: msg.id,
            date: finalDate,
            amount: Math.abs(parsed.amount || 0),
            currency: parsed.currency || this.detectCurrency(snippet),
            merchant: cleanMerchant,
            type: (parsed.type as TransactionType) || 'DEBIT',
            source: parsed.paymentMethod || 'Gmail Sync',
            rawSnippet: snippet,
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
- If this is NOT a transaction email (e.g., promotional, marketing), return: {"isTransaction": false}
- For valid transactions, extract these fields:

**Required Fields:**
1. amount (number): Clean numeric value (e.g., "Rs. 1,222.35" → 1222.35, "Rs.415.06" → 415.06)
2. currency (string): 3-letter ISO code (INR, USD, EUR, GBP)
3. date (string): Transaction date in DD-MM-YY format from email (e.g., "28-12-25" → "2025-12-28")
4. merchant (string): **CRITICAL - Professional Merchant Extraction**
   **Priority Order (use first available):**
   a) **VPA Name** (highest priority): "to VPA cred.club@axisb CRED Club" → "CRED"
   b) **Merchant Name after VPA**: "to VPA merchant@bank MerchantName" → "MerchantName"
   c) **Business Name**: "at Starbucks Coffee" → "Starbucks"
   d) **Recipient Name**: "to John Doe" → "John Doe"
   e) **Service Provider**: "Netflix subscription" → "Netflix"
   f) **Fallback**: If none found, use "Unknown Merchant"
   
   **Cleaning Rules:**
   - Remove: "@axisb", "@paytm", "@okaxis", "@ybl", "PA", "LTD", "E COMMERCE", "VPA"
   - Keep: Actual business/person names
5. type (string): DEBIT (debited/spent), CREDIT (credited/received), or TRANSFER
6. category (string): Transport, Subscription, Dining, Shopping, Health, Utilities, Travel, Income, Education, Entertainment, Groceries, or General
7. paymentMethod (string): Bank/Card/UPI with account details
   **Format:** "HDFC Bank UPI 3556" for UPI, "HDFC Bank 3556" for others
   **Extract account number from:** "from account 3556" → "3556"

**Email Content:**
Snippet: "${snippet}"
Full Body: "${body}"

**Example for HDFC UPI:**
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

      return {
        id: message.id,
        date: finalDate,
        amount: Math.abs(parsed.amount),
        currency: parsed.currency || this.detectCurrency(snippet),
        merchant: cleanMerchant,
        type: (parsed.type as TransactionType) || 'DEBIT',
        source: parsed.paymentMethod || this.detectPaymentMethod(snippet, { isUPI, isCard, isBankTransfer }),
        rawSnippet: snippet,
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
    
    // Remove VPA domain suffixes (e.g., @axisb, @paytm, @okaxis)
    let clean = merchant.replace(/@(axisb|paytm|okaxis|ybl|icici|hdfcbank|sbi|kotak|axis)\b/gi, '');
    
    // Remove common prefixes and suffixes
    clean = clean
      .replace(/^(to:|at:|from:|paid to|sent to|transaction at|spent at|purchase at|info:|vpa:?|to vpa)\s*/i, '')
      .replace(/\s*(Ltd|Pvt|Private|Limited|Inc|Corp|Corporation|PA|E-COMMERCE|E COMMERCE|LTD)\s*$/i, '')
      .replace(/\s*(MARK|OF|INR|RS|AMT|REF|ID|OTP|CODE|ENDING|LIMIT|PAY|PAYMENT|WALLET|VPA|MARK OF INR|CLUB)\s*$/i, '')
      .replace(/^(MARK|OF|INR|RS|AMT|REF|ID|OTP|CODE|PAY|VPA|MARK OF INR)\s*/i, '');

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
      const cardMatch = text.match(/(hdfc|sbi|icici|axis|kotak|citibank|amex|american express)\s*(visa|master|mastercard|rupay|debit|credit)?\s*.*?(\d{4})/i);
      if (cardMatch) {
        const bank = cardMatch[1].toUpperCase();
        const type = cardMatch[2] || 'Card';
        const last4 = cardMatch[3];
        return `${bank} ${type} ****${last4}`;
      }
      if (lower.includes('visa')) return 'Visa Card';
      if (lower.includes('mastercard') || lower.includes('master')) return 'Mastercard';
      if (lower.includes('amex') || lower.includes('american express')) return 'American Express';
      return 'Debit/Credit Card';
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
    const date = new Date(parseInt(message.internalDate));

    const amountPatterns = [
      /(?:Rs\.?|₹|INR)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i,
      /(?:\$|USD|EUR|GBP|€|£)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)\s*(?:Rs\.?|₹|INR|USD|Rupees?)/i,
      /(?:amount|of|for|total)\s*:?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
    ];

    let amount = 0;
    for (const pattern of amountPatterns) {
      const match = snippet.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) break;
      }
    }

    if (!amount) return null;

    let type: TransactionType = 'DEBIT';
    const lowerSnippet = snippet.toLowerCase();
    const creditKeywords = ['credited', 'received', 'refund', 'cashback', 'inward', 'salary', 'income', 'deposit'];
    if (creditKeywords.some(kw => lowerSnippet.includes(kw))) {
      type = 'CREDIT';
    } else if (lowerSnippet.includes('transfer') && !lowerSnippet.includes('spent')) {
      type = 'TRANSFER';
    }

    let merchant = this.extractMerchant(snippet, hints);
    let source = this.detectPaymentMethod(snippet, hints);
    const cardMatch = snippet.match(/(?:card|a\/c|account|acct)\s+(?:ending|ending in|ending with|no\.?|number)\s*([X*\d]{4,})/i);
    if (cardMatch) {
      const last4 = cardMatch[1].replace(/[X*]/g, '').slice(-4);
      if (last4.length === 4) {
        source = source.includes('Card') ? source.replace('Card', `Card ****${last4}`) : `${source} ****${last4}`;
      }
    }

    merchant = this.cleanMerchantName(merchant);

    return {
      id: message.id,
      date,
      amount,
      currency: this.detectCurrency(snippet),
      merchant,
      type,
      source,
      rawSnippet: snippet,
      category: this.categorize(merchant)
    };
  }

  private extractMerchant(text: string, hints: { isUPI: boolean; isCard: boolean; isBankTransfer: boolean }): string {
    // Priority 1: VPA format - "to VPA merchant@bank MerchantName"
    const vpaPattern = /to VPA\s+([A-Za-z0-9\.\-_]+)@[A-Za-z]+\s+([A-Za-z0-9\s\&\.\-]+?)(?:\s+on|\.|$)/i;
    const vpaMatch = text.match(vpaPattern);
    if (vpaMatch) {
      // Use the merchant name after VPA (group 2) if available, otherwise use VPA username (group 1)
      const merchantName = vpaMatch[2]?.trim();
      if (merchantName && merchantName.length > 2) {
        return merchantName;
      }
      const vpaUsername = vpaMatch[1]?.split('.')[0]; // Take first part before dot
      if (vpaUsername && vpaUsername.length > 2) {
        return vpaUsername;
      }
    }

    // Priority 2: Standard merchant patterns
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
