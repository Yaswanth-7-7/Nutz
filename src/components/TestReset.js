import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TestReset = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestReset = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/test-reset', {
        email: email
      });

      setTestResult(response.data);
      toast.success('Test reset completed! Check console for details.');
      console.log('Test Reset Result:', response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Test failed';
      toast.error(message);
      console.error('Test Reset Error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Password Reset</h2>
          <p className="text-gray-600 mb-8">
            This page helps you test the OTP-based password reset functionality.
            Enter an email address to generate and send an OTP.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter email to test"
            />
          </div>

          <button
            onClick={handleTestReset}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Password Reset'}
          </button>

          {testResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Results:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Message:</strong> {testResult.message}</p>
                <p><strong>Email Sent:</strong> {testResult.emailSent ? 'Yes' : 'No'}</p>
                <p><strong>OTP:</strong> <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{testResult.otp}</span></p>
                <p><strong>Expires At:</strong> {new Date(testResult.expiresAt).toLocaleString()}</p>
                <p><strong>User ID:</strong> {testResult.userId}</p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Check your browser console for detailed logs. 
                  If email sending is not configured, the OTP will be logged instead of sent.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">How to Test:</h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Enter a registered email address</li>
              <li>Click "Test Password Reset"</li>
              <li>Check the console for OTP and email logs</li>
              <li>Use the OTP in the Reset Password page</li>
              <li>If email is configured, check your inbox for the OTP</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Next Steps:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>1. Copy the OTP from the test results or console</p>
              <p>2. Go to the Reset Password page</p>
              <p>3. Enter the email, OTP, and new password</p>
              <p>4. Verify the password reset works</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestReset; 