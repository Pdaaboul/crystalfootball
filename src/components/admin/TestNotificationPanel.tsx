'use client';

import { useState } from 'react';

export function TestNotificationPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ success: boolean; message: string; details?: Array<{ phone: string; success: boolean; error?: string }> } | null>(null);

  const sendTestAdminAlert = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'payment_pending',
          testData: {
            orderId: `TEST_${Date.now()}`,
            amount: '$49.99',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults({
          success: true,
          message: data.message,
          details: data.results,
        });
      } else {
        setResults({
          success: false,
          message: data.error || 'Failed to send test notification',
        });
      }
          } catch {
        setResults({
          success: false,
          message: 'Network error occurred while sending test notification',
        });
      } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">WhatsApp Test Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Test the notification system by sending alerts to all admin phone numbers
          </p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl">📱</span>
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className={`mb-4 p-4 rounded-lg border ${
          results.success 
            ? 'bg-success/10 border-success/20' 
            : 'bg-destructive/10 border-destructive/20'
        }`}>
          <p className={`text-sm font-medium ${
            results.success ? 'text-success' : 'text-destructive'
          }`}>
            {results.message}
          </p>
          
          {results.details && results.success && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Notification Results:</p>
              {results.details.map((result, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{result.phone}</span>
                  <span className={result.success ? 'text-success' : 'text-destructive'}>
                    {result.success ? '✓ Queued' : '✗ Failed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Button */}
      <div className="space-y-4">
        <button
          onClick={sendTestAdminAlert}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 px-4 rounded-lg font-medium transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong transform hover:scale-105 disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              <span>Sending Test Alert...</span>
            </div>
          ) : (
            'Send Test Admin Alert'
          )}
        </button>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-warning text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-warning text-sm font-medium">Test Mode</p>
              <p className="text-warning/80 text-xs mt-1">
                This will create notification_events records and log to console. 
                Actual WhatsApp messages are not sent yet (placeholder mode).
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Admin role verification (superadmin only)</li>
            <li>Environment variable parsing (ADMIN_WHATSAPP_E164_LIST)</li>
            <li>Database insertion via RPC (enqueue_notification)</li>
            <li>Notification queuing system</li>
            <li>Console logging for debugging</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 