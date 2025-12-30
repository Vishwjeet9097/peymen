import React from 'react';
import { FileText, AlertTriangle, Shield, Ban, CheckCircle, ArrowLeft } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <FileText size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Terms of Service</h1>
              <p className="text-sm md:text-base text-slate-500 font-bold">Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 mt-1 flex-shrink-0" />
              <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                Please read these Terms of Service carefully before using <span className="font-black text-indigo-600">Peymen</span>. By accessing or using our application, you agree to be bound by these terms.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-indigo-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">1. Acceptance of Terms</h2>
            </div>
            
            <div className="space-y-3 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                By accessing or using Peymen ("the App", "we", "us", or "our"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
              </p>
              <p className="text-sm md:text-base leading-relaxed">
                We reserve the right to modify these terms at any time. Your continued use of the App after such modifications constitutes acceptance of the updated terms.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">2. Description of Service</h2>
            </div>
            
            <div className="space-y-4 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                Peymen is a financial tracking application that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li>Connects to your Gmail account with your explicit consent</li>
                <li>Extracts payment transaction information from emails</li>
                <li>Organizes and displays your financial transactions</li>
                <li>Provides spending analytics and insights</li>
                <li>Stores all data locally on your device</li>
              </ul>
              <p className="text-sm md:text-base mt-3 leading-relaxed">
                The App is provided "as is" and we do not guarantee uninterrupted or error-free operation.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Ban size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">3. User Responsibilities</h2>
            </div>
            
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-black text-slate-900 mb-2">3.1 Account Security</h3>
                <p className="text-sm md:text-base leading-relaxed mb-3">
                  You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                  <li>Maintaining the security of your Google account credentials</li>
                  <li>Not sharing your account access with others</li>
                  <li>Immediately revoking access if you suspect unauthorized use</li>
                  <li>Keeping your device secure and protected</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">3.2 Acceptable Use</h3>
                <p className="text-sm md:text-base leading-relaxed mb-3">
                  You agree NOT to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                  <li>Use the App for any illegal or unauthorized purpose</li>
                  <li>Attempt to reverse engineer or extract the App's source code</li>
                  <li>Interfere with or disrupt the App's functionality</li>
                  <li>Use automated systems to access the App without permission</li>
                  <li>Share false or misleading financial information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">3.3 Age Requirement</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  You must be at least <strong className="font-black">18 years old</strong> to use Peymen. By using the App, you represent that you meet this age requirement.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">4. Gmail Access and Permissions</h2>
            <div className="space-y-4 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                To use Peymen, you must grant the App access to your Gmail account. By doing so, you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li>Authorize us to read emails containing financial transaction information</li>
                <li>Understand that we use <strong className="font-black">read-only access</strong> - we cannot send, modify, or delete your emails</li>
                <li>Grant permission to use Google OAuth 2.0 for secure authentication</li>
                <li>Agree to comply with <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Google's Terms of Service</a></li>
              </ul>
              <p className="text-sm md:text-base mt-3 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-200">
                <strong className="font-black text-blue-800">You can revoke access at any time</strong> through your Google Account settings. Revoking access will prevent the App from syncing new transactions but will not delete your locally stored data.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">5. Data and Privacy</h2>
            <div className="space-y-3 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                Your use of Peymen is also governed by our <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Privacy Policy</a>. Key points:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li>All transaction data is stored locally on your device</li>
                <li>We do not sell or share your data with third parties</li>
                <li>You have full control over your data and can delete it at any time</li>
                <li>We use industry-standard security measures to protect your information</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">6. Intellectual Property</h2>
            <div className="space-y-3 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                The App, including its design, features, and functionality, is owned by Peymen and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-sm md:text-base leading-relaxed">
                You may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li>Copy, modify, or distribute the App without permission</li>
                <li>Use our trademarks or logos without authorization</li>
                <li>Create derivative works based on the App</li>
              </ul>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">7. Disclaimers and Limitations</h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-black text-slate-900 mb-2">7.1 No Financial Advice</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  Peymen is a tracking and organization tool. We do not provide financial, investment, or tax advice. The information displayed in the App is for informational purposes only and should not be considered as professional financial advice.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">7.2 Accuracy of Data</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  While we strive for accuracy, we cannot guarantee that all transaction data will be extracted correctly from your emails. You are responsible for verifying the accuracy of your financial information.
                </p>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-2">7.3 Service Availability</h3>
                <p className="text-sm md:text-base leading-relaxed">
                  We do not guarantee that the App will be available at all times. The App may be unavailable due to maintenance, updates, or technical issues. We are not liable for any losses resulting from App unavailability.
                </p>
              </div>
            </div>
          </div>

          {/* Section 8 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">8. Limitation of Liability</h2>
            <div className="space-y-3 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li>Peymen is provided "as is" without warranties of any kind</li>
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid to use the App (currently $0, as the App is free)</li>
                <li>We are not responsible for any financial losses or decisions made based on App data</li>
              </ul>
            </div>
          </div>

          {/* Section 9 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">9. Termination</h2>
            <div className="space-y-3 text-slate-700">
              <p className="text-sm md:text-base leading-relaxed">
                We reserve the right to suspend or terminate your access to the App at any time, with or without notice, for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm md:text-base">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of the App or its services</li>
                <li>Any other reason we deem necessary</li>
              </ul>
              <p className="text-sm md:text-base mt-3 leading-relaxed">
                You may stop using the App at any time by revoking Gmail access and deleting the App from your device.
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">10. Governing Law</h2>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </div>

          {/* Section 11 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">11. Contact Information</h2>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
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
              By using Peymen, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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

export default TermsOfService;
