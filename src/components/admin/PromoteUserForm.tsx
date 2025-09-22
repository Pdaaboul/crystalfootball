'use client';

import { useState } from 'react';

export function PromoteUserForm() {
  const [userId, setUserId] = useState('');
  const [targetRole, setTargetRole] = useState<'admin' | 'user'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          role: targetRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setUserId('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user role' });
      }
            } catch {
          setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label htmlFor="userId" className="block text-sm font-medium text-foreground mb-2">
          User ID
        </label>
        <input
          id="userId"
          type="text"
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
          placeholder="Enter user UUID"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Find the user ID in the users list or database
        </p>
      </div>

      <div>
        <label htmlFor="targetRole" className="block text-sm font-medium text-foreground mb-2">
          Target Role
        </label>
        <select
          id="targetRole"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value as 'admin' | 'user')}
          className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
        >
          <option value="admin">Promote to Admin</option>
          <option value="user">Demote to User</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading || !userId}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors focus-visible-cyan"
      >
        {isLoading ? 'Processing...' : `${targetRole === 'admin' ? 'Promote' : 'Demote'} User`}
      </button>

      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <p className="text-warning text-sm">
          <strong>Warning:</strong> This action will immediately change the user&apos;s role and access permissions.
        </p>
      </div>
    </form>
  );
} 