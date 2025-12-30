import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Shield size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
              <p className="text-sm md:text-base text-slate-500 font-bold">Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 md:p-6 border border-indigo-100">
            <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
              At <span className="font-black text-indigo-600">Peymen</span>, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our payment tracking application.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Database size={20} className="text-indigo-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">1. Information We Collect</h2>
            </div>
            
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-black text-slate-900 mb-2">1.1 Gmail Data</h3>
                <p className="text-sm md:text-base leading-relaxed mb-3">
                  To provide our payment tracking services, we access your Gmail account with your explicit consent. We only access emails related to financial transactions, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                  <li>Payment confirmation emails from banks and payment gateways</li>
                  <li>Transaction receipts and invoices</li>
                  <li>Bank statements and financial notifications</li>
                </ul>
                <p className="text-sm md:text-base mt-3 leading-relaxed">
                  <strong className="font-black">We do NOT:</strong> Read your personal emails, send emails on your behalf, modify your emails, or access any data beyond what is necessary for transaction tracking.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">1.2 User Account Information</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  When you sign in with Google, we collect:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li>Your name and email address (from your Google account)</li>
                  <li>Profile picture (if available)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">1.3 Transaction Data</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  We extract and store the following transaction information locally on your device:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li>Transaction date and time</li>
                  <li>Amount and currency</li>
                  <li>Merchant or recipient name</li>
                  <li>Payment method (UPI, Card, Bank Transfer)</li>
                  <li>Transaction type (Debit/Credit)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Eye size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">2. How We Use Your Information</h2>
            </div>
            
            <div className="space-y-3 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                We use the collected information solely for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li><strong className="font-black">Transaction Tracking:</strong> To automatically extract and organize your payment transactions from emails</li>
                <li><strong className="font-black">Financial Analytics:</strong> To provide spending insights, trends, and reports</li>
                <li><strong className="font-black">App Functionality:</strong> To enable features like auto-sync, notifications, and data visualization</li>
                <li><strong className="font-black">User Experience:</strong> To personalize your experience and improve our services</li>
              </ul>
              <p className="text-sm md:text-base mt-4 leading-relaxed font-medium bg-amber-50 p-4 rounded-xl border border-amber-200">
                <strong className="font-black text-amber-800">Important:</strong> We do NOT sell, rent, or share your personal or financial data with third parties for marketing or advertising purposes.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Lock size={20} className="text-emerald-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">3. Data Storage and Security</h2>
            </div>
            
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-black text-slate-900 mb-2">3.1 Local Storage</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  All your transaction data is stored <strong className="font-black">locally on your device</strong> using IndexedDB (browser-based database). This means:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li>Your data never leaves your device</li>
                  <li>We do not have access to your stored transactions</li>
                  <li>You have full control over your data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">3.2 Security Measures</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li>OAuth 2.0 authentication via Google (secure token-based access)</li>
                  <li>Encrypted data transmission (HTTPS)</li>
                  <li>Secure local storage with browser security features</li>
                  <li>No server-side storage of sensitive financial data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">3.3 Gmail API Access</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  We use Google's Gmail API with <strong className="font-black">read-only access</strong> to your emails. We only request the minimum necessary permissions:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li><code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">gmail.readonly</code> - To read emails (read-only, no modifications)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserCheck size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">4. Your Rights and Choices</h2>
            </div>
            
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-black text-slate-900 mb-2">4.1 Access and Control</h3>
                <p className="text-sm md:text-base leading-relaxed mb-3">
                  You have the following rights regarding your data:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                  <li><strong className="font-black">View Your Data:</strong> Access all stored transactions within the app</li>
                  <li><strong className="font-black">Delete Your Data:</strong> Clear all stored transactions at any time</li>
                  <li><strong className="font-black">Revoke Access:</strong> Disconnect your Google account and revoke Gmail access</li>
                  <li><strong className="font-black">Export Data:</strong> Export your transaction data in a readable format</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">4.2 Google Account Permissions</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  You can revoke Gmail access at any time by:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li>Visiting <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Google Account Permissions</a></li>
                  <li>Finding "Peymen" in the list of connected apps</li>
                  <li>Clicking "Remove Access"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <Mail size={20} className="text-rose-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">5. Third-Party Services</h2>
            </div>
            
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-black text-slate-900 mb-2">5.1 Google Services</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  Our app integrates with Google services:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li><strong className="font-black">Google OAuth 2.0:</strong> For secure authentication</li>
                  <li><strong className="font-black">Gmail API:</strong> For reading transaction emails</li>
                </ul>
                <p className="text-sm md:text-base mt-3 leading-relaxed">
                  Your use of Google services is also governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Google's Privacy Policy</a>.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">5.2 AI Processing (Optional)</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  If you provide a Gemini API key, we use Google's Gemini AI to extract transaction data from emails. This processing:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2 text-sm md:text-base">
                  <li>Occurs locally or via Google's API (depending on configuration)</li>
                  <li>Does not store your emails on external servers</li>
                  <li>Is optional - you can use basic parsing instead</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">6. Data Retention</h2>
            <div className="space-y-3 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                Your transaction data is stored locally on your device until you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li>Manually delete it from the app</li>
                <li>Clear your browser's local storage</li>
                <li>Uninstall the app</li>
              </ul>
              <p className="text-sm md:text-base mt-3 leading-relaxed">
                We do not retain any copies of your data on our servers. Once deleted from your device, the data cannot be recovered.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">7. Children's Privacy</h2>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed">
              Peymen is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
            </p>
          </div>

          {/* Section 8 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">8. Changes to This Privacy Policy</h2>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this page. Your continued use of the app after such changes constitutes acceptance of the updated policy.
            </p>
          </div>

          {/* Section 9 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">9. Contact Us</h2>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-sm md:text-base font-bold text-slate-900 mb-2">Peymen Support</p>
              <p className="text-sm md:text-base text-slate-700">
                Email: <a href="mailto:peymen@vishwjeet.me" className="text-indigo-600 hover:underline font-bold">peymen@vishwjeet.me</a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center">
            <p className="text-sm text-slate-500 mb-4">
              By using Peymen, you acknowledge that you have read and understood this Privacy Policy.
            </p>
            <a
              href="/"
              target="_self"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
              Go Back to App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
