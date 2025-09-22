'use client';

import { useState, useEffect } from 'react';
import { SubscriptionWithDetails, SubscriptionTimeInfo } from '@/lib/types/subscriptions';

interface SubscriptionStatusProps {
  subscription: SubscriptionWithDetails;
  timeInfo: SubscriptionTimeInfo;
}

export function SubscriptionStatus({ subscription, timeInfo }: SubscriptionStatusProps) {
  const [clientTimeInfo, setClientTimeInfo] = useState(timeInfo);

  // Client-side countdown that never goes negative
  useEffect(() => {
    if (subscription.status !== 'active' || !subscription.end_at) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = new Date(subscription.end_at!);
      const diffTime = expiresAt.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setClientTimeInfo({
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining <= 0,
        expiresAt,
      });
    }, 1000 * 60 * 60); // Update hourly

    return () => clearInterval(interval);
  }, [subscription.status, subscription.end_at]);

  if (subscription.status === 'pending') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-amber-600 text-sm">⏳</span>
          </div>
          <div>
            <h4 className="font-medium text-amber-800">Pending Review</h4>
            <p className="text-sm text-amber-700">
              Your subscription is awaiting admin approval. This usually takes 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (subscription.status === 'active') {
    const isNearExpiry = clientTimeInfo.daysRemaining <= 7;
    
    return (
      <div className={`border rounded-lg p-4 ${
        isNearExpiry 
          ? 'bg-amber-50 border-amber-200' 
          : 'bg-success/5 border-success/20'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isNearExpiry 
              ? 'bg-amber-100' 
              : 'bg-success/10'
          }`}>
            <span className={`text-sm ${
              isNearExpiry 
                ? 'text-amber-600' 
                : 'text-success'
            }`}>
              {isNearExpiry ? '⚠️' : '✅'}
            </span>
          </div>
          <div className="flex-1">
            <h4 className={`font-medium ${
              isNearExpiry 
                ? 'text-amber-800' 
                : 'text-success'
            }`}>
              Active Subscription
            </h4>
            <p className={`text-sm ${
              isNearExpiry 
                ? 'text-amber-700' 
                : 'text-success/80'
            }`}>
              {clientTimeInfo.daysRemaining > 0 
                ? `${clientTimeInfo.daysRemaining} days remaining`
                : 'Expires today'
              }
            </p>
          </div>
          {clientTimeInfo.daysRemaining > 0 && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                isNearExpiry 
                  ? 'text-amber-600' 
                  : 'text-success'
              }`}>
                {clientTimeInfo.daysRemaining}
              </div>
              <div className={`text-xs ${
                isNearExpiry 
                  ? 'text-amber-600' 
                  : 'text-success/80'
              }`}>
                days left
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (subscription.status === 'expired') {
    return (
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm">📅</span>
          </div>
          <div>
            <h4 className="font-medium text-muted-foreground">Subscription Expired</h4>
            <p className="text-sm text-muted-foreground">
              Your subscription has expired. Choose a new package to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (subscription.status === 'rejected') {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
            <span className="text-destructive text-sm">❌</span>
          </div>
          <div>
            <h4 className="font-medium text-destructive">Subscription Rejected</h4>
            <p className="text-sm text-destructive/80">
              Your subscription request was not approved. Please contact support or try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 