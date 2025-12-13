'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function RemindersSetupPage() {
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResults(null);
    try {
      const params = new URLSearchParams();
      if (testEmail) params.append('email', testEmail);
      if (testPhone) params.append('phone', testPhone);
      
      const response = await fetch(`/api/reminders/test?${params.toString()}`);
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/reminders"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Reminders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reminders Setup Guide
          </h1>
          <p className="text-gray-600">
            Configure Gmail and Twilio for automated reminders
          </p>
        </div>

        <div className="space-y-6">
          {/* Gmail Setup */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Gmail Email Setup
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 1: Enable 2-Factor Authentication</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                  <li>Go to <a href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">your Google Account</a></li>
                  <li>Navigate to <strong>Security</strong></li>
                  <li>Enable <strong>2-Step Verification</strong> if not already enabled</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 2: Generate App Password</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                  <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">App Passwords</a></li>
                  <li>Select <strong>Mail</strong> as the app</li>
                  <li>Select <strong>Other (Custom name)</strong> as the device</li>
                  <li>Enter "GearShift" as the name</li>
                  <li>Click <strong>Generate</strong></li>
                  <li>Copy the 16-character password (remove spaces when adding to .env.local)</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 3: Add to .env.local</h3>
                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                  <div>GMAIL_USER="your_email@gmail.com"</div>
                  <div>GMAIL_APP_PASSWORD="abcdefghijklmnop"</div>
                  <div>FROM_EMAIL="your_email@gmail.com"</div>
                  <div>FROM_NAME="TNT Apex Elite AutoCare"</div>
                </div>
              </div>
            </div>
          </div>

          {/* Twilio Setup */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Twilio SMS Setup
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 1: Create Twilio Account</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                  <li>Go to <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twilio</a> and sign up</li>
                  <li>Free account includes $15.50 credit for testing</li>
                  <li>Verify your email and phone number</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 2: Get a Phone Number</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                  <li>In Twilio Console, go to <strong>Phone Numbers</strong> → <strong>Manage</strong> → <strong>Buy a number</strong></li>
                  <li>Choose a number (US numbers are free for trial accounts)</li>
                  <li>Click <strong>Buy</strong> to get your number</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 3: Get Credentials</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                  <li>In Twilio Console, go to <strong>Account</strong> → <strong>API Keys & Tokens</strong></li>
                  <li>Copy your <strong>Account SID</strong> (starts with AC...)</li>
                  <li>Copy your <strong>Auth Token</strong> (click to reveal)</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 4: Add to .env.local</h3>
                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                  <div>TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</div>
                  <div>TWILIO_AUTH_TOKEN="your_auth_token_here"</div>
                  <div>TWILIO_PHONE_NUMBER="+1234567890"</div>
                  <div>TWILIO_MESSAGING_SERVICE_SID="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Note: Phone number should include country code (e.g., +1 for US). 
                  MessagingServiceSid is optional but recommended if you have one.
                </p>
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Test Your Configuration
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                After adding credentials to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>, 
                restart your dev server and test here:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Phone Number
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleTest}
                disabled={testing || (!testEmail && !testPhone)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Testing...' : 'Test Configuration'}
              </button>

              {testResults && (
                <div className={`p-4 rounded-md ${
                  testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <h4 className="font-semibold mb-2">
                    {testResults.success ? '✓ Test Results' : '✗ Test Failed'}
                  </h4>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
              <li>After adding credentials to <code className="bg-yellow-100 px-1 rounded">.env.local</code>, you must <strong>restart your dev server</strong> for changes to take effect</li>
              <li>Never commit <code className="bg-yellow-100 px-1 rounded">.env.local</code> to git (it's already in .gitignore)</li>
              <li>Gmail App Passwords are 16 characters - remove spaces when adding to .env.local</li>
              <li>Twilio trial accounts can only send SMS to verified phone numbers</li>
              <li>For production, consider upgrading to paid Twilio account for full SMS capabilities</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}


